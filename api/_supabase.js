function getConfig() {
  const base = String(process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = String(
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  ).trim();

  if (!base || !key) {
    const error = new Error('SERVER_ENV_MISSING');
    error.code = 'SERVER_ENV_MISSING';
    throw error;
  }

  if (!/^https:\/\/[^/]+\.supabase\.co$/i.test(base)) {
    const error = new Error('SUPABASE_URL_INVALID');
    error.code = 'SUPABASE_URL_INVALID';
    throw error;
  }

  return { base, key };
}

function buildHeaders(key, extra = {}, hasBody = false) {
  const headers = {
    apikey: key,
    Accept: 'application/json',
    ...extra
  };

  // New Supabase sb_secret_* keys are opaque API keys, NOT JWTs.
  // Sending them as Authorization: Bearer makes Supabase try to parse a JWT
  // and can return "Invalid JWT". Legacy service_role keys begin with eyJ
  // and may still use the Bearer header.
  if (/^eyJ/i.test(key)) {
    headers.Authorization = `Bearer ${key}`;
  }

  if (hasBody && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

export async function supabaseRest(path, options = {}) {
  const { base, key } = getConfig();
  const hasBody = options.body !== undefined && options.body !== null;

  const response = await fetch(`${base}/rest/v1/${path}`, {
    ...options,
    headers: buildHeaders(key, options.headers || {}, hasBody)
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const error = new Error(`SUPABASE_${response.status}`);
    error.code = `SUPABASE_${response.status}`;
    error.status = response.status;
    error.detail = detail.slice(0, 1000);
    throw error;
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export function publicErrorCode(error) {
  if (!error) return 'UNKNOWN';
  if (error.code === 'SERVER_ENV_MISSING') return 'ENV_MISSING';
  if (error.code === 'SUPABASE_URL_INVALID') return 'URL_INVALID';
  if (error.status === 401) return 'SUPABASE_AUTH';
  if (error.status === 403) return 'SUPABASE_PERMISSION';
  if (error.status === 404) return 'SUPABASE_RESOURCE';
  if (error.status >= 500) return 'SUPABASE_UNAVAILABLE';
  return 'RESOLVER_ERROR';
}
