import crypto from 'node:crypto';
import { allowMethods, apiError, isUuid, nullableText, readJson, safePlateCode, setNoStore, text } from '../_http.js';
import { requireAdmin } from '../_auth.js';
import { mapPlate } from '../_models.js';
import { publicErrorCode, supabaseRest } from '../_supabase.js';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function randomCode() {
  let value = 'TT-';
  for (let i = 0; i < 6; i += 1) value += CHARS[crypto.randomInt(0, CHARS.length)];
  return value;
}
function activationPin() { return String(crypto.randomInt(100000, 1000000)); }
function hashPin(pin) { return crypto.createHash('sha256').update(pin, 'utf8').digest('hex'); }

async function createUniquePlate(payload, requestedCode = null) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = requestedCode || randomCode();
    try {
      const rows = await supabaseRest('tap_plates?select=id,code', {
        method: 'POST', headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ ...payload, code })
      });
      return rows?.[0];
    } catch (error) {
      if (error?.status === 409 || String(error?.detail || '').includes('duplicate key')) {
        if (requestedCode) throw Object.assign(new Error('CODE_ALREADY_EXISTS'), { code: 'CODE_ALREADY_EXISTS', status: 409 });
        continue;
      }
      throw error;
    }
  }
  throw Object.assign(new Error('CODE_GENERATION_FAILED'), { code: 'CODE_GENERATION_FAILED' });
}

export default async function handler(req, res) {
  setNoStore(res);
  if (!allowMethods(req, res, ['GET', 'POST'])) return;
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;

    if (req.method === 'GET') {
      const rows = await supabaseRest('tap_plate_admin_view?select=*&order=created_at.desc');
      const ids = (rows || []).map((row) => row.id).filter(Boolean);
      let activationByPlate = new Map();
      if (ids.length) {
        const activationRows = await supabaseRest(`tap_plate_activation_codes?plate_id=in.(${ids.join(',')})&select=plate_id,admin_pin,consumed_at,locked_until,failed_attempts`).catch(() => []);
        activationByPlate = new Map((activationRows || []).map((row) => [row.plate_id, row]));
      }
      const plates = (rows || []).map((row) => {
        const plate = mapPlate(row);
        const activation = activationByPlate.get(row.id);
        return {
          ...plate,
          activationPin: activation?.admin_pin || null,
          pinConsumedAt: activation?.consumed_at || null,
          pinLockedUntil: activation?.locked_until || null,
          pinFailedAttempts: Number(activation?.failed_attempts || 0)
        };
      });
      return res.status(200).json({ ok: true, plates });
    }

    const body = readJson(req);
    const name = text(body?.name, 120);
    const clientId = nullableText(body?.clientId, 64);
    const requestedCode = body?.code ? safePlateCode(body.code) : null;
    if (body?.code && !requestedCode) return apiError(res, 400, 'CODE_INVALID', 'O código informado não segue o padrão TAJO TAP.');
    if (name.length < 2) return apiError(res, 400, 'PLATE_NAME_REQUIRED', 'Informe um nome para a plaquinha.');
    if (clientId && !isUuid(clientId)) return apiError(res, 400, 'CLIENT_INVALID', 'O cliente selecionado é inválido.');

    if (clientId) {
      const clients = await supabaseRest(`tap_clients?id=eq.${encodeURIComponent(clientId)}&select=id&limit=1`);
      if (!clients?.[0]) return apiError(res, 404, 'CLIENT_NOT_FOUND', 'O cliente selecionado não foi encontrado.');
    }

    const created = await createUniquePlate({
      name,
      client_id: clientId,
      status: 'unconfigured',
      created_by: auth.user.id
    }, requestedCode);

    const pin = activationPin();
    try {
      await supabaseRest('tap_plate_activation_codes', {
        method: 'POST', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ plate_id: created.id, code_hash: hashPin(pin), admin_pin: pin, created_by: auth.user.id })
      });
    } catch (error) {
      await supabaseRest(`tap_plates?id=eq.${encodeURIComponent(created.id)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }).catch(() => null);
      throw error;
    }

    await supabaseRest('tap_audit_logs', {
      method: 'POST', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ actor_user_id: auth.user.id, action: 'plate.create', entity_type: 'plate', entity_id: created.id, metadata: { code: created.code, name } })
    }).catch(() => null);

    const rows = await supabaseRest(`tap_plate_admin_view?id=eq.${encodeURIComponent(created.id)}&select=*&limit=1`);
    return res.status(201).json({ ok: true, plate: { ...mapPlate(rows?.[0] || created), activationPin: pin, pinConsumedAt: null, pinLockedUntil: null, pinFailedAttempts: 0 }, activationCode: pin });
  } catch (error) {
    console.error('[admin/plates]', { code: publicErrorCode(error), status: error?.status, detail: error?.detail });
    return apiError(res, 503, publicErrorCode(error), 'Não foi possível concluir a operação de plaquinhas.');
  }
}
