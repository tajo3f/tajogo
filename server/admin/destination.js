import { allowMethods, apiError, readJson, safePlateCode, setNoStore, text } from '../_http.js';
import { requireAdmin } from '../_auth.js';
import { mapPlate } from '../_models.js';
import { publicErrorCode, supabaseRest, supabaseRpc } from '../_supabase.js';

const TYPES = new Set(['google','whatsapp','instagram','smart','map','custom']);
const LABELS = { google:'Avaliações Google', whatsapp:'WhatsApp', instagram:'Instagram', smart:'Smart Page', map:'Localização', custom:'Link personalizado' };

function validHttps(raw) {
  try {
    const u = new URL(String(raw || '').trim());
    if (u.protocol !== 'https:') return null;
    if (!u.hostname || u.username || u.password) return null;
    return u.toString();
  } catch { return null; }
}

export default async function handler(req, res) {
  setNoStore(res);
  if (!allowMethods(req, res, ['POST'])) return;
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const body = readJson(req);
    const code = safePlateCode(body?.code);
    const type = text(body?.type, 30);
    const url = validHttps(body?.url || body?.destination);
    if (!code) return apiError(res, 400, 'CODE_INVALID', 'Código de plaquinha inválido.');
    if (!TYPES.has(type)) return apiError(res, 400, 'TYPE_INVALID', 'Tipo de destino inválido.');
    if (!url) return apiError(res, 400, 'URL_INVALID', 'Informe um endereço HTTPS válido.');

    const plates = await supabaseRest(`tap_plates?code=eq.${encodeURIComponent(code)}&select=id&limit=1`);
    const plate = plates?.[0];
    if (!plate) return apiError(res, 404, 'PLATE_NOT_FOUND', 'Plaquinha não encontrada.');

    await supabaseRpc('tap_set_plate_destination', {
      p_plate_id: plate.id,
      p_type: type,
      p_url: url,
      p_label: LABELS[type],
      p_actor: auth.user.id
    });
    const updated = await supabaseRest(`tap_plate_admin_view?id=eq.${encodeURIComponent(plate.id)}&select=*&limit=1`);
    return res.status(200).json({ ok: true, plate: mapPlate(updated?.[0]) });
  } catch (error) {
    console.error('[admin/destination]', { code: publicErrorCode(error), status: error?.status, detail: error?.detail });
    return apiError(res, 503, publicErrorCode(error), 'Não foi possível alterar o destino da plaquinha.');
  }
}
