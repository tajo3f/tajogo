import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const checks=[
  ['migration Smart Page',read('supabase/migrations/008_v6_smart_page_and_customer_access.sql').includes('create table if not exists public.tap_smart_pages')],
  ['migration analytics',read('supabase/migrations/008_v6_smart_page_and_customer_access.sql').includes('tap_smart_page_events')],
  ['migration e-mail venda',read('supabase/migrations/008_v6_smart_page_and_customer_access.sql').includes('customer_email')],
  ['rota pública /bio',read('vercel.json').includes('/bio/:slug')],
  ['rota click tracking',read('vercel.json').includes('/bio/:slug/go/:key')],
  ['API Smart Pages',read('api/index.js').includes("['smart-pages', smartPages]")],
  ['seller exige e-mail cliente',read('server/seller/hub.js').includes('customer_email=validEmail')],
  ['seller cria Smart Page',read('server/seller/hub.js').includes('ensureSmartPage')],
  ['seller edita destino próprio',read('server/seller/hub.js').includes("kind==='destination'")],
  ['cliente recebe convite por e-mail',read('server/_auth.js').includes('claimPendingClientInvites')],
  ['frontend editor Smart Page',read('assets/js/app.js').includes('smart-page-form')],
  ['frontend vendedor Smart Pages',read('assets/js/app.js').includes("'seller-smart'")],
  ['crédito do desenvolvedor',read('server/public/smart-page.js').includes('Sistema desenvolvido por João Paulo Brandão')],
  ['serverless única preservada',fs.existsSync(path.join(root,'api/index.js'))]
];
let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'OK':'FAIL'} - ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);
console.log('V6 Smart Page + acesso por e-mail: OK');
