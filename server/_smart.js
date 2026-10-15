import { supabaseRest } from './_supabase.js';

export const SMART_TYPES = new Set(['whatsapp','phone','email','instagram','tiktok','website','maps','google-review']);

export function clean(v, n = 240) {
  return String(v ?? '').trim().slice(0, n);
}

export function normalizeEmail(value) {
  return clean(value, 320).toLowerCase();
}

export function validEmail(value) {
  const email = normalizeEmail(value);
  return /^\S+@\S+\.\S+$/.test(email) ? email : null;
}

export function slugify(value) {
  return clean(value, 120)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 48) || 'negocio';
}

export async function uniqueSlug(base) {
  const root = slugify(base);
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const rows = await supabaseRest(`tap_smart_pages?slug=eq.${encodeURIComponent(candidate)}&select=id&limit=1`);
    if (!rows?.[0]) return candidate;
  }
  return `${root}-${Math.random().toString(36).slice(2, 8)}`.slice(0, 63);
}

export function safeColor(value, fallback) {
  const v = clean(value, 20);
  return /^#[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : fallback;
}

export function httpsUrl(value) {
  const v = clean(value, 1000);
  if (!v) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== 'https:' || !u.hostname || u.username || u.password) return null;
    return u.toString();
  } catch { return null; }
}

export function sanitizeHandle(value) {
  return clean(value, 120).replace(/^@+/, '').replace(/^https?:\/\/(www\.)?(instagram\.com|tiktok\.com)\/@?/i, '').replace(/\/$/, '');
}

export function digits(value, max = 20) {
  return String(value ?? '').replace(/\D/g, '').slice(0, max);
}

export function sanitizeArray(value, maxItems = 12, maxText = 180) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxItems).map((item) => {
    if (typeof item === 'string') return clean(item, maxText);
    if (!item || typeof item !== 'object') return null;
    const label = clean(item.label, maxText);
    const url = item.url ? httpsUrl(item.url) : null;
    const description = clean(item.description, 400);
    if (!label) return null;
    return { label, ...(url ? { url } : {}), ...(description ? { description } : {}) };
  }).filter(Boolean);
}

export function smartPublicBase(req) {
  const env = String(process.env.PANEL_BASE_URL || '').trim().replace(/\/+$/, '');
  if (/^https:\/\//i.test(env)) return env;
  const host = String(req?.headers?.['x-forwarded-host'] || req?.headers?.host || '').trim();
  return host ? `https://${host}` : 'https://go.tajodigital.com.br';
}

export function smartUrl(req, slug) {
  return `${smartPublicBase(req)}/bio/${encodeURIComponent(slug)}`;
}

export async function pageAnalytics(pageIds) {
  const ids = (pageIds || []).filter(Boolean);
  if (!ids.length) return new Map();
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
  const events = await supabaseRest(`tap_smart_page_events?smart_page_id=in.(${ids.join(',')})&occurred_at=gte.${encodeURIComponent(cutoff)}&select=smart_page_id,event_type,action_key,action_label,occurred_at&limit=5000`).catch(() => []);
  const out = new Map();
  for (const id of ids) out.set(id, { views30d: 0, clicks30d: 0, actions: {} });
  for (const e of events || []) {
    const row = out.get(e.smart_page_id) || { views30d: 0, clicks30d: 0, actions: {} };
    if (e.event_type === 'view') row.views30d += 1;
    if (e.event_type === 'click') {
      row.clicks30d += 1;
      const key = e.action_key || 'other';
      row.actions[key] = (row.actions[key] || 0) + 1;
    }
    out.set(e.smart_page_id, row);
  }
  return out;
}

export async function findPageForPlate(plateId) {
  const rows = await supabaseRest(`tap_smart_pages?plate_id=eq.${encodeURIComponent(plateId)}&select=*&limit=1`);
  return rows?.[0] || null;
}

export async function sellerOwnsPlate(sellerId, plateId) {
  const rows = await supabaseRest(`tap_plates?id=eq.${encodeURIComponent(plateId)}&seller_id=eq.${encodeURIComponent(sellerId)}&select=id&limit=1`);
  return Boolean(rows?.[0]);
}

export async function canEditSmartPage(role, page) {
  if (!role || !page) return false;
  if (role.role === 'admin') return true;
  if (role.role === 'client') {
    return (role.memberships || []).some((m) => m.client_id === page.client_id && m.active !== false);
  }
  if (role.role === 'seller') {
    if (!page.seller_edit_allowed) return false;
    if (page.created_by_seller_id === role.seller?.id) return true;
    if (page.plate_id && role.seller?.id) return sellerOwnsPlate(role.seller.id, page.plate_id);
  }
  return false;
}

export function smartPagePatch(body = {}) {
  const patch = {};
  const setText = (key, n = 240) => { if (body[key] !== undefined) patch[key] = clean(body[key], n) || null; };
  ['subtitle','bio','logo_url','cover_url','whatsapp','phone','public_email','instagram','tiktok','pix_key','address','opening_hours'].forEach((k) => setText(k, k === 'bio' ? 1200 : k === 'opening_hours' ? 800 : 320));
  if (body.business_name !== undefined) {
    const v = clean(body.business_name, 120);
    if (v.length >= 2) patch.business_name = v;
  }
  if (body.primary_color !== undefined) patch.primary_color = safeColor(body.primary_color, '#45E600');
  if (body.background_color !== undefined) patch.background_color = safeColor(body.background_color, '#0B0D0E');
  if (body.text_color !== undefined) patch.text_color = safeColor(body.text_color, '#F4F7F2');
  if (body.button_style !== undefined && ['rounded','pill','square'].includes(body.button_style)) patch.button_style = body.button_style;
  ['website_url','maps_url','google_review_url'].forEach((k) => {
    if (body[k] !== undefined) patch[k] = body[k] ? httpsUrl(body[k]) : null;
  });
  if (body.instagram !== undefined) patch.instagram = sanitizeHandle(body.instagram) || null;
  if (body.tiktok !== undefined) patch.tiktok = sanitizeHandle(body.tiktok) || null;
  if (body.public_email !== undefined) patch.public_email = body.public_email ? validEmail(body.public_email) : null;
  if (body.services !== undefined) patch.services = sanitizeArray(body.services, 12, 120);
  if (body.custom_links !== undefined) patch.custom_links = sanitizeArray(body.custom_links, 12, 120);
  if (body.is_published !== undefined) patch.is_published = Boolean(body.is_published);
  if (body.seller_edit_allowed !== undefined) patch.seller_edit_allowed = Boolean(body.seller_edit_allowed);
  return patch;
}
