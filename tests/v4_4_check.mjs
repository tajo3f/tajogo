import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const activate = fs.readFileSync(path.join(root, 'server/public/activate.js'), 'utf8');
const checks = [
  [(activate.includes("activationEngine: 'REST_V4_4'") || activate.includes("activationEngine: 'REST_V6_1'")), 'usa motor REST V4.4'],
  [!activate.includes("supabaseRpc('tap_validate_activation_pin_v4'"), 'não depende da RPC de validação'],
  [!activate.includes("supabaseRpc('tap_activate_plate_v4'"), 'não depende da RPC de ativação'],
  [activate.includes('configuration_locked=eq.false'), 'claim condicional exige placa destravada'],
  [activate.includes('owner_user_id=is.null'), 'claim condicional exige placa sem proprietário'],
  [activate.includes('hashPin(pin) === activation.code_hash'), 'PIN validado no backend por hash SHA-256'],
  [(activate.includes("action: 'plate.self_activation.complete.v4_4'") || activate.includes("action: 'plate.self_activation.complete.v6_1'")), 'auditoria V4.4 presente']
];
let failed=false;
for (const [ok,label] of checks) { if (!ok) { console.error('FAIL:',label); failed=true; } else console.log('OK:',label); }
if (failed) process.exit(1);
console.log('V4.4 activation engine: OK');
