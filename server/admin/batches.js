import crypto from 'node:crypto';
import { allowMethods, apiError, readJson, setNoStore, text } from '../_http.js';
import { requireAdmin } from '../_auth.js';
import { publicErrorCode, supabaseRest } from '../_supabase.js';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomPlateCode() {
  let value = 'TT-';
  for (let i = 0; i < 6; i += 1) value += CHARS[crypto.randomInt(0, CHARS.length)];
  return value;
}

function activationPin() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashPin(pin) {
  return crypto.createHash('sha256').update(pin, 'utf8').digest('hex');
}

function batchCode() {
  const now = new Date();
  const stamp = [now.getUTCFullYear(), String(now.getUTCMonth() + 1).padStart(2, '0'), String(now.getUTCDate()).padStart(2, '0')].join('');
  let suffix = '';
  for (let i = 0; i < 4; i += 1) suffix += CHARS[crypto.randomInt(0, CHARS.length)];
  return `LOT-${stamp}-${suffix}`;
}

async function generateUniqueCodes(quantity) {
  const codes = new Set();
  while (codes.size < quantity) codes.add(randomPlateCode());
  const current = [...codes];
  const rows = await supabaseRest(`tap_plates?code=in.(${current.join(',')})&select=code`).catch(() => []);
  const collisions = new Set((rows || []).map((row) => row.code));
  if (!collisions.size) return current;

  for (const code of collisions) codes.delete(code);
  while (codes.size < quantity) codes.add(randomPlateCode());
  return [...codes];
}

async function listBatches() {
  const batches = await supabaseRest('tap_plate_batches?select=id,batch_code,label,quantity,status,created_at&order=created_at.desc&limit=50');
  if (!batches?.length) return [];
  const ids = batches.map((b) => b.id).join(',');
  const plates = await supabaseRest(`tap_plates?batch_id=in.(${ids})&select=id,code,name,status,setup_status,configuration_locked,batch_id,batch_position,created_at&order=batch_position.asc`);
  const byBatch = new Map();
  for (const plate of plates || []) {
    if (!byBatch.has(plate.batch_id)) byBatch.set(plate.batch_id, []);
    byBatch.get(plate.batch_id).push({
      id: plate.id,
      code: plate.code,
      name: plate.name,
      status: plate.status,
      setupStatus: plate.setup_status,
      configurationLocked: Boolean(plate.configuration_locked),
      position: plate.batch_position,
      createdAt: plate.created_at
    });
  }
  return batches.map((batch) => ({
    id: batch.id,
    code: batch.batch_code,
    label: batch.label,
    quantity: batch.quantity,
    status: batch.status,
    createdAt: batch.created_at,
    plates: byBatch.get(batch.id) || []
  }));
}

export default async function handler(req, res) {
  setNoStore(res);
  if (!allowMethods(req, res, ['GET', 'POST'])) return;

  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;

    if (req.method === 'GET') {
      const batches = await listBatches();
      return res.status(200).json({ ok: true, batches });
    }

    const body = readJson(req);
    const quantity = Math.trunc(Number(body?.quantity));
    const label = text(body?.label, 120) || 'Lote de produção TAJO TAP';

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return apiError(res, 400, 'BATCH_QUANTITY_INVALID', 'Escolha uma quantidade entre 1 e 100 plaquinhas por lote.');
    }
    if (label.length < 2) return apiError(res, 400, 'BATCH_LABEL_INVALID', 'Informe um nome para identificar o lote.');

    const code = batchCode();
    const batchRows = await supabaseRest('tap_plate_batches?select=*', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ batch_code: code, label, quantity, status: 'ready', created_by: auth.user.id })
    });
    const batch = batchRows?.[0];
    if (!batch?.id) throw Object.assign(new Error('BATCH_CREATE_FAILED'), { code: 'BATCH_CREATE_FAILED' });

    const plateCodes = await generateUniqueCodes(quantity);
    const pins = plateCodes.map(() => activationPin());
    const platePayload = plateCodes.map((plateCode, index) => ({
      code: plateCode,
      name: `${label} #${String(index + 1).padStart(3, '0')}`,
      status: 'unconfigured',
      created_by: auth.user.id,
      batch_id: batch.id,
      batch_position: index + 1
    }));

    let createdPlates = [];
    try {
      createdPlates = await supabaseRest('tap_plates?select=id,code,name,batch_id,batch_position,status,setup_status,configuration_locked,created_at', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(platePayload)
      });

      const byCode = new Map((createdPlates || []).map((p) => [p.code, p]));
      const activationRows = plateCodes.map((plateCode, index) => ({
        plate_id: byCode.get(plateCode)?.id,
        code_hash: hashPin(pins[index]),
        created_by: auth.user.id
      }));
      if (activationRows.some((row) => !row.plate_id)) throw Object.assign(new Error('BATCH_PLATE_MISMATCH'), { code: 'BATCH_PLATE_MISMATCH' });

      await supabaseRest('tap_plate_activation_codes', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(activationRows)
      });
    } catch (error) {
      await supabaseRest(`tap_plates?batch_id=eq.${encodeURIComponent(batch.id)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }).catch(() => null);
      await supabaseRest(`tap_plate_batches?id=eq.${encodeURIComponent(batch.id)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }).catch(() => null);
      throw error;
    }

    await supabaseRest('tap_audit_logs', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        actor_user_id: auth.user.id,
        action: 'plate.batch.create',
        entity_type: 'plate_batch',
        entity_id: batch.id,
        metadata: { batch_code: code, quantity, label }
      })
    }).catch(() => null);

    const byCode = new Map((createdPlates || []).map((p) => [p.code, p]));
    const items = plateCodes.map((plateCode, index) => ({
      id: byCode.get(plateCode)?.id,
      code: plateCode,
      name: byCode.get(plateCode)?.name || `${label} #${String(index + 1).padStart(3, '0')}`,
      position: index + 1,
      activationCode: pins[index]
    }));

    return res.status(201).json({
      ok: true,
      batch: {
        id: batch.id,
        code,
        label,
        quantity,
        status: 'ready',
        createdAt: batch.created_at,
        items
      },
      warning: 'Os PINs são exibidos somente nesta criação. Salve o mapa interno de ativação antes de fechar.'
    });
  } catch (error) {
    const code = publicErrorCode(error);
    console.error('[admin/batches]', { code, status: error?.status, detail: error?.detail });
    if (['SUPABASE_BAD_REQUEST', 'SUPABASE_RESOURCE'].includes(code)) {
      return apiError(res, 503, 'BATCH_DB_UPDATE_REQUIRED', 'O módulo de lotes precisa da migration 004_activation_v4_and_batches.sql no Supabase.');
    }
    return apiError(res, 503, code, 'Não foi possível concluir a operação de lotes.');
  }
}
