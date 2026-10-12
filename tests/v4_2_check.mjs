import fs from 'node:fs';
const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const app = read('assets/js/app.js');
const plates = read('server/admin/plates.js');
const plate = read('server/admin/plate.js');
const bulk = read('server/admin/plate-bulk.js');
const batches = read('server/admin/batches.js');
const api = read('api/index.js');
const migration = read('supabase/migrations/005_admin_pin_and_bulk_management.sql');
const checks = [
  ['bulk selection UI', app.includes('data-plate-select') && app.includes('bulk-delete-plates')],
  ['bulk API route', api.includes("admin/plates/bulk-delete") && bulk.includes('plate.bulk_delete')],
  ['admin PIN persisted on single create', plates.includes('admin_pin: pin')],
  ['admin PIN persisted on batch create', batches.includes('admin_pin: pins[index]')],
  ['PIN reset for legacy plates', plate.includes("body?.action === 'reset-pin'") && app.includes('Gerar PIN visível')],
  ['V4.2 migration', migration.includes('admin_pin') && migration.includes('revoke all on table public.tap_plate_activation_codes from anon, authenticated')]
];
let failed = false;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'OK' : 'FAIL'} - ${name}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
