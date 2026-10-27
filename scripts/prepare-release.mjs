import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const notes = JSON.parse(readFileSync(new URL('src/release-notes.json', root), 'utf8'));
if (!/^\d+\.\d+\.\d+(?:[-.][\w.]+)?$/.test(notes.version) ||
    typeof notes.title !== 'string' || !Array.isArray(notes.changes) ||
    !notes.changes.length || notes.changes.some(change => typeof change !== 'string' || !change.trim())) {
  throw new Error('Completa la versión, título y novedades en src/release-notes.json antes de publicar.');
}
const config = JSON.parse(readFileSync(new URL('ngsw-config.json', root), 'utf8'));
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
config.appData = { ...notes, commit, builtAtUtc: new Date().toISOString() };
writeFileSync(new URL('ngsw.release.json', root), JSON.stringify(config, null, 2) + '\n');
console.log('Preparada versión ' + notes.version + ' con novedades para el service worker.');
