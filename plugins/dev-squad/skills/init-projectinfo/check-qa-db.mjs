#!/usr/bin/env node
// Checks that the QA scratch-database login (localhost / localhost on localhost:3306) works
// and may create and drop a `_qa_` database. Prints the setup SQL when it does not.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SETUP_SQL = `CREATE USER IF NOT EXISTS 'localhost'@'localhost' IDENTIFIED BY 'localhost';
GRANT ALL PRIVILEGES ON \`%\\_qa\\_%\`.* TO 'localhost'@'localhost';
FLUSH PRIVILEGES;`;

function findClient() {
  for (const name of ['mariadb', 'mysql']) {
    try {
      execFileSync(name, ['--version'], { stdio: 'ignore' });
      return name;
    } catch { /* not on PATH */ }
  }
  const roots = ['C:/Program Files', 'C:/Program Files (x86)'];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const dir of fs.readdirSync(root).filter((d) => /^MariaDB/i.test(d)).sort().reverse()) {
      const exe = path.join(root, dir, 'bin', 'mariadb.exe');
      if (fs.existsSync(exe)) return exe;
    }
  }
  return null;
}

const client = findClient();
if (!client) {
  console.log('QA DB CHECK: no MariaDB client found (mariadb/mysql on PATH or C:/Program Files/MariaDB*/bin). QA will report BLOCKED until MariaDB is installed.');
  process.exit(1);
}

const db = 'devsquad_qa_check';
const run = (sql) => execFileSync(client, ['-hlocalhost', '-P3306', '-ulocalhost', '-plocalhost', '-e', sql], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
try {
  run(`CREATE DATABASE IF NOT EXISTS ${db}; DROP DATABASE ${db};`);
  console.log(`QA DB CHECK: OK (client: ${client}). The localhost/localhost login can create and drop _qa_ databases.`);
} catch (e) {
  const msg = (e.stderr || e.message || '').toString().trim().split('\n')[0];
  console.log(`QA DB CHECK: FAILED (client: ${client}): ${msg}`);
  console.log('Ask the user to run this once as root, then re-run the check:\n' + SETUP_SQL);
  process.exit(1);
}
