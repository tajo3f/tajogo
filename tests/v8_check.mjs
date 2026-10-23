import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=(p)=>fs.readFileSync(new URL(`../${p}`, import.meta.url),'utf8');
const migration=read('supabase/migrations/011_v8_business_operator.sql');
const verify=read('supabase/VERIFY_V8.sql');
const auth=read('server/_auth.js');
const me=read('server/auth/me.js');
const login=read('server/auth/login.js');
const hub=read('server/operator/hub.js');
const admin=read('server/admin/operators.js');
const smart=read('server/smart-pages.js');
const smartAuth=read('server/_smart.js');
const app=read('assets/js/app.js');
const api=read('api/index.js');
const vercel=read('vercel.json');

// Banco / multi-tenant
assert.ok(migration.includes('create table if not exists public.tap_business_operators'), 'operator table missing');
assert.ok(migration.includes('add column if not exists operator_id'), 'operator_id isolation columns missing');
assert.ok(migration.includes("asset_kind in ('smart_plate','dynamic_qr')"), 'asset_kind constraint missing');
assert.ok(migration.includes('tap_operator_admin_view'), 'operator admin view missing');
assert.ok(migration.includes('revoke all on public.tap_business_operators from anon, authenticated'), 'operator browser access must be revoked');
assert.ok(verify.includes('tap_business_operators') && verify.includes('tap_operator_admin_view'), 'V8 verification SQL incomplete');

// Auth/licença
assert.ok(auth.includes("role: 'operator'"), 'operator role resolution missing');
assert.ok(auth.includes('operatorAccessState'), 'operator license state missing');
assert.ok(auth.includes('requireOperator'), 'operator auth guard missing');
assert.ok(auth.includes('OPERATOR_LICENSE_INACTIVE'), 'inactive license guard missing');
assert.ok(me.includes('operatorAccess') && me.includes('operator'), 'auth/me operator payload missing');
assert.ok(login.includes('operatorAccess') && login.includes("role.role === 'operator'"), 'login operator license payload missing');

// API e isolamento
assert.ok(hub.includes("operator_id=eq.${encodeURIComponent(auth.operator.id)}"), 'operator hub must filter by operator_id');
assert.ok(hub.includes('assertQuota') && hub.includes('OPERATOR_LIMIT_REACHED'), 'operator quotas missing');
assert.ok(hub.includes("asset_kind: kind"), 'operator QR asset kind missing');
assert.ok(hub.includes("setup_status: 'completed'"), 'operator digital QR must bypass physical activation');
assert.ok(hub.includes("type === 'smart'"), 'operator Smart Page destination missing');
assert.ok(admin.includes('tap_operator_admin_view'), 'admin operator listing missing');
assert.ok(admin.includes("AUTH_USER_NOT_FOUND"), 'operator provisioning must require an Auth user');
assert.ok(admin.includes('ROLE_CONFLICT'), 'operator provisioning role-conflict protection missing');

// Smart Pages respeitam tenant/licença
assert.ok(smart.includes("role.role==='operator'") || smart.includes("role.role === 'operator'"), 'Smart Pages operator role missing');
assert.ok(smart.includes('operator_id'), 'Smart Pages operator ownership missing');
assert.ok(smartAuth.includes("role.role === 'operator'") || smartAuth.includes("role.role==='operator'"), 'Smart Page edit authorization missing');

// Frontend
assert.ok(app.includes('operatorDashboardPage'), 'operator dashboard missing');
assert.ok(app.includes('operatorLicenseBlockedPage'), 'inactive operator license screen missing');
assert.ok(app.includes('operatorQrsPage'), 'operator QR management missing');
assert.ok(app.includes('operatorClientsPage'), 'operator clients page missing');
assert.ok(app.includes('adminOperatorsPage'), 'admin operators page missing');
assert.ok(app.includes("'/api/operator/hub'"), 'operator API integration missing');
assert.ok(app.includes('Licença, não código-fonte.'), 'license positioning notice missing');

// Roteamento serverless
assert.ok(api.includes("['operator/hub', operatorHub]"), 'operator hub API route missing');
assert.ok(api.includes("['admin/operators', adminOperators]"), 'admin operator API route missing');
assert.ok(vercel.includes('/api/operator/hub') && vercel.includes('/api/admin/operators'), 'Vercel rewrites missing');

console.log('V8 Business Operator / licensed operations: OK');
