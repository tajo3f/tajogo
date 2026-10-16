import fs from 'node:fs';
import assert from 'node:assert/strict';
import { normalizeDestination } from '../server/_destination.js';

assert.equal(normalizeDestination('instagram','@tajodigital3f'),'https://instagram.com/tajodigital3f');
assert.equal(normalizeDestination('instagram','https://instagram.com/tajodigital3f/'),'https://instagram.com/tajodigital3f');
assert.equal(normalizeDestination('whatsapp','(27) 99999-9999'),'https://wa.me/5527999999999');
assert.equal(normalizeDestination('whatsapp','27999999999','Olá'),'https://wa.me/5527999999999?text=Ol%C3%A1');
assert.equal(normalizeDestination('map','Rua Sete de Setembro, Afonso Cláudio'),'https://www.google.com/maps/search/?api=1&query=Rua%20Sete%20de%20Setembro%2C%20Afonso%20Cl%C3%A1udio');
assert.equal(normalizeDestination('custom','https://example.com/x'),'https://example.com/x');
assert.throws(()=>normalizeDestination('custom','http://example.com'), /DESTINATION_URL_INVALID/);
assert.throws(()=>normalizeDestination('instagram','perfil inválido!'), /DESTINATION_INSTAGRAM_INVALID/);

const admin=fs.readFileSync(new URL('../server/admin/destination.js',import.meta.url),'utf8');
const client=fs.readFileSync(new URL('../server/client/destination.js',import.meta.url),'utf8');
const seller=fs.readFileSync(new URL('../server/seller/hub.js',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../assets/js/app.js',import.meta.url),'utf8');

assert.ok(!admin.includes('supabaseRpc('),'admin destination must not depend on RPC');
assert.ok(!client.includes('supabaseRpc('),'client destination must not depend on RPC');
assert.ok(seller.includes('changePlateDestination'),'seller destination must use shared destination engine');
assert.ok(app.includes('destinationEditFields'),'frontend must render type-specific destination fields');
assert.ok(app.includes('await refreshRoleData()'),'frontend must refresh state after destination change');
assert.ok(app.includes('A Smart Page não é apagada'),'Smart Page preservation UX missing');
console.log('V7.1 destination switching: OK');
