import { allowMethods, apiError, isUuid, readJson, safePlateCode, setNoStore, text } from '../_http.js';
import { requireAdmin } from '../_auth.js';
import { mapPlate } from '../_models.js';
import { publicErrorCode, supabaseRest } from '../_supabase.js';

const STATUSES = new Set(['unconfigured', 'active', 'paused', 'archived']);

export default async function handler(req, res) {
  setNoStore(res);
  if (!allowMethods(req, res, ['GET', 'PATCH', 'DELETE'])) return;
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const code = safePlateCode(req.query?.code || readJson(req)?.code);
    if (!code) return apiError(res, 400, 'CODE_INVALID', 'Código de plaquinha inválido.');

    const rows = await supabaseRest(`tap_plate_admin_view?code=eq.${encodeURIComponent(code)}&select=*&limit=1`);
    const current = rows?.[0];
    if (!current) return apiError(res, 404, 'PLATE_NOT_FOUND', 'Plaquinha não encontrada.');
    if (req.method === 'GET') return res.status(200).json({ ok: true, plate: mapPlate(current) });

    const body = readJson(req);
    if (req.method === 'DELETE') {
      const confirmCode = safePlateCode(body?.confirmCode);
      if (!confirmCode || confirmCode !== code) return apiError(res, 400, 'DELETE_CONFIRMATION_REQUIRED', 'Confirme o código exato da plaquinha para excluir.');

      const snapshot = {
        code: current.code,
        name: current.name,
        client_id: current.client_id || null,
        status: current.status,
        setup_status: current.setup_status || null,
        configuration_locked: Boolean(current.configuration_locked),
        scans_total: Number(current.scans_total || 0)
      };

      await supabaseRest('tap_audit_logs', {
        method: 'POST', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ actor_user_id: auth.user.id, action: 'plate.delete', entity_type: 'plate', entity_id: current.id, metadata: snapshot })
      }).catch(() => null);

      if (current.current_destination_id) {
        await supabaseRest(`tap_plates?id=eq.${encodeURIComponent(current.id)}`, {
          method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ current_destination_id: null })
        });
      }
      await supabaseRest(`tap_plates?id=eq.${encodeURIComponent(current.id)}`, {
        method: 'DELETE', headers: { Prefer: 'return=minimal' }
      });
      return res.status(200).json({ ok: true, deleted: { id: current.id, code: current.code } });
    }
    const patch = {};
    if (body?.status !== undefined) {
      const status = text(body.status, 30);
      if (!STATUSES.has(status)) return apiError(res, 400, 'STATUS_INVALID', 'Status inválido.');
      if (status === 'active' && !current.current_destination_id) return apiError(res, 409, 'DESTINATION_REQUIRED', 'Configure um destino antes de ativar a plaquinha.');
      patch.status = status;
    }
    if (body?.name !== undefined) {
      const name = text(body.name, 120);
      if (name.length < 2) return apiError(res, 400, 'NAME_INVALID', 'Nome da plaquinha inválido.');
      patch.name = name;
    }
    if (body?.clientId !== undefined) {
      if (body.clientId === null || body.clientId === '') patch.client_id = null;
      else if (isUuid(body.clientId)) patch.client_id = body.clientId;
      else return apiError(res, 400, 'CLIENT_INVALID', 'Cliente inválido.');
    }
    if (!Object.keys(patch).length) return apiError(res, 400, 'NOTHING_TO_UPDATE', 'Nenhuma alteração foi informada.');
    patch.updated_at = new Date().toISOString();

    await supabaseRest(`tap_plates?id=eq.${encodeURIComponent(current.id)}`, {
      method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(patch)
    });
    await supabaseRest('tap_audit_logs', {
      method: 'POST', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ actor_user_id: auth.user.id, action: 'plate.update', entity_type: 'plate', entity_id: current.id, metadata: patch })
    }).catch(() => null);

    const updated = await supabaseRest(`tap_plate_admin_view?id=eq.${encodeURIComponent(current.id)}&select=*&limit=1`);
    return res.status(200).json({ ok: true, plate: mapPlate(updated?.[0]) });
  } catch (error) {
    console.error('[admin/plate]', { code: publicErrorCode(error), status: error?.status, detail: error?.detail });
    return apiError(res, 503, publicErrorCode(error), req.method === 'DELETE' ? 'Não foi possível excluir a plaquinha.' : 'Não foi possível atualizar a plaquinha.');
  }
}
