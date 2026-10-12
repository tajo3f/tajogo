import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

async function walk(dir) {
  const out = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) out.push(...await walk(full));
    else if (/\.(js|mjs)$/.test(item.name)) out.push(full);
  }
  return out;
}

const roots = ['api', 'server', 'assets/js', 'tests'];
const files = [];
for (const root of roots) files.push(...await walk(root));
for (const file of files) {
  if (file.endsWith('qr-core.js')) continue; // third-party/minified encoder, exercised by qr_check.js.
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`JS syntax check: OK (${files.length} files)`);
