'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash, randomBytes } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const base = path.join(os.homedir(), 'Library/ExportTradeLocal');
const credentialsFile = path.join(base, 'observability-credentials.json');
const schemaHash = 'aa08c3fd66e851543378e96f1ca925d71a728af6d5dc5deca44375cca594ba7d';
const secret = () => randomBytes(24).toString('hex');
const hash = value => createHash('sha256').update(value).digest('hex');
const privateWrite = (name, value) => fs.writeFileSync(path.join(base, name), value, { mode: 0o600, flag: 'wx' });
async function main() {
  if (!fs.existsSync(path.join(base, 'rustfs.env'))) throw new Error('Run setup-containers.cjs first');
  fs.chmodSync(base, 0o700);
  if (!fs.existsSync(credentialsFile)) {
    const volumes = execFileSync('docker', ['--context', 'colima', 'volume', 'ls', '--format', 'json'], { encoding: 'utf8' })
      .trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
    if (volumes.some(volume => ['export-trade-local_scheduler-db-data', 'export-trade-local_grafana-data'].includes(volume.Name))) {
      throw new Error('Existing persistent volumes without credentials; restore private credentials, never silently replace them');
    }
    const response = await fetch('https://raw.githubusercontent.com/xuxueli/xxl-job/3.3.1/doc/db/tables_xxl_job.sql',
      { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error('Official scheduler schema download failed: ' + response.status);
    const source = await response.text();
    if (hash(source) !== schemaHash) throw new Error('Official scheduler schema checksum mismatch');
    const marker = source.indexOf('INSERT INTO `xxl_job_group`');
    if (marker < 0) throw new Error('Unexpected scheduler schema structure');
    const credentials = {
      grafana: { username: 'admin', password: secret() },
      scheduler: { username: 'admin', password: randomBytes(15).toString('base64url'), access_token: secret() },
      scheduler_database: { username: 'xxl_job', password: secret(), root_password: secret() }
    };
    fs.mkdirSync(path.join(base, 'xxl-init'), { mode: 0o700 });
    // Preserve upstream DDL; replace ALL demo jobs/users with a random admin and mandatory lock.
    privateWrite('xxl-init/01-schema.sql', source.slice(0, marker) +
      `INSERT INTO xxl_job_lock(lock_name) VALUES ('schedule_lock');\n` +
      `INSERT INTO xxl_job_user(username,password,role) VALUES ('admin','${hash(credentials.scheduler.password)}',1);\n`);
    privateWrite('scheduler-db.env',
      `MYSQL_DATABASE=xxl_job\nMYSQL_USER=xxl_job\nMYSQL_PASSWORD=${credentials.scheduler_database.password}\nMYSQL_ROOT_PASSWORD=${credentials.scheduler_database.root_password}\n`);
    privateWrite('xxl-job.env',
      `SPRING_DATASOURCE_PASSWORD=${credentials.scheduler_database.password}\nXXL_JOB_ACCESSTOKEN=${credentials.scheduler.access_token}\n`);
    privateWrite('grafana.env', `GF_SECURITY_ADMIN_USER=admin\nGF_SECURITY_ADMIN_PASSWORD=${credentials.grafana.password}\n`);
    privateWrite('observability-credentials.json', JSON.stringify(credentials, null, 2) + '\n');
  }
  execFileSync('/opt/homebrew/opt/docker-compose/bin/docker-compose', [
    '--context', 'colima', '-f', path.join(__dirname, 'compose.yaml'),
    '-f', path.join(__dirname, 'observability/compose.yaml'), 'up', '-d', '--wait', '--wait-timeout', '300'
  ], { env: { ...process.env, LOCAL_INFRA_DIR: base }, stdio: 'inherit' });
  console.log('Monitoring/logging/scheduler started; private credentials: ' + credentialsFile);
}
main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
