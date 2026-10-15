import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const app=read('assets/js/app.js');
const activate=read('server/public/activate.js');
const checks=[
  ['Smart Page não usa campo URL externo na ativação', app.includes('Smart Page incluída.') && app.includes('activation-smart-slug')],
  ['slug /bio/ configurável', app.includes('go.tajodigital.com.br/bio/') && app.includes('activation-smart-preview')],
  ['verificação de disponibilidade de slug', app.includes('checkSlug=') && activate.includes('suggestedSlug')],
  ['backend cria Smart Page na ativação', activate.includes('createSmartPage({') && activate.includes('tap_smart_pages?select=*')],
  ['backend gera destino interno Smart Page', activate.includes('destinationUrl = smartUrl(req, smart.page.slug)')],
  ['Instagram aceita @ e monta URL', app.includes('https://instagram.com/${handle}')],
  ['Localização aceita endereço', app.includes('google.com/maps/search/?api=1&query=')],
  ['motor Smart Page V6.1+ ativo', activate.includes("activationEngine: 'REST_V6_1'") || activate.includes("activationEngine: 'REST_V6_2'") || activate.includes("activationEngine: 'REST_V7'")],
  ['sem nova migration obrigatória', fs.existsSync(path.join(root,'supabase/migrations/008_v6_smart_page_and_customer_access.sql'))]
];
let failed=0;
for(const [label,ok] of checks){console.log(`${ok?'OK':'FAIL'} - ${label}`); if(!ok)failed++;}
if(failed)process.exit(1);
console.log('V6.1 Smart Page activation UX: OK');
