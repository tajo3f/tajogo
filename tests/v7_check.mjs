import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const checks = [];
const add = (name, ok) => checks.push([name, Boolean(ok)]);

const migration = read('supabase/migrations/010_v7_wifi_connect.sql');
const wifi = read('server/_wifi.js');
const activate = read('server/public/activate.js');
const pages = read('server/smart-pages.js');
const publicPage = read('server/public/smart-page.js');
const publicJs = read('assets/js/smart-page.js');
const app = read('assets/js/app.js');
const env = read('.env.example');
const health = read('server/health.js');
const vercel = read('vercel.json');

add('migration 010 presente', migration.includes('create table if not exists public.tap_wifi_profiles'));
add('senha Wi-Fi cifrada no schema', migration.includes('password_ciphertext') && migration.includes('password_iv') && migration.includes('password_tag'));
add('SSID limitado a 32 bytes', migration.includes('octet_length(ssid) between 1 and 32'));
add('RLS e browser bloqueado', migration.includes('enable row level security') && migration.includes('revoke all on public.tap_wifi_profiles from anon, authenticated'));
add('updated_at automático', migration.includes('tap_wifi_profiles_updated_at'));
add('AES-256-GCM', wifi.includes("createCipheriv('aes-256-gcm'") && wifi.includes("createDecipheriv('aes-256-gcm'"));
add('chave Wi-Fi somente servidor', wifi.includes('TAJO_WIFI_ENCRYPTION_KEY') && env.includes('TAJO_WIFI_ENCRYPTION_KEY'));
add('payload Wi-Fi nativo', wifi.includes('WIFI:T:') && wifi.includes('buildWifiPayload'));
add('modo aberto sem campo P', wifi.includes('WIFI:T:nopass;S:${ssid};H:${hidden};;'));
add('ativação V7', activate.includes("activationEngine: 'REST_V7'") && activate.includes("'wifi', 'hybrid'"));
add('Smart Page + Wi-Fi persistido', activate.includes('upsertWifiProfile') && pages.includes('upsertWifiProfile'));
add('V7 não grava nova senha Wi-Fi em plaintext legado', pages.includes('patch.wifi_password=null') && pages.includes('patch.wifi_name=null'));
add('Smart Page pública renderiza Wi-Fi', publicPage.includes('wifiSection(wifi)') && publicPage.includes('wifi-qr-canvas'));
add('QR Wi-Fi público sem script inline', publicPage.includes('/assets/js/qr-core.js') && publicPage.includes('/assets/js/smart-page.js'));
add('JS público gera QR Wi-Fi', publicJs.includes('wifi-qr-canvas') && publicJs.includes('TajoQRCodeCore'));
add('UI possui Wi-Fi e híbrido', app.includes("['hybrid','Smart Page + Wi-Fi'") && app.includes("['wifi','Wi-Fi Connect'"));
add('download do QR Wi-Fi', app.includes('downloadPayloadQR') && app.includes('download-payload-qr'));
add('aviso de QR separado', app.includes('O QR Wi-Fi direto é separado do QR dinâmico principal'));
add('health informa subsistema Wi-Fi sem expor segredo', health.includes("wifiConnect:") && !health.includes('TAJO_WIFI_ENCRYPTION_KEY:'));
add('rota /bio preservada', vercel.includes('/bio/:slug'));
add('crédito do desenvolvedor preservado', publicPage.includes('Sistema desenvolvido por João Paulo Brandão'));

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'OK' : 'FAIL'} - ${name}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log('V7 Wi-Fi Connect + Smart Page: OK');
