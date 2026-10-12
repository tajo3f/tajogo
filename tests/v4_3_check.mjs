import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/006_activation_v4_3_hotfix.sql'), 'utf8');
const activate = fs.readFileSync(path.join(root, 'server/public/activate.js'), 'utf8');

const checks = [
  [migration.includes('on conflict on constraint tap_client_members_pkey'), 'usa constraint explícita no ON CONFLICT'],
  [migration.includes('where ac.plate_id = v_plate.id'), 'qualifica plate_id em activation_codes'],
  [migration.includes('where d.plate_id = v_plate.id'), 'qualifica plate_id em destinations'],
  [migration.includes("notify pgrst, 'reload schema'"), 'força reload do schema PostgREST'],
  [activate.includes('ACTIVATION_RPC_NOT_AVAILABLE'), 'distingue RPC ausente'],
  [activate.includes('ACTIVATION_DATABASE_ERROR'), 'distingue erro SQL de migration ausente'],
  [!activate.includes('Execute a migration 004_activation_v4_and_batches.sql.'), 'remove diagnóstico incorreto da migration 004']
];

let failed = false;
for (const [ok, label] of checks) {
  if (!ok) { console.error('FAIL:', label); failed = true; }
  else console.log('OK:', label);
}
if (failed) process.exit(1);
console.log('V4.3 activation hotfix: OK');
