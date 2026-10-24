import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
const root = path.resolve(process.cwd());
function ok(v,msg){ if(!v){ console.error('FAIL:',msg); process.exit(1); } }
for (const f of ['tajo-tap-logo.png','tajo-tap-mark.png','icon-192.png','icon-512.png','favicon-32.png','favicon-16.png']) {
  const p=path.join(root,'assets','images',f); ok(fs.existsSync(p), `missing ${f}`); const min=f.startsWith('favicon-16')?200:1000; ok(fs.statSync(p).size>min, `${f} seems empty`);
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
ok(html.includes('favicon-32.png'), 'main app favicon 32 missing');
const smart=fs.readFileSync(path.join(root,'server','public','smart-page.js'),'utf8');
ok(smart.includes('/assets/images/favicon-32.png'), 'Smart Page favicon missing');
ok(smart.includes('/assets/images/icon-192.png'), 'Smart Page apple touch icon missing');
const version=fs.readFileSync(path.join(root,'VERSION.txt'),'utf8').trim();
ok(/^10\.(?:2|[3-9]|[1-9]\d)\./.test(version) || /^1[1-9]\./.test(version), 'VERSION must be 10.2.0 or newer');
console.log('V10.2 branding checks passed');
