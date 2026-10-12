import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const app = read('assets/js/app.js');
const router = read('api/index.js');
const vercel = read('vercel.json');
const activation = read('server/public/activate.js');
const migration = read('supabase/migrations/004_activation_v4_and_batches.sql');

const activationEnginePresent = activation.includes('REST_V4_4') || (
  activation.includes('tap_validate_activation_pin_v4') && activation.includes('tap_activate_plate_v4')
);

const required = [
  [app, "['production','printer','Produção']", 'menu Produção'],
  [app, 'data-action="new-batch"', 'ação Novo lote'],
  [app, 'downloadBatchMap', 'exportação do mapa interno'],
  [router, "['admin/batches', adminBatches]", 'rota admin/batches'],
  [vercel, '/api/admin/batches', 'rewrite admin/batches'],
  [migration, 'create table if not exists public.tap_plate_batches', 'tabela de lotes'],
  [migration, 'retry_after timestamptz', 'retry_after timestamptz']
];

for (const [content, token, label] of required) {
  if (!content.includes(token)) throw new Error(`V4.1 check failed: ${label}`);
}
if (!activationEnginePresent) throw new Error('V4.1 check failed: motor de ativação ausente');
console.log('V4.1 activation/batch compatibility check: OK');
