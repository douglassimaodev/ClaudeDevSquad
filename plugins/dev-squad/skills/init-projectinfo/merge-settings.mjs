#!/usr/bin/env node
// Merges the dev-squad settings snippet into <project>/.claude/settings.json.
// Additive only: keeps every existing key and rule, adds missing permissions, marketplace and plugin entry.
// Usage: node merge-settings.mjs <projectRoot> [--dry-run]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const snippetPath = path.resolve(here, '../../templates/settings.snippet.json');
const projectRoot = path.resolve(process.argv[2] ?? process.cwd());
const dryRun = process.argv.includes('--dry-run');
const settingsPath = path.join(projectRoot, '.claude', 'settings.json');

const snippet = JSON.parse(fs.readFileSync(snippetPath, 'utf8'));
let settings = {};
if (fs.existsSync(settingsPath)) {
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch (e) {
    console.error(`ERROR: ${settingsPath} is not valid JSON (${e.message}). Fix it first; nothing was changed.`);
    process.exit(1);
  }
}

const added = [];
settings.extraKnownMarketplaces ??= {};
for (const [name, value] of Object.entries(snippet.extraKnownMarketplaces)) {
  const current = settings.extraKnownMarketplaces[name];
  if (!current) {
    settings.extraKnownMarketplaces[name] = value;
    added.push(`marketplace ${name}`);
    continue;
  }
  // Existing entry: add missing keys (e.g. autoUpdate), never change ones the project set.
  for (const [key, v] of Object.entries(value)) {
    if (!(key in current)) {
      current[key] = v;
      added.push(`marketplace ${name}: ${key}`);
    }
  }
}
settings.enabledPlugins ??= {};
for (const [id, value] of Object.entries(snippet.enabledPlugins)) {
  if (!(id in settings.enabledPlugins)) {
    settings.enabledPlugins[id] = value;
    added.push(`plugin ${id}`);
  }
}
settings.permissions ??= {};
for (const kind of ['allow', 'ask', 'deny']) {
  settings.permissions[kind] ??= [];
  const existing = new Set(Object.values(settings.permissions).flat());
  for (const rule of snippet.permissions[kind] ?? []) {
    // A rule already present under any kind is left where the project put it.
    if (!existing.has(rule)) {
      settings.permissions[kind].push(rule);
      added.push(`${kind}: ${rule}`);
    }
  }
}

const conflicts = Object.entries(settings.enabledPlugins)
  .filter(([id, on]) => on && id.startsWith('team-workflow@'))
  .map(([id]) => id);

if (!dryRun && added.length) {
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}
console.log(`${dryRun ? '[dry run] ' : ''}${settingsPath}`);
console.log(added.length ? `Added ${added.length}:\n  - ${added.join('\n  - ')}` : 'Already up to date; nothing added.');
if (conflicts.length) {
  console.log(`WARNING: ${conflicts.join(', ')} is also enabled. It injects its own dispatcher; disable one of the two plugins in this project.`);
}
