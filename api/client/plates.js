import { allowMethods, apiError, setNoStore } from '../_http.js';
import { membershipClientIds, requireClient } from '../_auth.js';
import { mapPlate } from '../_models.js';
import { publicErrorCode, supabaseRest } from '../_supabase.js';

export default async function handler(req, res) {
  setNoStore(res);
  if (!allowMethods(req, res, ['GET'])) return;
  try {
    const auth = await requireClient(req, res);
    if (!auth) return;
    const ids = membershipClientIds(auth);
    if (!ids.length) return res.status(200).json({ ok: true, plates: [] });
    const filter = ids.join(',');
    const rows = await supabaseRest(`tap_plate_admin_view?client_id=in.(${filter})&select=*&order=created_at.desc`);
    return res.status(200).json({ ok: true, plates: (rows || []).map(mapPlate) });
  } catch (error) {
    console.error('[client/plates]', { code: publicErrorCode(error), status: error?.status, detail: error?.detail });
    return apiError(res, 503, publicErrorCode(error), 'Não foi possível carregar suas plaquinhas.');
  }
}
