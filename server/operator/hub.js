import crypto from 'node:crypto';
import { allowMethods, apiError, isUuid, readJson, setNoStore, text } from '../_http.js';
import { requireOperator } from '../_auth.js';
import { changePlateDestination, DESTINATION_LABELS, DESTINATION_TYPES, normalizeDestination } from '../_destination.js';
import { mapClient, mapPlate } from '../_models.js';
import { smartUrl, uniqueSlug } from '../_smart.js';
import { publicErrorCode, supabaseRest } from '../_supabase.js';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const STATUS = new Set(['active','paused','archived']);
const ASSET_KINDS = new Set(['dynamic_qr','smart_plate']);

function clean(value, max = 240) { return String(value ?? '').trim().slice(0, max); }
function validEmail(value) {
  const email = clean(value, 320).toLowerCase();
  return /^\S+@\S+\.\S+$/.test(email) ? email : null;
}
function randomCode() {
  let out = 'TT-';
  for (let i = 0; i < 6; i += 1) out += CHARS[crypto.randomInt(0, CHARS.length)];
  return out;
}
async function uniqueCode() {
  for (let i = 0; i < 10; i += 1) {
    const code = randomCode();
    const rows = await supabaseRest(`tap_plates?code=eq.${encodeURIComponent(code)}&select=id&limit=1`);
    if (!rows?.[0]) return code;
  }
  throw Object.assign(new Error('CODE_GENERATION_FAILED'), { code: 'CODE_GENERATION_FAILED' });
}
function operatorBase(req) {
  const env = String(process.env.PANEL_BASE_URL || '').trim().replace(/\/+$/, '');
  if (/^https:\/\//i.test(env)) return env;
  const host = String(req.headers?.['x-forwarded-host'] || req.headers?.host || 'go.tajodigital.com.br').trim();
  return `https://${host}`;
}
function qrUrl(req, code) { return `${operatorBase(req)}/q/${encodeURIComponent(code)}`; }
function nfcUrl(req, code) { return `${operatorBase(req)}/n/${encodeURIComponent(code)}`; }

async function operatorCounts(operatorId) {
  const [clients, plates, pages] = await Promise.all([
    supabaseRest(`tap_clients?operator_id=eq.${encodeURIComponent(operatorId)}&select=id`),
    supabaseRest(`tap_plates?operator_id=eq.${encodeURIComponent(operatorId)}&status=neq.archived&select=id`),
    supabaseRest(`tap_smart_pages?operator_id=eq.${encodeURIComponent(operatorId)}&select=id`)
  ]);
  return { clients: clients?.length || 0, qrs: plates?.length || 0, smartPages: pages?.length || 0 };
}
async function assertQuota(operator, kind) {
  const counts = await operatorCounts(operator.id);
  const limits = { client: Number(operator.client_limit || 0), qr: Number(operator.qr_limit || 0), smart: Number(operator.smart_page_limit || 0) };
  const used = { client: counts.clients, qr: counts.qrs, smart: counts.smartPages }[kind];
  const limit = limits[kind];
  if (limit >= 0 && used >= limit) {
    const error = new Error('OPERATOR_LIMIT_REACHED');
    error.code = 'OPERATOR_LIMIT_REACHED';
    error.kind = kind;
    error.limit = limit;
    throw error;
  }
  return counts;
}
async function ownedClient(operatorId, clientId) {
  if (!isUuid(clientId)) return null;
  const rows = await supabaseRest(`tap_clients?id=eq.${encodeURIComponent(clientId)}&operator_id=eq.${encodeURIComponent(operatorId)}&select=*&limit=1`);
  return rows?.[0] || null;
}
async function ownedPlate(operatorId, code) {
  const normalized = clean(code, 32).toUpperCase();
  if (!/^TT-[A-Z0-9]{6,12}$/.test(normalized)) return null;
  const rows = await supabaseRest(`tap_plates?code=eq.${encodeURIComponent(normalized)}&operator_id=eq.${encodeURIComponent(operatorId)}&select=id,code,name,client_id,status,current_destination_id,asset_kind,operator_id&limit=1`);
  return rows?.[0] || null;
}

async function createClient(auth, body) {
  await assertQuota(auth.operator, 'client');
  const name = text(body.name, 120);
  if (name.length < 2) throw Object.assign(new Error('CLIENT_NAME_REQUIRED'), { code: 'CLIENT_NAME_REQUIRED', status: 400 });
  const rawEmail = clean(body.email, 320);
  const email = rawEmail ? validEmail(rawEmail) : null;
  if (rawEmail && !email) throw Object.assign(new Error('EMAIL_INVALID'), { code: 'EMAIL_INVALID', status: 400 });
  const rows = await supabaseRest('tap_clients?select=*', {
    method: 'POST', headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      name,
      contact_name: clean(body.contact, 120) || null,
      phone: clean(body.phone, 40) || null,
      email,
      city: clean(body.city, 120) || null,
      state: clean(body.state, 40) || null,
      status: 'active',
      created_by: auth.user.id,
      operator_id: auth.operator.id
    })
  });
  const row = rows?.[0];
  await supabaseRest('tap_audit_logs', {
    method: 'POST', headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ actor_user_id: auth.user.id, action: 'operator.client.create', entity_type: 'client', entity_id: row?.id || null, metadata: { operator_id: auth.operator.id, name } })
  }).catch(() => null);
  return row;
}

async function createSmartPageForQr(req, auth, client, plate, businessName) {
  await assertQuota(auth.operator, 'smart');
  const slug = await uniqueSlug(businessName || client.name || plate.code);
  const rows = await supabaseRest('tap_smart_pages?select=*', {
    method: 'POST', headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      client_id: client.id,
      plate_id: plate.id,
      operator_id: auth.operator.id,
      created_by_seller_id: null,
      slug,
      business_name: clean(businessName || client.name, 120),
      subtitle: 'Tudo do negócio em um só lugar',
      bio: 'Acesse nossos principais canais, localização e informações.',
      seller_edit_allowed: false,
      is_published: true
    })
  });
  const page = rows?.[0];
  if (!page?.id) throw Object.assign(new Error('SMART_PAGE_CREATE_FAILED'), { code: 'SMART_PAGE_CREATE_FAILED' });
  return { ...page, publicUrl: smartUrl(req, page.slug) };
}

async function createQr(req, auth, body) {
  await assertQuota(auth.operator, 'qr');
  const client = await ownedClient(auth.operator.id, clean(body.clientId, 80));
  if (!client) throw Object.assign(new Error('CLIENT_NOT_FOUND'), { code: 'CLIENT_NOT_FOUND', status: 404 });
  const name = text(body.name, 120);
  if (name.length < 2) throw Object.assign(new Error('QR_NAME_REQUIRED'), { code: 'QR_NAME_REQUIRED', status: 400 });
  const kind = ASSET_KINDS.has(body.assetKind) ? body.assetKind : 'dynamic_qr';
  const type = clean(body.type, 30).toLowerCase();
  if (!DESTINATION_TYPES.has(type)) throw Object.assign(new Error('TYPE_INVALID'), { code: 'TYPE_INVALID', status: 400 });
  const code = await uniqueCode();
  const now = new Date().toISOString();
  const rows = await supabaseRest('tap_plates?select=id,code,name,client_id,status,current_destination_id,asset_kind,operator_id', {
    method: 'POST', headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      code,
      name,
      client_id: client.id,
      status: 'active',
      owner_user_id: auth.user.id,
      setup_status: 'completed',
      configuration_locked: true,
      configured_at: now,
      configured_by: auth.user.id,
      claimed_at: now,
      activated_at: now,
      production_status: 'activated',
      production_status_updated_at: now,
      created_by: auth.user.id,
      operator_id: auth.operator.id,
      asset_kind: kind
    })
  });
  const plate = rows?.[0];
  if (!plate?.id) throw Object.assign(new Error('QR_CREATE_FAILED'), { code: 'QR_CREATE_FAILED' });

  let smartPage = null;
  try {
    let destinationUrl = '';
    if (type === 'smart') {
      smartPage = await createSmartPageForQr(req, auth, client, plate, clean(body.businessName, 120) || client.name);
      destinationUrl = smartPage.publicUrl;
    } else {
      destinationUrl = normalizeDestination(type, body.value ?? body.url ?? body.destination, body.message);
    }
    await changePlateDestination({ plate, actorUserId: auth.user.id, type, url: destinationUrl, label: DESTINATION_LABELS[type] });
  } catch (error) {
    if (smartPage?.id) await supabaseRest(`tap_smart_pages?id=eq.${encodeURIComponent(smartPage.id)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }).catch(() => null);
    await supabaseRest(`tap_plates?id=eq.${encodeURIComponent(plate.id)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }).catch(() => null);
    throw error;
  }

  const updated = await supabaseRest(`tap_plate_admin_view?id=eq.${encodeURIComponent(plate.id)}&select=*&limit=1`);
  return { plate: mapPlate(updated?.[0] || plate), smartPage, qrUrl: qrUrl(req, code), nfcUrl: nfcUrl(req, code) };
}

export default async function handler(req, res) {
  setNoStore(res);
  if (!allowMethods(req, res, ['GET','POST','PATCH'])) return;
  try {
    const auth = await requireOperator(req, res);
    if (!auth) return;

    if (req.method === 'GET') {
      const [clients, plates, pages, counts] = await Promise.all([
        supabaseRest(`tap_client_admin_view?operator_id=eq.${encodeURIComponent(auth.operator.id)}&select=*&order=created_at.desc`),
        supabaseRest(`tap_plate_admin_view?operator_id=eq.${encodeURIComponent(auth.operator.id)}&select=*&order=created_at.desc`),
        supabaseRest(`tap_smart_pages?operator_id=eq.${encodeURIComponent(auth.operator.id)}&select=id,client_id,plate_id,slug,business_name,is_published,updated_at&order=updated_at.desc`).catch(() => []),
        operatorCounts(auth.operator.id)
      ]);
      const scansMonth = (plates || []).reduce((sum, row) => sum + Number(row.scans_month || 0), 0);
      return res.status(200).json({
        ok: true,
        operator: auth.operator,
        access: auth.operatorAccess,
        metrics: { ...counts, scansMonth },
        clients: (clients || []).map(mapClient),
        qrs: (plates || []).map(mapPlate),
        smartPages: pages || []
      });
    }

    const body = readJson(req);
    if (req.method === 'POST') {
      if (body.kind === 'client') {
        const client = await createClient(auth, body);
        const rows = await supabaseRest(`tap_client_admin_view?id=eq.${encodeURIComponent(client.id)}&select=*&limit=1`);
        return res.status(201).json({ ok: true, client: mapClient(rows?.[0] || client) });
      }
      if (body.kind === 'qr') {
        const created = await createQr(req, auth, body);
        return res.status(201).json({ ok: true, ...created });
      }
      return apiError(res, 400, 'KIND_INVALID', 'Operação inválida.');
    }

    if (body.kind === 'destination') {
      const plate = await ownedPlate(auth.operator.id, body.code);
      if (!plate) return apiError(res, 404, 'QR_NOT_FOUND', 'QR Code não encontrado na sua operação.');
      if (plate.status === 'archived') return apiError(res, 409, 'QR_ARCHIVED', 'Este QR Code está arquivado.');
      const type = clean(body.type, 30).toLowerCase();
      if (!DESTINATION_TYPES.has(type)) return apiError(res, 400, 'TYPE_INVALID', 'Tipo de destino inválido.');
      let url;
      if (type === 'smart') {
        const pages = await supabaseRest(`tap_smart_pages?plate_id=eq.${encodeURIComponent(plate.id)}&operator_id=eq.${encodeURIComponent(auth.operator.id)}&select=slug&limit=1`);
        if (!pages?.[0]) return apiError(res, 409, 'SMART_PAGE_REQUIRED', 'Crie uma Smart Page para este QR antes de selecioná-la como destino.');
        url = smartUrl(req, pages[0].slug);
      } else {
        url = normalizeDestination(type, body.value ?? body.url ?? body.destination, body.message);
      }
      await changePlateDestination({ plate, actorUserId: auth.user.id, type, url, label: DESTINATION_LABELS[type] });
      const updated = await supabaseRest(`tap_plate_admin_view?id=eq.${encodeURIComponent(plate.id)}&select=*&limit=1`);
      return res.status(200).json({ ok: true, qr: mapPlate(updated?.[0] || plate), destination: { type, url } });
    }

    if (body.kind === 'status') {
      const plate = await ownedPlate(auth.operator.id, body.code);
      if (!plate) return apiError(res, 404, 'QR_NOT_FOUND', 'QR Code não encontrado na sua operação.');
      const status = clean(body.status, 20).toLowerCase();
      if (!STATUS.has(status)) return apiError(res, 400, 'STATUS_INVALID', 'Status inválido.');
      const rows = await supabaseRest(`tap_plates?id=eq.${encodeURIComponent(plate.id)}`, {
        method: 'PATCH', headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ status, updated_at: new Date().toISOString() })
      });
      return res.status(200).json({ ok: true, qr: rows?.[0] || null });
    }

    if (body.kind === 'client-status') {
      const client = await ownedClient(auth.operator.id, clean(body.clientId, 80));
      if (!client) return apiError(res, 404, 'CLIENT_NOT_FOUND', 'Cliente não encontrado.');
      const status = body.status === 'inactive' ? 'inactive' : 'active';
      const rows = await supabaseRest(`tap_clients?id=eq.${encodeURIComponent(client.id)}&operator_id=eq.${encodeURIComponent(auth.operator.id)}`, {
        method: 'PATCH', headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ status, updated_at: new Date().toISOString() })
      });
      return res.status(200).json({ ok: true, client: rows?.[0] || null });
    }

    return apiError(res, 400, 'KIND_INVALID', 'Operação inválida.');
  } catch (error) {
    if (error?.code === 'OPERATOR_LIMIT_REACHED') {
      return apiError(res, 409, 'OPERATOR_LIMIT_REACHED', `Seu plano atingiu o limite de ${error.kind === 'client' ? 'clientes' : error.kind === 'smart' ? 'Smart Pages' : 'QR Codes'} (${error.limit}).`);
    }
    if (error?.status && error.status < 500) return apiError(res, error.status, error.code || 'REQUEST_INVALID', error.message || 'Não foi possível concluir a operação.');
    console.error('[operator/hub]', { code: publicErrorCode(error), status: error?.status, detail: error?.detail, errorCode: error?.code });
    return apiError(res, 503, publicErrorCode(error), 'Não foi possível processar sua operação TAJO TAP BUSINESS.');
  }
}
