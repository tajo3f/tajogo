import fs from 'node:fs';
import assert from 'node:assert/strict';

const publicPage = fs.readFileSync(new URL('../server/public/smart-page.js', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../assets/js/app.js', import.meta.url), 'utf8');
const smart = fs.readFileSync(new URL('../server/_smart.js', import.meta.url), 'utf8');

for (const marker of [
  'bio-shell',
  'bio-hero',
  'bio-action-featured',
  'Atendimento rápido',
  'Chamar no WhatsApp',
  'bio-ticker',
  'bio-service-grid',
  'Desenvolvido por TAJO DIGITAL 3F',
  'wifi-qr-canvas',
  'prefers-reduced-motion'
]) assert.ok(publicPage.includes(marker), `V10 Smart Page marker ausente: ${marker}`);

assert.ok(publicPage.includes("buttonHref(slug,'maps')"), 'Localização precisa manter tracking interno.');
assert.ok(publicPage.includes("card(slug, 'google-review'"), 'Avaliação Google precisa continuar disponível.');
assert.ok(publicPage.includes("card(slug, 'instagram'"), 'Instagram precisa continuar disponível.');
assert.ok(publicPage.includes("customCards(slug, page.custom_links)"), 'Links personalizados precisam ser renderizados.');
assert.ok(publicPage.includes('getWifiProfileBySmartPage'), 'Wi-Fi Connect precisa continuar integrado.');
assert.ok(publicPage.includes('tap_smart_page_events'), 'Analytics de visualização precisa permanecer ativo.');

assert.ok(app.includes('TAJO SMART PAGE · V10'), 'Editor deve identificar a V10.');
assert.ok(app.includes('Rótulo | URL | Descrição'), 'Editor V10 deve aceitar descrição em links extras.');
assert.ok(app.includes('Serviços — Nome | Descrição'), 'Editor V10 deve aceitar descrição dos serviços.');
assert.ok(app.includes('const description=parts.join'), 'Parser de links deve preservar descrição.');
assert.ok(smart.includes('const description = clean(item.description'), 'Sanitização de descrições precisa continuar no backend.');

console.log('V10 Smart Page premium checks passed.');
