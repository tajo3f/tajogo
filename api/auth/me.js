import { allowMethods, setNoStore } from '../_http.js';
import { currentUser, resolveRole } from '../_auth.js';
import { publicErrorCode, supabaseRest } from '../_supabase.js';

export default async function handler(req, res) {
  setNoStore(res);
  if (!allowMethods(req, res, ['GET'])) return;
  try {
    const user = await currentUser(req, res);
    if (!user) return res.status(200).json({ ok: true, authenticated: false });
    const role = await resolveRole(user.id);
    if (role.role === 'unassigned') return res.status(200).json({ ok: true, authenticated: true, role: 'unassigned' });
    const profiles = await supabaseRest(`profiles?user_id=eq.${encodeURIComponent(user.id)}&select=full_name,phone&limit=1`);
    const profile = Array.isArray(profiles) ? profiles[0] : null;
    return res.status(200).json({
      ok: true,
      authenticated: true,
      role: role.role,
      user: {
        id: user.id,
        email: user.email || '',
        name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
        phone: profile?.phone || ''
      }
    });
  } catch (error) {
    console.error('[auth/me]', { code: publicErrorCode(error), status: error?.status, detail: error?.detail });
    return res.status(503).json({ ok: false, error: publicErrorCode(error), message: 'Não foi possível validar a sessão.' });
  }
}
