import crypto from 'node:crypto';
import { supabaseRest } from './_supabase.js';

function clean(value, max = 320) {
  return String(value ?? '').trim().slice(0, max);
}

export function normalizeWifiSecurity(value) {
  const raw = clean(value, 20).toUpperCase();
  if (raw === 'OPEN' || raw === 'NOPASS' || raw === 'NONE') return 'nopass';
  if (raw === 'WEP') return 'WEP';
  return 'WPA';
}

export function normalizeWifiMode(value) {
  const mode = clean(value, 20).toLowerCase();
  return ['off', 'wifi', 'hybrid'].includes(mode) ? mode : 'off';
}

export function normalizeWifiConfig(input = {}) {
  const mode = normalizeWifiMode(input.wifiMode ?? input.mode);
  const ssid = clean(input.wifiSsid ?? input.ssid, 64);
  const security = normalizeWifiSecurity(input.wifiSecurity ?? input.security);
  const password = String(input.wifiPassword ?? input.password ?? '').slice(0, 160);
  const hidden = Boolean(input.wifiHidden ?? input.hidden);
  const publicEnabled = input.wifiPublicEnabled === undefined ? mode !== 'off' : Boolean(input.wifiPublicEnabled);
  const directQrEnabled = input.wifiDirectQrEnabled === undefined ? false : Boolean(input.wifiDirectQrEnabled);
  const label = clean(input.wifiLabel ?? input.label, 80) || 'Wi-Fi do estabelecimento';

  if (mode !== 'off') {
    const hasControlChars = (value) => /[\u0000-\u001F\u007F]/.test(String(value || ''));
    if (!ssid || Buffer.byteLength(ssid, 'utf8') > 32 || hasControlChars(ssid)) {
      const err = new Error('WIFI_SSID_INVALID');
      err.code = 'WIFI_SSID_INVALID';
      throw err;
    }
    if (security === 'WPA') {
      const validWpa = (!hasControlChars(password) && password.length >= 8 && password.length <= 63) || /^[0-9a-fA-F]{64}$/.test(password);
      if (!validWpa) {
        const err = new Error('WIFI_PASSWORD_INVALID');
        err.code = 'WIFI_PASSWORD_INVALID';
        throw err;
      }
    }
    if (security === 'WEP') {
      const validWep = (!hasControlChars(password) && [5, 13].includes(password.length)) || /^[0-9a-fA-F]{10}$/.test(password) || /^[0-9a-fA-F]{26}$/.test(password);
      if (!validWep) {
        const err = new Error('WIFI_PASSWORD_INVALID');
        err.code = 'WIFI_PASSWORD_INVALID';
        throw err;
      }
    }
  }

  return { mode, ssid, security, password, hidden, publicEnabled, directQrEnabled, label };
}

function wifiKey() {
  const raw = String(process.env.TAJO_WIFI_ENCRYPTION_KEY || '').trim();
  if (raw.length < 32) {
    const err = new Error('WIFI_ENCRYPTION_KEY_MISSING');
    err.code = 'WIFI_ENCRYPTION_KEY_MISSING';
    throw err;
  }
  return crypto.createHash('sha256').update(raw, 'utf8').digest();
}


export function assertWifiEncryptionReady() {
  wifiKey();
  return true;
}

function encryptPassword(password) {
  if (!password) return { ciphertext: null, iv: null, tag: null };
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', wifiKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64')
  };
}

function decryptPassword(row) {
  if (!row?.password_ciphertext) return '';
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', wifiKey(), Buffer.from(row.password_iv, 'base64'));
    decipher.setAuthTag(Buffer.from(row.password_tag, 'base64'));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(row.password_ciphertext, 'base64')),
      decipher.final()
    ]);
    return plain.toString('utf8');
  } catch (error) {
    const err = new Error('WIFI_DECRYPT_FAILED');
    err.code = 'WIFI_DECRYPT_FAILED';
    err.cause = error;
    throw err;
  }
}

function escapeWifiValue(value) {
  return String(value ?? '').replace(/([\\;,:"])/g, '\\$1');
}

export function buildWifiPayload(config = {}) {
  const ssid = escapeWifiValue(config.ssid);
  if (!ssid) return '';
  const security = normalizeWifiSecurity(config.security);
  const hidden = config.hidden ? 'true' : 'false';
  if (security === 'nopass') return `WIFI:T:nopass;S:${ssid};H:${hidden};;`;
  const password = escapeWifiValue(config.password || '');
  return `WIFI:T:${security};S:${ssid};P:${password};H:${hidden};;`;
}

export async function getWifiProfileBySmartPage(smartPageId) {
  if (!smartPageId) return null;
  const rows = await supabaseRest(`tap_wifi_profiles?smart_page_id=eq.${encodeURIComponent(smartPageId)}&select=*&limit=1`).catch(() => []);
  const row = rows?.[0];
  if (!row) return null;
  const password = decryptPassword(row);
  return {
    id: row.id,
    plateId: row.plate_id || null,
    smartPageId: row.smart_page_id || null,
    mode: normalizeWifiMode(row.mode),
    ssid: row.ssid || '',
    security: normalizeWifiSecurity(row.security),
    password,
    hidden: Boolean(row.hidden),
    publicEnabled: Boolean(row.public_enabled),
    directQrEnabled: Boolean(row.direct_qr_enabled),
    label: row.label || 'Wi-Fi do estabelecimento',
    payload: buildWifiPayload({ ssid: row.ssid, security: row.security, password, hidden: row.hidden }),
    updatedAt: row.updated_at || null
  };
}

export async function getWifiProfileByPlate(plateId) {
  if (!plateId) return null;
  const rows = await supabaseRest(`tap_wifi_profiles?plate_id=eq.${encodeURIComponent(plateId)}&select=*&limit=1`).catch(() => []);
  const row = rows?.[0];
  if (!row) return null;
  const password = decryptPassword(row);
  return {
    id: row.id,
    plateId: row.plate_id || null,
    smartPageId: row.smart_page_id || null,
    mode: normalizeWifiMode(row.mode),
    ssid: row.ssid || '',
    security: normalizeWifiSecurity(row.security),
    password,
    hidden: Boolean(row.hidden),
    publicEnabled: Boolean(row.public_enabled),
    directQrEnabled: Boolean(row.direct_qr_enabled),
    label: row.label || 'Wi-Fi do estabelecimento',
    payload: buildWifiPayload({ ssid: row.ssid, security: row.security, password, hidden: row.hidden }),
    updatedAt: row.updated_at || null
  };
}

export async function upsertWifiProfile({ plateId, smartPageId, userId, config }) {
  const normalized = normalizeWifiConfig(config || {});
  if (normalized.mode === 'off') {
    const filters = smartPageId
      ? `smart_page_id=eq.${encodeURIComponent(smartPageId)}`
      : `plate_id=eq.${encodeURIComponent(plateId)}`;
    await supabaseRest(`tap_wifi_profiles?${filters}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }).catch(() => null);
    return { ...normalized, payload: '' };
  }

  const encrypted = encryptPassword(normalized.security === 'nopass' ? '' : normalized.password);
  const payload = {
    plate_id: plateId || null,
    smart_page_id: smartPageId || null,
    mode: normalized.mode,
    ssid: normalized.ssid,
    security: normalized.security,
    password_ciphertext: encrypted.ciphertext,
    password_iv: encrypted.iv,
    password_tag: encrypted.tag,
    hidden: normalized.hidden,
    public_enabled: normalized.publicEnabled,
    direct_qr_enabled: normalized.directQrEnabled,
    label: normalized.label,
    updated_by: userId || null,
    updated_at: new Date().toISOString()
  };

  const existing = smartPageId
    ? await supabaseRest(`tap_wifi_profiles?smart_page_id=eq.${encodeURIComponent(smartPageId)}&select=id&limit=1`).catch(() => [])
    : await supabaseRest(`tap_wifi_profiles?plate_id=eq.${encodeURIComponent(plateId)}&select=id&limit=1`).catch(() => []);

  if (existing?.[0]?.id) {
    const rows = await supabaseRest(`tap_wifi_profiles?id=eq.${encodeURIComponent(existing[0].id)}&select=*`, {
      method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(payload)
    });
    return { ...normalized, id: rows?.[0]?.id || existing[0].id, payload: buildWifiPayload(normalized) };
  }

  const rows = await supabaseRest('tap_wifi_profiles?select=*', {
    method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ ...payload, created_by: userId || null })
  });
  return { ...normalized, id: rows?.[0]?.id || null, payload: buildWifiPayload(normalized) };
}
