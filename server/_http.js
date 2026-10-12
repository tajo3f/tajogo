export function setNoStore(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

export function allowMethods(req, res, methods) {
  const method = String(req.method || 'GET').toUpperCase();
  if (methods.includes(method)) return true;
  res.setHeader('Allow', methods.join(', '));
  res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  return false;
}

export function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string' && req.body.trim()) {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  return {};
}

export function text(value, max = 200) {
  const out = String(value ?? '').trim();
  return out.slice(0, max);
}

export function nullableText(value, max = 200) {
  const out = text(value, max);
  return out || null;
}

export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

export function safePlateCode(value) {
  const code = String(value || '').trim().toUpperCase();
  return /^TT-[A-Z0-9]{6,12}$/.test(code) ? code : null;
}

export function apiError(res, status, code, message) {
  setNoStore(res);
  return res.status(status).json({ ok: false, error: code, message });
}
