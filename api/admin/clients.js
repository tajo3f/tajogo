import { allowMethods, apiError, nullableText, readJson, setNoStore, text } from '../_http.js';
import { requireAdmin } from '../_auth.js';
import { mapClient } from '../_models.js';
import { publicErrorCode, supabaseRest } from '../_supabase.js';

export default async function handler(req, res) {
  setNoStore(res);
  if (!allowMethods(req, res, ['GET', 'POST'])) return;
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;

    if (req.method === 'GET') {
      const rows = await supabaseRest('client_admin_view?select=*&order=created_at.desc');
      return res.status(200).json({ ok: true, clients: (rows || []).map(mapClient) });
    }

    const body = readJson(req);
    const name = text(body?.name, 120);
    const contactName = nullableText(body?.contact, 120);
    const phone = nullableText(body?.phone, 40);
    const email = nullableText(body?.email, 320)?.toLowerCase() || null;
    const city = nullableText(body?.city, 120);
    const state = nullableText(body?.state, 40);
    if (name.length < 2) return apiError(res, 400, 'CLIENT_NAME_REQUIRED', 'Informe o nome do cliente.');
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return apiError(res, 400, 'EMAIL_INVALID', 'O e-mail informado não é válido.');

    const created = await supabaseRest('clients?select=*', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        name,
        contact_name: contactName,
        phone,
        email,
        city,
        state,
        status: 'active',
        created_by: auth.user.id
      })
    });
    const row = Array.isArray(created) ? created[0] : null;
    await supabaseRest('audit_logs', {
      method: 'POST', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ actor_user_id: auth.user.id, action: 'client.create', entity_type: 'client', entity_id: row?.id || null, metadata: { name } })
    }).catch(() => null);

    const stats = await supabaseRest(`client_admin_view?id=eq.${encodeURIComponent(row.id)}&select=*&limit=1`);
    return res.status(201).json({ ok: true, client: mapClient(stats?.[0] || row) });
  } catch (error) {
    console.error('[admin/clients]', { code: publicErrorCode(error), status: error?.status, detail: error?.detail });
    return apiError(res, 503, publicErrorCode(error), 'Não foi possível concluir a operação de clientes.');
  }
}
