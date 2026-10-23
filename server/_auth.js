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

function operatorAccessState(operator) {
  if (!operator) return 'missing';
  if (!operator.active) return 'suspended';
  const now = Date.now();
  const starts = operator.license_starts_at ? Date.parse(operator.license_starts_at) : null;
  const ends = operator.license_ends_at ? Date.parse(operator.license_ends_at) : null;
  if (Number.isFinite(starts) && starts > now) return 'scheduled';
  if (Number.isFinite(ends) && ends <= now) return 'expired';
  return 'active';
}

export async function resolveRole(userId) {
  const admins = await supabaseRest(
    `tap_platform_admins?user_id=eq.${encodeURIComponent(userId)}&active=eq.true&select=role&limit=1`
  );
  if (Array.isArray(admins) && admins[0]) return { role: 'admin', adminRole: admins[0].role };

  const operators = await supabaseRest(
    `tap_business_operators?user_id=eq.${encodeURIComponent(userId)}&select=id,user_id,brand_name,business_email,phone,plan,active,qr_limit,client_limit,smart_page_limit,license_starts_at,license_ends_at&limit=1`
  ).catch(() => []);
  if (Array.isArray(operators) && operators[0]) {
    const operator = operators[0];
    return { role: 'operator', operator, operatorAccess: operatorAccessState(operator) };
  }

  const sellers = await supabaseRest(
    `tap_sellers?user_id=eq.${encodeURIComponent(userId)}&active=eq.true&select=id,user_id,full_name,phone,commission_rate,active&limit=1`
  );
  if (Array.isArray(sellers) && sellers[0]) return { role: 'seller', seller: sellers[0] };

  const memberships = await supabaseRest(
    `tap_client_members?user_id=eq.${encodeURIComponent(userId)}&active=eq.true&select=client_id,role&order=created_at.asc`
  );
  if (Array.isArray(memberships) && memberships.length) {
    return { role: 'client', memberships };
  }
  return { role: 'unassigned' };
}


export async function claimPendingClientInvites(user) {
  const email = String(user?.email || '').trim().toLowerCase();
  if (!user?.id || !email) return 0;
  const invites = await supabaseRest(`tap_client_access_invites?email=eq.${encodeURIComponent(email)}&status=eq.pending&select=id,client_id,plate_id&order=created_at.asc`).catch(() => []);
  let claimed = 0;
  for (const invite of invites || []) {
    const existing = await supabaseRest(`tap_client_members?client_id=eq.${encodeURIComponent(invite.client_id)}&user_id=eq.${encodeURIComponent(user.id)}&select=client_id&limit=1`).catch(() => []);
    if (!existing?.[0]) {
      await supabaseRest('tap_client_members', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ client_id: invite.client_id, user_id: user.id, role: 'owner', active: true })
      });
    } else {
      await supabaseRest(`tap_client_members?client_id=eq.${encodeURIComponent(invite.client_id)}&user_id=eq.${encodeURIComponent(user.id)}`, {
        method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ active: true })
      }).catch(() => null);
    }
    await supabaseRest(`tap_client_access_invites?id=eq.${encodeURIComponent(invite.id)}&status=eq.pending`, {
      method: 'PATCH', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'claimed', claimed_at: new Date().toISOString(), claimed_by: user.id })
    }).catch(() => null);
    claimed += 1;
  }
  return claimed;
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



export async function requireOperator(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  const role = await resolveRole(user.id);
  if (role.role !== 'operator') {
    res.status(403).json({ ok: false, error: 'OPERATOR_REQUIRED', message: 'Esta ação é exclusiva de operadores TAJO TAP BUSINESS.' });
    return null;
  }
  if (role.operatorAccess !== 'active') {
    const message = role.operatorAccess === 'expired'
      ? 'Sua licença operacional expirou. Renove o acesso para continuar administrando novos clientes e QR Codes.'
      : role.operatorAccess === 'scheduled'
        ? 'Sua licença operacional ainda não iniciou.'
        : 'Seu acesso operacional está suspenso. Fale com o suporte TAJO.';
    res.status(403).json({ ok: false, error: 'OPERATOR_LICENSE_INACTIVE', access: role.operatorAccess, message });
    return null;
  }
  return { user, ...role };
}

export async function requireOperatorOrAdmin(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  const role = await resolveRole(user.id);
  if (role.role === 'admin') return { user, ...role };
  if (role.role === 'operator' && role.operatorAccess === 'active') return { user, ...role };
  res.status(403).json({ ok: false, error: 'OPERATOR_REQUIRED', message: 'Acesso operacional não autorizado.' });
  return null;
}
export async function requireSeller(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  const role = await resolveRole(user.id);
  if (role.role !== 'seller') {
    res.status(403).json({ ok: false, error: 'SELLER_REQUIRED', message: 'Esta ação é exclusiva de vendedores TAJO.' });
    return null;
  }
  return { user, ...role };
}

export async function requireSellerOrAdmin(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  const role = await resolveRole(user.id);
  if (!['seller','admin'].includes(role.role)) {
    res.status(403).json({ ok: false, error: 'TEAM_REQUIRED', message: 'Esta área é exclusiva da equipe TAJO.' });
    return null;
  }
  const profiles = await supabaseRest(`tap_profiles?id=eq.${encodeURIComponent(user.id)}&select=full_name&limit=1`);
  return { user, ...role, userName: profiles?.[0]?.full_name || null };
}
