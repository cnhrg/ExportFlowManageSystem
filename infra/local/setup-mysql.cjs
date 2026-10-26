'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { appendOnly } = require('../../doc/sql/domain/generate.cjs');
const base = path.join(os.homedir(), 'Library/ExportTradeLocal');
const bin = '/opt/homebrew/opt/mysql@8.4/bin';
const label = 'com.export-trade.mysql';
const launchDomain = 'gui/' + process.getuid();
const agent = path.join(os.homedir(), 'Library/LaunchAgents', label + '.plist');
const config = path.join(base, 'mysql.cnf');
const xml = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const run = (command, args, input) => execFileSync(command, args, { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
const write = (name, content) => fs.writeFileSync(path.join(base, name), content, { mode: 0o600, flag: 'wx' });
async function waitForMysql() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      run(bin + '/mysqladmin', ['--no-defaults', '--socket=' + base + '/mysql.sock', '-uroot', 'ping']);
      return;
    } catch (error) {
      if (attempt === 59) throw new Error('MySQL startup timed out; inspect private mysql.log');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}
async function main() {
  const resume = process.argv.includes('--resume-bootstrap');
  if (!resume && (fs.existsSync(config) || fs.existsSync(agent))) throw new Error('Existing local instance detected; refusing to replace configuration');
  if (resume && (!fs.existsSync(config) || !fs.existsSync(agent))) throw new Error('No interrupted bootstrap to resume');
  fs.mkdirSync(base, { recursive: true, mode: 0o700 });
  fs.chmodSync(base, 0o700);
  if (!resume) fs.mkdirSync(path.join(base, 'mysql-data'), { mode: 0o700 });
  const savedPassword = name => {
    const match = fs.readFileSync(path.join(base, name), 'utf8').match(/^password=([a-f0-9]{64})$/m);
    if (!match) throw new Error('Invalid private bootstrap credential file');
    return match[1];
  };
  const rootPassword = resume ? savedPassword('root-client.cnf') : randomBytes(32).toString('hex');
  const appPassword = resume ? savedPassword('client.cnf') : randomBytes(32).toString('hex');
  const settings = `[mysqld]
basedir=/opt/homebrew/opt/mysql@8.4
datadir=${base}/mysql-data
socket=${base}/mysql.sock
pid-file=${base}/mysql.pid
log-error=${base}/mysql.log
bind-address=127.0.0.1
port=3307
mysqlx=OFF
skip-name-resolve=ON
default-time-zone=+00:00
init-connect="SET time_zone = '+00:00'"
character-set-server=utf8mb4
collation-server=utf8mb4_0900_bin
innodb-flush-log-at-trx-commit=1
sync-binlog=1
log-bin=${base}/mysql-data/binlog
binlog-expire-logs-seconds=604800
max-binlog-size=268435456
local-infile=OFF
secure-file-priv=NULL
`;
  // Bootstrap over a private socket only; TCP stays disabled until passwords exist.
  if (!resume) {
    write('mysql.cnf', settings + 'skip-networking=ON\n');
    write('root-client.cnf', `[client]\nuser=root\npassword=${rootPassword}\nsocket=${base}/mysql.sock\nprotocol=SOCKET\ndefault-character-set=utf8mb4\n`);
    write('client.cnf', `[client]\nuser=export_trade_app\npassword=${appPassword}\nhost=127.0.0.1\nport=3307\nprotocol=TCP\ndefault-character-set=utf8mb4\ndatabase=export_trade\n`);
    run(bin + '/mysqld', ['--no-defaults', '--basedir=/opt/homebrew/opt/mysql@8.4', '--datadir=' + base + '/mysql-data', '--initialize-insecure']);
    fs.writeFileSync(agent, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${label}</string>
<key>ProgramArguments</key><array><string>${bin}/mysqld</string><string>--defaults-file=${xml(config)}</string></array>
<key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
<key>ThrottleInterval</key><integer>10</integer>
<key>StandardOutPath</key><string>${xml(base)}/mysql-launch.log</string>
<key>StandardErrorPath</key><string>${xml(base)}/mysql-launch.log</string>
</dict></plist>
`, { mode: 0o600, flag: 'wx' });
    run('/bin/launchctl', ['bootstrap', launchDomain, agent]);
  }
  run('/bin/launchctl', ['kickstart', launchDomain + '/' + label]);
  await waitForMysql();
  const args = ['--defaults-file=' + base + '/root-client.cnf'];
  try {
    run(bin + '/mysql', [...args, '-e', 'SELECT 1;']);
  } catch (error) {
    if (!String(error.stderr).includes('ERROR 1045')) throw error;
    run(bin + '/mysql', ['--no-defaults', '--socket=' + base + '/mysql.sock', '-uroot'],
      `ALTER USER 'root'@'localhost' IDENTIFIED BY '${rootPassword}';\n`);
  }
  const existing = run(bin + '/mysql', [...args, '-NBe', "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='export_trade';"]).trim();
  if (existing === '0') run(bin + '/mysql', args, "CREATE DATABASE export_trade CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin;\n");
  const count = run(bin + '/mysql', [...args, '-NBe', "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='export_trade';"]).trim();
  if (count !== '0') throw new Error('Database already has tables; refusing to overwrite or reapply DDL');
  run(bin + '/mysql', [...args, 'export_trade'], fs.readFileSync(path.join(__dirname, '../../doc/sql/domain/schema.sql'), 'utf8'));
  const model = require('../../doc/sql/domain/generate.cjs').tables();
  const grants = model.map(table => `GRANT SELECT, INSERT${appendOnly.has(table.name) ? '' : ', UPDATE'} ON export_trade.\`${table.name}\` TO 'export_trade_app'@'127.0.0.1';`);
  run(bin + '/mysql', args, `CREATE USER 'export_trade_app'@'127.0.0.1' IDENTIFIED BY '${appPassword}';\n` + grants.join('\n'));
  fs.writeFileSync(config, settings, { mode: 0o600 });
  run('/bin/launchctl', ['kickstart', '-k', launchDomain + '/' + label]);
  await waitForMysql();
  const ready = run(bin + '/mysql', ['--defaults-file=' + base + '/client.cnf', '--batch', '--skip-column-names', '-e', 'SELECT DATABASE(), @@port, @@time_zone;']);
  console.log('Local MySQL ready: ' + ready.trim() + '\nPrivate credentials: ' + base + '/client.cnf');
}
main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
