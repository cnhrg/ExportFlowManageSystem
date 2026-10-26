'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const base = path.join(os.homedir(), 'Library/ExportTradeLocal');
fs.mkdirSync(base, { recursive: true, mode: 0o700 });
fs.chmodSync(base, 0o700);
const file = path.join(base, 'rustfs.env');
if (!fs.existsSync(file)) {
  fs.writeFileSync(file, 'RUSTFS_ACCESS_KEY=localadmin' + randomBytes(8).toString('hex') +
    '\nRUSTFS_SECRET_KEY=' + randomBytes(32).toString('hex') + '\n', { mode: 0o600, flag: 'wx' });
}
execFileSync('/opt/homebrew/opt/docker-compose/bin/docker-compose', [
  '--context', 'colima', '-f', path.join(__dirname, 'compose.yaml'), 'up', '-d', '--wait', '--wait-timeout', '300'
], { env: { ...process.env, LOCAL_INFRA_DIR: base }, stdio: 'inherit' });
console.log('Private S3 administrator credentials: ' + file);
