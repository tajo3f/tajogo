import { allowMethods, apiError, readJson, safePlateCode, setNoStore } from '../_http.js';
import { requireAdmin } from '../_auth.js';
import { publicErrorCode, supabaseRest } from '../_supabase.js';

const MAX_BULK_DELETE = 100;

export default async function handler(req, res) {
  setNoStore(res);
  if (!allowMethods(req, res, ['POST'])) return;

  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;

    const body = readJson(req);
    const rawCodes = Array.isArray(body?.codes) ? body.codes : [];
    const codes = [...new Set(rawCodes.map(safePlateCode).filter(Boolean))];

    if (!codes.length) return apiError(res, 400, 'PLATES_REQUIRED', 'Selecione pelo menos uma plaquinha para excluir.');
    if (codes.length > MAX_BULK_DELETE) return apiError(res, 400, 'BULK_LIMIT', `Exclua no máximo ${MAX_BULK_DELETE} plaquinhas por operação.`);
    if (codes.length !== rawCodes.length) return apiError(res, 400, 'PLATE_CODE_INVALID', 'A seleção contém um código de plaquinha inválido.');

    const inFilter = codes.join(',');
    const rows = await supabaseRest(`tap_plates?code=in.(${encodeURIComponent(inFilter)})&select=id,code,name,client_id,status,setup_status,configuration_locked,current_destination_id,batch_id`);
    const found = Array.isArray(rows) ? rows : [];
    if (found.length !== codes.length) {
      const foundCodes = new Set(found.map((row) => row.code));
      const missing = codes.filter((code) => !foundCodes.has(code));
      return apiError(res, 404, 'PLATES_NOT_FOUND', `Algumas plaquinhas não foram encontradas: ${missing.join(', ')}`);
    }

    await supabaseRest('tap_audit_logs', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        actor_user_id: auth.user.id,
        action: 'plate.bulk_delete',
        entity_type: 'plate',
        entity_id: null,
        metadata: {
          count: found.length,
          codes,
          snapshots: found.map((row) => ({
            id: row.id,
            code: row.code,
            name: row.name,
            client_id: row.client_id || null,
            status: row.status,
            setup_status: row.setup_status || null,
            configuration_locked: Boolean(row.configuration_locked),
          }))
        }
      })
    }).catch(() => null);

    await supabaseRest(`tap_plates?code=in.(${encodeURIComponent(inFilter)})`, {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' }
    });

    const batchIds = [...new Set(found.map((row) => row.batch_id).filter(Boolean))];
    for (const batchId of batchIds) {
      const remaining = await supabaseRest(`tap_plates?batch_id=eq.${encodeURIComponent(batchId)}&select=id`);
      const remainingCount = Number(remaining?.length || 0);
      await supabaseRest(`tap_plate_batches?id=eq.${encodeURIComponent(batchId)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(remainingCount
          ? { quantity: remainingCount, status: 'ready', updated_at: new Date().toISOString() }
          : { status: 'cancelled', updated_at: new Date().toISOString() })
      }).catch(() => null);
    }

    return res.status(200).json({ ok: true, deleted: codes, count: codes.length });
  } catch (error) {
    console.error('[admin/plate-bulk]', { code: publicErrorCode(error), status: error?.status, detail: error?.detail });
    return apiError(res, 503, publicErrorCode(error), 'Não foi possível excluir as plaquinhas selecionadas.');
  }
}
