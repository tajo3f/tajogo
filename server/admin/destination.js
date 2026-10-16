import { allowMethods, apiError, readJson, safePlateCode, setNoStore, text } from '../_http.js';
import { requireAdmin } from '../_auth.js';
import { mapPlate } from '../_models.js';
import { publicErrorCode, supabaseRest } from '../_supabase.js';
import { changePlateDestination, DESTINATION_LABELS, DESTINATION_TYPES, normalizeDestination } from '../_destination.js';

function destinationError(res, error) {
  if (error?.code === 'DESTINATION_TYPE_INVALID') return apiError(res, 400, 'TYPE_INVALID', 'Tipo de destino inválido.');
  if (error?.code === 'DESTINATION_INSTAGRAM_INVALID') return apiError(res, 400, 'INSTAGRAM_INVALID', 'Informe um @ ou perfil válido do Instagram.');
  if (error?.code === 'DESTINATION_WHATSAPP_INVALID') return apiError(res, 400, 'WHATSAPP_INVALID', 'Informe um WhatsApp válido com DDD.');
  if (error?.code === 'DESTINATION_MAP_INVALID') return apiError(res, 400, 'MAP_INVALID', 'Informe um endereço ou link de localização válido.');
  if (error?.code === 'DESTINATION_URL_INVALID') return apiError(res, 400, 'URL_INVALID', 'Informe um endereço HTTPS válido.');
  return null;
}

export default async function handler(req, res) {
  setNoStore(res);
  if (!allowMethods(req, res, ['POST'])) return;
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const body = readJson(req);
    const code = safePlateCode(body?.code);
    const type = text(body?.type, 30).toLowerCase();
    if (!code) return apiError(res, 400, 'CODE_INVALID', 'Código de plaquinha inválido.');
    if (!DESTINATION_TYPES.has(type)) return apiError(res, 400, 'TYPE_INVALID', 'Tipo de destino inválido.');

    let url;
    try { url = normalizeDestination(type, body?.value ?? body?.url ?? body?.destination, body?.message); }
    catch (error) { if (destinationError(res, error)) return; throw error; }

    const plates = await supabaseRest(`tap_plates?code=eq.${encodeURIComponent(code)}&select=id,current_destination_id,status&limit=1`);
    const plate = plates?.[0];
    if (!plate) return apiError(res, 404, 'PLATE_NOT_FOUND', 'Plaquinha não encontrada.');

    await changePlateDestination({
      plate,
      actorUserId: auth.user.id,
      type,
      url,
      label: DESTINATION_LABELS[type]
    });

    const updated = await supabaseRest(`tap_plate_admin_view?id=eq.${encodeURIComponent(plate.id)}&select=*&limit=1`);
    return res.status(200).json({ ok: true, plate: mapPlate(updated?.[0]), destination: { type, url } });
  } catch (error) {
    console.error('[admin/destination]', { code: publicErrorCode(error), status: error?.status, detail: error?.detail });
    return apiError(res, 503, publicErrorCode(error), 'Não foi possível alterar o destino da plaquinha.');
  }
}
