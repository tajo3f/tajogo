import { supabaseAuth, supabaseRest } from './_supabase.js';

const ACCESS_COOKIE = 'tajo_access';
const REFRESH_COOKIE = 'tajo_refresh';

function parseCookies(req) {
  const raw = String(req.headers?.cookie || '');
  const out = {};
  raw.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx < 0) return;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  });
  return out;
}

function cookieFlags(maxAge) {
  const secure = process.env.VERCEL || process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function addSetCookie(res, cookie) {
  const current = res.getHeader('Set-Cookie');
  if (!current) res.setHeader('Set-Cookie', [cookie]);
  else if (Array.isArray(current)) res.setHeader('Set-Cookie', [...current, cookie]);
  else res.setHeader('Set-Cookie', [String(current), cookie]);
}

export function setSessionCookies(res, session) {
  const accessMax = Math.max(60, Number(session.expires_in || 3600));
  addSetCookie(res, `${ACCESS_COOKIE}=${encodeURIComponent(session.access_token)}; ${cookieFlags(accessMax)}`);
  addSetCookie(res, `${REFRESH_COOKIE}=${encodeURIComponent(session.refresh_token)}; ${cookieFlags(60 * 60 * 24 * 30)}`);
}

export function clearSessionCookies(res) {
  addSetCookie(res, `${ACCESS_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.VERCEL ? '; Secure' : ''}`);
  addSetCookie(res, `${REFRESH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.VERCEL ? '; Secure' : ''}`);
}

async function fetchUser(accessToken) {
  return supabaseAuth('user', { method: 'GET' }, accessToken);
}

async function refreshSession(refreshToken) {
  return supabaseAuth('token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken })
  });
}

export async function currentUser(req, res) {
  const cookies = parseCookies(req);
  if (cookies[ACCESS_COOKIE]) {
    try { return await fetchUser(cookies[ACCESS_COOKIE]); } catch (error) {
      if (error?.status !== 401) throw error;
    }
  }

  if (!cookies[REFRESH_COOKIE]) return null;
  try {
    const session = await refreshSession(cookies[REFRESH_COOKIE]);
    if (!session?.access_token || !session?.refresh_token) return null;
    setSessionCookies(res, session);
    return await fetchUser(session.access_token);
  } catch {
    clearSessionCookies(res);
    return null;
  }
}

export async function resolveRole(userId) {
  const admins = await supabaseRest(
    `platform_admins?user_id=eq.${encodeURIComponent(userId)}&active=eq.true&select=role&limit=1`
  );
  if (Array.isArray(admins) && admins[0]) return { role: 'admin', adminRole: admins[0].role };

  const memberships = await supabaseRest(
    `client_members?user_id=eq.${encodeURIComponent(userId)}&active=eq.true&select=client_id,role&order=created_at.asc`
  );
  if (Array.isArray(memberships) && memberships.length) {
    return { role: 'client', memberships };
  }
  return { role: 'unassigned' };
}

export async function requireUser(req, res) {
  const user = await currentUser(req, res);
  if (!user) {
    res.status(401).json({ ok: false, error: 'AUTH_REQUIRED', message: 'Faça login para continuar.' });
    return null;
  }
  return user;
}

export async function requireAdmin(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  const role = await resolveRole(user.id);
  if (role.role !== 'admin') {
    res.status(403).json({ ok: false, error: 'ADMIN_REQUIRED', message: 'Esta ação é exclusiva da administração TAJO.' });
    return null;
  }
  return { user, ...role };
}

export async function requireClient(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  const role = await resolveRole(user.id);
  if (role.role !== 'client') {
    res.status(403).json({ ok: false, error: 'CLIENT_REQUIRED', message: 'Esta ação é exclusiva de clientes vinculados.' });
    return null;
  }
  return { user, ...role };
}

export function membershipClientIds(auth) {
  return (auth?.memberships || []).map((m) => m.client_id).filter(Boolean);
}
