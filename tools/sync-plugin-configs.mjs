import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { CONFIG_FILES, SOURCE_REPOSITORY, SOURCE_REF } from './config-sync-map.mjs';

const toolDir = dirname(fileURLToPath(import.meta.url));
const siteRoot = process.argv[3] ? resolve(process.argv[3]) : resolve(toolDir, '..');
const pluginRoot = resolve(process.argv[2] || 'plugin-source');
const statePath = resolve(siteRoot, 'synced-configs/.sync-state.json');

if (!existsSync(pluginRoot)) {
  throw new Error(`Plugin checkout not found: ${pluginRoot}`);
}

let changed = 0;
for (const file of CONFIG_FILES) {
  if (!file.source) continue;
  const from = resolve(pluginRoot, file.source);
  const to = resolve(siteRoot, file.target);
  if (!existsSync(from)) throw new Error(`Required plugin default is missing: ${file.source}`);
  const source = readFileSync(from);
  const current = existsSync(to) ? readFileSync(to) : null;
  if (!current || !current.equals(source)) {
    mkdirSync(dirname(to), { recursive: true });
    writeFileSync(to, source);
    changed += 1;
    console.log(`synced ${file.id}`);
  }
}

if (changed) {
  let commit = '';
  try { commit = execFileSync('git', ['-C', pluginRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}
  const state = {
    schemaVersion: 1,
    sourceRepository: SOURCE_REPOSITORY,
    sourceRef: SOURCE_REF,
    sourceCommit: commit || null,
    filesChanged: changed
  };
  writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n', 'utf8');
}
console.log(changed ? `Updated ${changed} config file(s).` : 'Config defaults already match the plugin checkout.');
