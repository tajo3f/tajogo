import { allowMethods, apiError, readJson, setNoStore, text } from '../_http.js';
import { resolveRole, setSessionCookies } from '../_auth.js';
import { publicErrorCode, supabaseAuth } from '../_supabase.js';

export default async function handler(req, res) {
  setNoStore(res);
  if (!allowMethods(req, res, ['POST'])) return;

  const body = readJson(req);
  const email = text(body?.email, 320).toLowerCase();
  const password = String(body?.password || '');
  if (!email || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 200) {
    return apiError(res, 400, 'INVALID_CREDENTIALS', 'Informe um e-mail válido e sua senha.');
  }

  try {
    const session = await supabaseAuth('token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (!session?.access_token || !session?.refresh_token || !session?.user?.id) {
      return apiError(res, 401, 'LOGIN_FAILED', 'E-mail ou senha inválidos.');
    }

    setSessionCookies(res, session);
    const role = await resolveRole(session.user.id);
    return res.status(200).json({
      ok: true,
      authenticated: true,
      role: role.role,
      user: {
        id: session.user.id,
        email: session.user.email || email,
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário'
      }
    });
  } catch (error) {
    console.error('[public/activation-login]', { code: publicErrorCode(error), status: error?.status });
    if (error?.status === 400 || error?.status === 401) {
      return apiError(res, 401, 'LOGIN_FAILED', 'E-mail ou senha inválidos.');
    }
    return apiError(res, 503, publicErrorCode(error), 'Não foi possível validar sua conta agora.');
  }
}
