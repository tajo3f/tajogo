import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const css = fs.readFileSync(path.join(root,'assets/css/app.css'),'utf8');
const js = fs.readFileSync(path.join(root,'assets/js/app.js'),'utf8');
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const manifest = fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8');

function ok(cond, msg){ if(!cond){ console.error('FAIL:',msg); process.exit(1); } }

ok(css.includes('.activate-card { color-scheme: dark; }'), 'activation card must force dark form scheme');
ok(css.includes('-webkit-text-fill-color:#f4f7f5'), 'mobile activation inputs must force visible text color');
ok(css.includes('input:-webkit-autofill'), 'Safari/Chrome autofill styling must be handled');
ok(js.includes("'activation-phone':'phone'"), 'activation phone must sync while typing');
ok(js.includes("'activation-company':'companyName'"), 'activation company must sync while typing');
ok(js.includes("data-activation-key=\"email\""), 'existing-account email must persist through rerenders');
ok(js.includes("data-activation-key=\"phone\""), 'existing-account phone must persist through rerenders');
ok(html.includes('TAJO TAP BUSINESS — Painel e Ativação'), 'page title must use official BUSINESS brand');
ok(manifest.includes('"name": "TAJO TAP BUSINESS"'), 'PWA manifest must use official BUSINESS brand');
for (const file of ['tajo-tap-logo.png','tajo-tap-mark.png','icon-192.png','icon-512.png']) {
  ok(fs.existsSync(path.join(root,'assets/images',file)), `${file} must exist`);
  ok(fs.statSync(path.join(root,'assets/images',file)).size > 1000, `${file} must not be empty`);
}
console.log('V8.1 mobile activation + branding checks passed.');
