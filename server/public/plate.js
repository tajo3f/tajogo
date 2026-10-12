import { allowMethods, apiError, safePlateCode, setNoStore } from '../_http.js';
import { publicErrorCode, supabaseRest } from '../_supabase.js';

export default async function handler(req, res) {
  setNoStore(res);
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (!allowMethods(req, res, ['GET'])) return;
  try {
    const code = safePlateCode(req.query?.code);
    if (!code) return apiError(res, 400, 'CODE_INVALID', 'Código inválido.');
    const rows = await supabaseRest(`tap_plates?code=eq.${encodeURIComponent(code)}&select=code,name,status,client_id&limit=1`);
    const plate = rows?.[0];
    if (!plate) return apiError(res, 404, 'PLATE_NOT_FOUND', 'Plaquinha não encontrada.');
    return res.status(200).json({ ok: true, plate: { code: plate.code, name: plate.name, status: plate.status, assigned: Boolean(plate.client_id) } });
  } catch (error) {
    console.error('[public/plate]', { code: publicErrorCode(error), status: error?.status, detail: error?.detail });
    return apiError(res, 503, publicErrorCode(error), 'Não foi possível consultar a plaquinha.');
  }
}
