import { allowMethods, apiError, readJson, setNoStore } from '../_http.js';
import { requireAdmin } from '../_auth.js';
import { publicErrorCode, supabaseAuthAdmin, supabaseRest } from '../_supabase.js';

const clean = (v, n = 240) => String(v ?? '').trim().slice(0, n);

async function findUser(email) {
  const target = clean(email, 320).toLowerCase();
  for (let page = 1; page <= 10; page += 1) {
    const data = await supabaseAuthAdmin(`users?page=${page}&per_page=100`);
    const users = data?.users || [];
    const hit = users.find((u) => String(u.email || '').toLowerCase() === target);
    if (hit) return hit;
    if (users.length < 100) break;
  }
  return null;
}

function isoDatePlusDays(days) {
  return new Date(Date.now() + Math.max(1, Number(days || 365)) * 86400000).toISOString();
}

export default async function handler(req, res) {
  setNoStore(res);
  if (!allowMethods(req, res, ['GET','POST','PATCH'])) return;
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;

    if (req.method === 'GET') {
      const rows = await supabaseRest('tap_operator_admin_view?select=*&order=created_at.desc');
      return res.status(200).json({ ok: true, operators: rows || [] });
    }

    const body = readJson(req);
    if (req.method === 'POST') {
      const email = clean(body.email, 320).toLowerCase();
      const brandName = clean(body.brand_name || body.brandName, 120);
      if (!email || !brandName) return apiError(res, 400, 'FIELDS_REQUIRED', 'Informe e-mail da conta e nome da operação.');
      const user = await findUser(email);
      if (!user) return apiError(res, 404, 'AUTH_USER_NOT_FOUND', 'Crie primeiro a conta do operador no Supabase Auth.');
      const [existingOperator, admins, sellers, clients] = await Promise.all([
        supabaseRest(`tap_business_operators?user_id=eq.${encodeURIComponent(user.id)}&select=id&limit=1`).catch(() => []),
        supabaseRest(`tap_platform_admins?user_id=eq.${encodeURIComponent(user.id)}&active=eq.true&select=user_id&limit=1`).catch(() => []),
        supabaseRest(`tap_sellers?user_id=eq.${encodeURIComponent(user.id)}&active=eq.true&select=id&limit=1`).catch(() => []),
        supabaseRest(`tap_client_members?user_id=eq.${encodeURIComponent(user.id)}&active=eq.true&select=client_id&limit=1`).catch(() => [])
      ]);
      if (!existingOperator?.[0] && (admins?.[0] || sellers?.[0] || clients?.[0])) {
        return apiError(res, 409, 'ROLE_CONFLICT', 'Esta conta já possui outro papel ativo no TAJO TAP. Use um e-mail exclusivo para a operação BUSINESS.');
      }
      const plan = ['founders','business','custom'].includes(body.plan) ? body.plan : 'business';
      const qrLimit = Math.max(1, Math.min(100000, Number(body.qr_limit ?? body.qrLimit ?? 50)));
      const clientLimit = Math.max(1, Math.min(100000, Number(body.client_limit ?? body.clientLimit ?? 100)));
      const smartLimit = Math.max(0, Math.min(100000, Number(body.smart_page_limit ?? body.smartPageLimit ?? 50)));
      const licenseEndsAt = body.license_ends_at || body.licenseEndsAt || isoDatePlusDays(body.license_days || body.licenseDays || 365);
      const rows = await supabaseRest('tap_business_operators?on_conflict=user_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({
          user_id: user.id,
          brand_name: brandName,
          business_email: clean(body.business_email || email, 320) || null,
          phone: clean(body.phone, 40) || null,
          plan,
          active: true,
          qr_limit: qrLimit,
          client_limit: clientLimit,
          smart_page_limit: smartLimit,
          license_starts_at: new Date().toISOString(),
          license_ends_at: licenseEndsAt,
          notes: clean(body.notes, 1200) || null,
          created_by: auth.user.id
        })
      });
      const op = rows?.[0];
      await supabaseRest('tap_audit_logs', {
        method: 'POST', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ actor_user_id: auth.user.id, action: 'operator.create', entity_type: 'business_operator', entity_id: op?.id || null, metadata: { email, brand_name: brandName, plan } })
      }).catch(() => null);
      return res.status(201).json({ ok: true, operator: op });
    }

    const id = clean(body.id, 80);
    if (!id) return apiError(res, 400, 'OPERATOR_REQUIRED', 'Operador inválido.');
    const patch = { updated_at: new Date().toISOString() };
    if (body.active !== undefined) patch.active = Boolean(body.active);
    if (body.brand_name !== undefined) patch.brand_name = clean(body.brand_name, 120);
    if (body.plan !== undefined && ['founders','business','custom'].includes(body.plan)) patch.plan = body.plan;
    if (body.qr_limit !== undefined) patch.qr_limit = Math.max(1, Math.min(100000, Number(body.qr_limit)));
    if (body.client_limit !== undefined) patch.client_limit = Math.max(1, Math.min(100000, Number(body.client_limit)));
    if (body.smart_page_limit !== undefined) patch.smart_page_limit = Math.max(0, Math.min(100000, Number(body.smart_page_limit)));
    if (body.license_ends_at !== undefined) patch.license_ends_at = body.license_ends_at || null;
    const rows = await supabaseRest(`tap_business_operators?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(patch)
    });
    if (!rows?.[0]) return apiError(res, 404, 'OPERATOR_NOT_FOUND', 'Operador não encontrado.');
    return res.status(200).json({ ok: true, operator: rows[0] });
  } catch (error) {
    console.error('[admin/operators]', { code: publicErrorCode(error), status: error?.status, detail: error?.detail });
    return apiError(res, 503, publicErrorCode(error), 'Não foi possível gerenciar operadores BUSINESS.');
  }
}
