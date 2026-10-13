import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const app=read('assets/js/app.js');
const batches=read('server/admin/batches.js');
const seller=read('server/seller/hub.js');
const ops=read('server/admin/operations.js');
const api=read('api/index.js');
const migration=read('supabase/migrations/007_v5_distribution_and_operations.sql');
const checks=[
  ['dashboard operacional',app.includes('O que precisa ser feito agora')&&ops.includes('awaiting_activation')&&ops.includes('no_scan_30d')],
  ['central de produção',app.includes('Linha de produção')&&app.includes('Enviada para impressão')&&app.includes('Arquivo de impressão')],
  ['lote por vendedor',batches.includes('resolveSellerByEmail')&&batches.includes('seller_id:seller?.id')&&migration.includes('assigned_email')],
  ['isolamento de vendedor',seller.includes('seller_id=eq.${encodeURIComponent(sid)}')&&seller.includes('PLATE_NOT_ASSIGNED')],
  ['vendedor sem criação de placas',seller.includes("kind==='sale'")&&!seller.includes("tap_plates?select=id,code', {\n        method: 'POST'")],
  ['status físico por unidade',migration.includes("'generated','sent_to_print','produced','in_stock','sold','delivered','activated'")&&batches.includes("kind==='plate-stage'")],
  ['rota operações em função única',api.includes("['admin/operations', adminOperations]")],
  ['arquivo impressão 10x8 configurável',app.includes('width:${width}cm;height:${height}cm')&&app.includes('10 × 8 cm')],
  ['crédito do desenvolvedor',app.includes('Sistema desenvolvido por <strong>João Paulo Brandão</strong>')]
];
let failed=false; for(const [name,ok] of checks){console.log(`${ok?'OK':'FAIL'} - ${name}`);if(!ok)failed=true;} if(failed)process.exit(1);
