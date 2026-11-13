#!/usr/bin/env node
// Bumps the dev-squad version in plugin.json and marketplace.json and moves the
// CHANGELOG "Unreleased" notes under the new version.
//   node scripts/bump-version.mjs [patch|minor|major]   manual bump (default patch)
//   node scripts/bump-version.mjs --hook                 used by .githooks/pre-commit:
//     bumps only when staged changes touch plugins/dev-squad/ and the version was not already changed.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pluginJson = path.join(root, 'plugins/dev-squad/.claude-plugin/plugin.json');
const marketJson = path.join(root, '.claude-plugin/marketplace.json');
const changelog = path.join(root, 'CHANGELOG.md');
const git = (cmd) => execSync(`git ${cmd}`, { cwd: root, encoding: 'utf8' }).trim();

const hook = process.argv.includes('--hook');
const level = process.argv.find((a) => ['patch', 'minor', 'major'].includes(a)) ?? process.env.BUMP ?? 'patch';

const current = JSON.parse(fs.readFileSync(pluginJson, 'utf8')).version;
let staged = [];

if (hook) {
  staged = git('diff --cached --name-only').split('\n').filter(Boolean);
  const pluginFiles = staged.filter((f) => f.startsWith('plugins/dev-squad/') && !f.includes('/evals/results/'));
  if (!pluginFiles.length) process.exit(0);
  let headVersion = null;
  try {
    headVersion = JSON.parse(git('show HEAD:plugins/dev-squad/.claude-plugin/plugin.json')).version;
  } catch { /* first commit */ }
  if (headVersion === null || headVersion !== current) process.exit(0); // already bumped by hand
  staged = pluginFiles;
}

const [maj, min, pat] = current.split('.').map(Number);
const next = level === 'major' ? `${maj + 1}.0.0` : level === 'minor' ? `${maj}.${min + 1}.0` : `${maj}.${min}.${pat + 1}`;

for (const file of [pluginJson, marketJson]) {
  const text = fs.readFileSync(file, 'utf8');
  const updated = file === pluginJson
    ? text.replace(/("version"\s*:\s*")[^"]+(")/, `$1${next}$2`)
    : text.replace(/("name"\s*:\s*"dev-squad"[\s\S]*?"version"\s*:\s*")[^"]+(")/, `$1${next}$2`);
  fs.writeFileSync(file, updated);
}

// CHANGELOG: "## [Unreleased]" notes become "## [next] - date"; a fresh empty Unreleased goes on top.
const today = new Date().toISOString().slice(0, 10);
let log = fs.existsSync(changelog) ? fs.readFileSync(changelog, 'utf8') : '# Changelog\n\n## [Unreleased]\n';
const m = log.match(/## \[Unreleased\]\n([\s\S]*?)(?=\n## \[|$)/);
let notes = (m?.[1] ?? '').trim();
if (!notes) {
  const files = staged.length ? staged : ['(manual bump)'];
  notes = `### Changed\n${files.map((f) => `- ${f.replace('plugins/dev-squad/', '')}`).join('\n')}`;
}
const section = `## [Unreleased]\n\n## [${next}] - ${today}\n\n${notes}\n`;
log = m ? log.replace(m[0], section) : log.replace(/^# Changelog\n/, `# Changelog\n\n${section}`);
fs.writeFileSync(changelog, log);

if (hook) git(`add "${pluginJson}" "${marketJson}" "${changelog}"`);
console.log(`dev-squad version ${current} -> ${next}`);
