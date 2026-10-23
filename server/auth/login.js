import { allowMethods, apiError, readJson, setNoStore, text } from '../_http.js';
import { setSessionCookies } from '../_auth.js';
import { publicErrorCode, supabaseAuth } from '../_supabase.js';
import { claimPendingClientInvites, resolveRole } from '../_auth.js';

export default async function handler(req, res) {
  setNoStore(res);
  if (!allowMethods(req, res, ['POST'])) return;
  const body = readJson(req);
  const email = text(body?.email, 320).toLowerCase();
  const password = String(body?.password || '');
  if (!email || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 200) {
    return apiError(res, 400, 'INVALID_CREDENTIALS', 'Informe um e-mail válido e uma senha com pelo menos 8 caracteres.');
  }

  try {
    const session = await supabaseAuth('token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (!session?.access_token || !session?.refresh_token || !session?.user?.id) {
      return apiError(res, 401, 'LOGIN_FAILED', 'Não foi possível iniciar sua sessão.');
    }
    await claimPendingClientInvites(session.user).catch(() => 0);
    const role = await resolveRole(session.user.id);
    if (role.role === 'unassigned') {
      return apiError(res, 403, 'NO_ACCESS', 'Sua conta existe, mas ainda não foi vinculada ao TAJO TAP.');
    }
    setSessionCookies(res, session);
    return res.status(200).json({
      ok: true,
      role: role.role,
      operator: role.role === 'operator' ? role.operator : undefined,
      operatorAccess: role.role === 'operator' ? role.operatorAccess : undefined,
      user: {
        id: session.user.id,
        email: session.user.email || email,
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário'
      }
    });
  } catch (error) {
    console.error('[auth/login]', { code: publicErrorCode(error), status: error?.status, detail: error?.detail });
    if (error?.status === 400 || error?.status === 401) {
      return apiError(res, 401, 'LOGIN_FAILED', 'E-mail ou senha inválidos.');
    }
    return apiError(res, 503, publicErrorCode(error), 'O serviço de autenticação está temporariamente indisponível.');
  }
}
