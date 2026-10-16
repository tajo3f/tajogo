import { supabaseRest } from './_supabase.js';

export const DESTINATION_TYPES = new Set(['google','whatsapp','instagram','smart','map','custom']);
export const DESTINATION_LABELS = {
  google: 'Avaliações Google',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  smart: 'TAJO Smart Page',
  map: 'Localização',
  custom: 'Link personalizado'
};

function clean(value, max = 1200) {
  return String(value ?? '').trim().slice(0, max);
}

export function validHttps(raw) {
  try {
    const url = new URL(clean(raw, 2048));
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeDestination(type, rawValue, message = '') {
  const t = clean(type, 30).toLowerCase();
  const raw = clean(rawValue, 2048);
  if (!DESTINATION_TYPES.has(t)) {
    const error = new Error('DESTINATION_TYPE_INVALID');
    error.code = 'DESTINATION_TYPE_INVALID';
    throw error;
  }

  if (t === 'instagram') {
    const handle = raw
      .replace(/^@+/, '')
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
      .replace(/[?#].*$/, '')
      .replace(/\/+$/, '');
    if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) {
      const error = new Error('DESTINATION_INSTAGRAM_INVALID');
      error.code = 'DESTINATION_INSTAGRAM_INVALID';
      throw error;
    }
    return `https://instagram.com/${handle}`;
  }

  if (t === 'whatsapp') {
    const direct = validHttps(raw);
    if (direct) {
      const host = new URL(direct).hostname.toLowerCase();
      if (['wa.me','api.whatsapp.com','www.whatsapp.com','whatsapp.com'].includes(host)) return direct;
    }
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      const error = new Error('DESTINATION_WHATSAPP_INVALID');
      error.code = 'DESTINATION_WHATSAPP_INVALID';
      throw error;
    }
    const phone = digits.startsWith('55') ? digits : `55${digits}`;
    const msg = clean(message, 1000);
    return `https://wa.me/${phone}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`;
  }

  if (t === 'map') {
    const direct = validHttps(raw);
    if (direct) return direct;
    if (raw.length < 5) {
      const error = new Error('DESTINATION_MAP_INVALID');
      error.code = 'DESTINATION_MAP_INVALID';
      throw error;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(raw)}`;
  }

  const url = validHttps(raw);
  if (!url) {
    const error = new Error('DESTINATION_URL_INVALID');
    error.code = 'DESTINATION_URL_INVALID';
    throw error;
  }
  return url;
}

export async function changePlateDestination({ plate, actorUserId, type, url, label }) {
  if (!plate?.id) {
    const error = new Error('PLATE_NOT_FOUND');
    error.code = 'PLATE_NOT_FOUND';
    throw error;
  }

  const previousDestinationId = plate.current_destination_id || null;
  const rows = await supabaseRest('tap_plate_destinations?select=id', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      plate_id: plate.id,
      type,
      label: clean(label || DESTINATION_LABELS[type] || 'Destino', 120),
      url,
      is_active: true,
      created_by: actorUserId || null
    })
  });
  const destinationId = rows?.[0]?.id;
  if (!destinationId) {
    const error = new Error('DESTINATION_CREATE_FAILED');
    error.code = 'DESTINATION_CREATE_FAILED';
    throw error;
  }

  try {
    await supabaseRest(`tap_plates?id=eq.${encodeURIComponent(plate.id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ current_destination_id: destinationId, updated_at: new Date().toISOString() })
    });
  } catch (error) {
    await supabaseRest(`tap_plate_destinations?id=eq.${encodeURIComponent(destinationId)}`, { method: 'DELETE' }).catch(() => null);
    throw error;
  }

  // Cleanup happens only after the new pointer is valid. If cleanup fails, the resolver
  // still uses current_destination_id, so the customer never loses the working destination.
  await supabaseRest(
    `tap_plate_destinations?plate_id=eq.${encodeURIComponent(plate.id)}&id=neq.${encodeURIComponent(destinationId)}&is_active=eq.true`,
    { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ is_active: false }) }
  ).catch(() => null);

  await supabaseRest('tap_audit_logs', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      actor_user_id: actorUserId || null,
      action: 'plate.destination.change.v7_1',
      entity_type: 'plate',
      entity_id: plate.id,
      metadata: { destination_id: destinationId, previous_destination_id: previousDestinationId, type, url }
    })
  }).catch(() => null);

  return { id: destinationId, previousDestinationId, type, url };
}
