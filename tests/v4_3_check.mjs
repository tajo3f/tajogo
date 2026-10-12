import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/006_activation_v4_3_hotfix.sql'), 'utf8');
const activate = fs.readFileSync(path.join(root, 'server/public/activate.js'), 'utf8');
const legacyHotfixStillValid = [
  migration.includes('on conflict on constraint tap_client_members_pkey'),
  migration.includes('where ac.plate_id = v_plate.id'),
  migration.includes('where d.plate_id = v_plate.id'),
  migration.includes("notify pgrst, 'reload schema'")
].every(Boolean);
if (!legacyHotfixStillValid) throw new Error('V4.3 migration compatibility failed');
if (!(activate.includes('REST_V4_4') || activate.includes('ACTIVATION_RPC_NOT_AVAILABLE'))) {
  throw new Error('V4.3/V4.4 activation compatibility failed');
}
console.log('V4.3 compatibility check: OK (superseded by V4.4 engine when present)');
