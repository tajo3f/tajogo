import fs from 'node:fs';
import assert from 'node:assert/strict';

const publicPage = fs.readFileSync(new URL('../server/public/smart-page.js', import.meta.url), 'utf8');
const client = fs.readFileSync(new URL('../assets/js/smart-page.js', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../assets/js/app.js', import.meta.url), 'utf8');
const wifi = fs.readFileSync(new URL('../server/_wifi.js', import.meta.url), 'utf8');
const activation = fs.readFileSync(new URL('../server/public/activate.js', import.meta.url), 'utf8');

assert.ok(publicPage.includes('Conectar ao Wi-Fi'), 'Smart Page deve mostrar CTA Conectar ao Wi-Fi.');
assert.ok(publicPage.includes('data-connect-wifi'), 'CTA Wi-Fi deve expor o gatilho assistido.');
assert.ok(publicPage.includes('A conexão depende da confirmação do sistema do seu celular'), 'Smart Page deve comunicar a limitação real do SO.');
assert.ok(!publicPage.includes('Mostrar QR Wi-Fi'), 'Botão Mostrar QR Wi-Fi deve ser removido.');
assert.ok(!publicPage.includes('wifi-qr-canvas'), 'QR Wi-Fi público secundário deve ser removido da Smart Page.');
assert.ok(!client.includes('data-toggle-wifi-qr'), 'Handler antigo de QR Wi-Fi deve ser removido.');
assert.ok(client.includes('data-connect-wifi'), 'Cliente deve tratar o CTA de conexão.');
assert.ok(publicPage.includes('android.settings.WIFI_SETTINGS'), 'Android deve receber intent de Wi-Fi diretamente no gesto do usuário.');
assert.ok(client.includes('Senha copiada'), 'Fluxo deve preparar a senha antes da seleção da rede.');
assert.ok(client.includes('data-android-wifi-intent'), 'Cliente deve preservar o link Android sem impedir a navegação padrão.');
assert.ok(app.includes('TAJO SMART PAGE · V10.1'), 'Editor deve identificar V10.1.');
assert.ok(!app.includes('Gerar QR Wi-Fi direto'), 'Editor não deve oferecer segundo QR Wi-Fi.');
assert.ok(app.includes('wifiDirectQrEnabled:false'), 'Salvamento deve manter QR Wi-Fi direto desativado.');
assert.ok(wifi.includes('? false : Boolean(input.wifiDirectQrEnabled)'), 'Backend deve desabilitar QR direto por padrão.');
assert.ok(activation.includes('wifiDirectQrEnabled: false'), 'Ativação deve desabilitar QR Wi-Fi secundário.');

console.log('V10.1 Wi-Fi assisted-connect checks passed.');
