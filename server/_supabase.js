function baseUrl() {
  const base = String(process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  if (!base) {
    const error = new Error('SERVER_ENV_MISSING');
    error.code = 'SERVER_ENV_MISSING';
    throw error;
  }
  if (!/^https:\/\/[^/]+\.supabase\.co$/i.test(base)) {
    const error = new Error('SUPABASE_URL_INVALID');
    error.code = 'SUPABASE_URL_INVALID';
    throw error;
  }
  return base;
}

function secretKey() {
  const key = String(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!key) {
    const error = new Error('SERVER_SECRET_MISSING');
    error.code = 'SERVER_SECRET_MISSING';
    throw error;
  }
  return key;
}

function publishableKey() {
  const key = String(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  if (!key) {
    const error = new Error('SERVER_PUBLISHABLE_MISSING');
    error.code = 'SERVER_PUBLISHABLE_MISSING';
    throw error;
  }
  return key;
}

function apiHeaders(key, extra = {}, hasBody = false, bearer = null) {
  const headers = { apikey: key, Accept: 'application/json', ...extra };
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  else if (/^eyJ/i.test(key)) headers.Authorization = `Bearer ${key}`;
  if (hasBody && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  return headers;
}

async function parseResponse(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

async function request(url, options = {}, key, bearer = null) {
  const hasBody = options.body !== undefined && options.body !== null;
  const response = await fetch(url, {
    ...options,
    headers: apiHeaders(key, options.headers || {}, hasBody, bearer)
  });
  const payload = await parseResponse(response);
  if (!response.ok) {
    const error = new Error(`SUPABASE_${response.status}`);
    error.code = `SUPABASE_${response.status}`;
    error.status = response.status;
    error.detail = typeof payload === 'string' ? payload.slice(0, 1200) : JSON.stringify(payload || {}).slice(0, 1200);
    error.payload = payload;
    throw error;
  }
  return payload;
}

export async function supabaseRest(path, options = {}) {
  return request(`${baseUrl()}/rest/v1/${path}`, options, secretKey());
}

export async function supabaseRpc(name, body) {
  return supabaseRest(`rpc/${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(body || {})
  });
}

export async function supabaseAuth(path, options = {}, bearer = null) {
  return request(`${baseUrl()}/auth/v1/${path}`, options, publishableKey(), bearer);
}

export function publicErrorCode(error) {
  if (!error) return 'UNKNOWN';
  if (error.code === 'SERVER_ENV_MISSING') return 'ENV_MISSING';
  if (error.code === 'SERVER_SECRET_MISSING') return 'SECRET_MISSING';
  if (error.code === 'SERVER_PUBLISHABLE_MISSING') return 'PUBLISHABLE_MISSING';
  if (error.code === 'SUPABASE_URL_INVALID') return 'URL_INVALID';
  if (error.status === 400) return 'SUPABASE_BAD_REQUEST';
  if (error.status === 401) return 'SUPABASE_AUTH';
  if (error.status === 403) return 'SUPABASE_PERMISSION';
  if (error.status === 404) return 'SUPABASE_RESOURCE';
  if (error.status >= 500) return 'SUPABASE_UNAVAILABLE';
  return 'BACKEND_ERROR';
}

// Server-only Supabase Auth Admin request. The secret key never reaches the browser.
export async function supabaseAuthAdmin(path, options = {}) {
  return request(`${baseUrl()}/auth/v1/admin/${path}`, options, secretKey());
}
