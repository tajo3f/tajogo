process.env.TAJO_WIFI_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const { buildWifiPayload, normalizeWifiConfig } = await import('../server/_wifi.js');

const fail = (msg) => { throw new Error(msg); };
const wpa = normalizeWifiConfig({wifiMode:'hybrid',wifiSsid:'Rede Visitante',wifiSecurity:'WPA',wifiPassword:'senha1234',wifiHidden:false});
if (wpa.ssid !== 'Rede Visitante') fail('SSID normalization failed');
const payload = buildWifiPayload({ssid:'Rede;Visitante',security:'WPA',password:'abc;12345',hidden:true});
if (payload !== 'WIFI:T:WPA;S:Rede\\;Visitante;P:abc\\;12345;H:true;;') fail(`Unexpected WPA payload: ${payload}`);
const openPayload = buildWifiPayload({ssid:'WiFi Livre',security:'nopass',password:'',hidden:false});
if (openPayload !== 'WIFI:T:nopass;S:WiFi Livre;H:false;;') fail(`Unexpected open payload: ${openPayload}`);
let rejected = false;
try { normalizeWifiConfig({wifiMode:'wifi',wifiSsid:'Rede',wifiSecurity:'WPA',wifiPassword:'123'}); } catch (e) { rejected = e.code === 'WIFI_PASSWORD_INVALID'; }
if (!rejected) fail('Weak WPA password not rejected');
rejected = false;
try { normalizeWifiConfig({wifiMode:'wifi',wifiSsid:'x'.repeat(33),wifiSecurity:'nopass'}); } catch (e) { rejected = e.code === 'WIFI_SSID_INVALID'; }
if (!rejected) fail('SSID > 32 bytes not rejected');
console.log('Wi-Fi payload/validation unit test: OK');
