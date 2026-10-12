import { allowMethods, apiError, readJson, safePlateCode, setNoStore, text } from '../_http.js';
import { currentUser, setSessionCookies } from '../_auth.js';
import { publicErrorCode, supabaseAuth, supabaseRest, supabaseRpc } from '../_supabase.js';

const TYPES = new Set(['google', 'whatsapp', 'instagram', 'smart', 'map', 'custom']);
const LABELS = {
  google: 'Avaliações Google',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  smart: 'Site / Cardápio',
  map: 'Localização',
  custom: 'Link personalizado'
};

function validHttps(raw) {
  try {
    const u = new URL(String(raw || '').trim());
    if (u.protocol !== 'https:' || !u.hostname || u.username || u.password) return null;
    return u.toString();
  } catch {
    return null;
  }
}

function activationError(res, code, retryAfter = null) {
  const map = {
    PLATE_NOT_FOUND: [404, 'Plaquinha não encontrada.'],
    ALREADY_CONFIGURED: [409, 'Esta plaquinha já foi ativada. Entre no painel para gerenciá-la.'],
    PLATE_UNAVAILABLE: [409, 'Esta plaquinha não está disponível para ativação.'],
    PIN_NOT_AVAILABLE: [409, 'A ativação desta plaquinha ainda não foi liberada pela TAJO.'],
    PIN_USED: [409, 'O código de ativação desta plaquinha já foi utilizado.'],
    PIN_EXPIRED: [409, 'O código de ativação expirou. Solicite um novo código à TAJO.'],
    PIN_INVALID: [400, 'Código de ativação incorreto. Confira os seis números e tente novamente.'],
    PIN_LOCKED: [429, 'Muitas tentativas incorretas. A ativação foi bloqueada temporariamente.'],
    USER_NOT_FOUND: [401, 'Não foi possível validar a conta responsável.'],
    COMPANY_REQUIRED: [400, 'Informe o nome do estabelecimento.'],
    TYPE_INVALID: [400, 'Selecione um tipo de destino válido.'],
    URL_INVALID: [400, 'Informe um link HTTPS válido.']
  };
  const [status, message] = map[code] || [409, 'Não foi possível concluir a ativação.'];
  setNoStore(res);
  return res.status(status).json({ ok: false, error: code, message, retryAfter });
}

async function getPlate(code) {
  const rows = await supabaseRest(
    `tap_plates?code=eq.${encodeURIComponent(code)}&select=code,name,status,client_id,setup_status,configuration_locked,configured_at&limit=1`
  );
  return rows?.[0] || null;
}

export default async function handler(req, res) {
  setNoStore(res);
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (!allowMethods(req, res, ['GET', 'POST'])) return;

  try {
    if (req.method === 'GET') {
      const code = safePlateCode(req.query?.code);
      if (!code) return apiError(res, 400, 'CODE_INVALID', 'Código de plaquinha inválido.');
      const plate = await getPlate(code);
      if (!plate) return apiError(res, 404, 'PLATE_NOT_FOUND', 'Plaquinha não encontrada.');

      const configured = Boolean(plate.configuration_locked || plate.setup_status === 'completed' || plate.status === 'active');
      const available = !configured && ['inventory', 'unconfigured'].includes(plate.status);
      return res.status(200).json({
        ok: true,
        plate: {
          code: plate.code,
          name: plate.name,
          status: plate.status,
          assigned: Boolean(plate.client_id),
          setupStatus: plate.setup_status || (configured ? 'completed' : 'pending'),
          configured,
          available,
          configuredAt: plate.configured_at || null
        }
      });
    }

    const body = readJson(req);
    const code = safePlateCode(body?.code);
    const pin = String(body?.pin || '').replace(/\D/g, '').slice(0, 6);
    const mode = body?.mode === 'existing' ? 'existing' : 'signup';
    const fullName = text(body?.fullName, 120);
    const companyName = text(body?.companyName, 120);
    const phone = text(body?.phone, 40);
    const email = text(body?.email, 320).toLowerCase();
    const password = String(body?.password || '');
    const type = text(body?.type, 30);
    const url = validHttps(body?.url);

    if (!code) return apiError(res, 400, 'CODE_INVALID', 'Código de plaquinha inválido.');
    if (!/^\d{6}$/.test(pin)) return apiError(res, 400, 'PIN_INVALID', 'Informe os seis números do código de ativação.');
    if (!TYPES.has(type)) return apiError(res, 400, 'TYPE_INVALID', 'Selecione um tipo de destino válido.');
    if (!url) return apiError(res, 400, 'URL_INVALID', 'Informe um link HTTPS válido.');
    if (companyName.length < 2) return apiError(res, 400, 'COMPANY_REQUIRED', 'Informe o nome do estabelecimento.');

    // Verify PIN before account creation. This also applies temporary lockout after repeated failures.
    const pinRows = await supabaseRpc('tap_check_activation_pin', {
      p_plate_code: code,
      p_pin: pin
    });
    const pinResult = pinRows?.[0] || {};
    if (pinResult.result_code !== 'PIN_OK') {
      return activationError(res, pinResult.result_code || 'PIN_INVALID', pinResult.retry_after || null);
    }

    let user = null;
    let sessionReady = false;

    if (mode === 'existing') {
      user = await currentUser(req, res);
      if (!user?.id) {
        return apiError(res, 401, 'AUTH_REQUIRED', 'Entre com sua conta antes de concluir a ativação.');
      }
    } else {
      if (fullName.length < 2) return apiError(res, 400, 'NAME_REQUIRED', 'Informe seu nome.');
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) return apiError(res, 400, 'EMAIL_INVALID', 'Informe um e-mail válido.');
      if (password.length < 8 || password.length > 200) return apiError(res, 400, 'PASSWORD_INVALID', 'Crie uma senha com pelo menos 8 caracteres.');

      let signup;
      try {
        signup = await supabaseAuth('signup', {
          method: 'POST',
          body: JSON.stringify({
            email,
            password,
            data: { full_name: fullName, phone }
          })
        });
      } catch (error) {
        if (error?.status === 400 || error?.status === 422) {
          return apiError(res, 409, 'ACCOUNT_EXISTS_OR_INVALID', 'Não foi possível criar essa conta. Se você já possui cadastro, use “Já tenho uma conta”.');
        }
        throw error;
      }

      if (!signup?.user?.id || (Array.isArray(signup.user.identities) && signup.user.identities.length === 0)) {
        return apiError(res, 409, 'ACCOUNT_EXISTS', 'Este e-mail já possui uma conta. Use “Já tenho uma conta”.');
      }

      user = signup.user;
      const signupSession = signup.session || signup;
      if (signupSession?.access_token && signupSession?.refresh_token) {
        setSessionCookies(res, signupSession);
        sessionReady = true;
      }
    }

    const accountEmail = user.email || email;
    const accountName = fullName || user.user_metadata?.full_name || accountEmail?.split('@')[0] || 'Cliente';
    const claimRows = await supabaseRpc('tap_claim_plate_once', {
      p_plate_code: code,
      p_pin: pin,
      p_user: user.id,
      p_company_name: companyName,
      p_contact_name: accountName,
      p_phone: phone || user.user_metadata?.phone || '',
      p_email: accountEmail || '',
      p_type: type,
      p_url: url,
      p_label: LABELS[type]
    });

    const claim = claimRows?.[0] || {};
    if (claim.result_code !== 'OK') {
      return activationError(res, claim.result_code || 'ACTIVATION_FAILED');
    }

    if (mode === 'existing') sessionReady = true;

    return res.status(200).json({
      ok: true,
      activated: true,
      code,
      sessionReady,
      emailConfirmationRequired: mode === 'signup' && !sessionReady,
      plateId: claim.plate_id || null,
      clientId: claim.client_id || null,
      configuredAt: claim.configured_at || null
    });
  } catch (error) {
    console.error('[public/activate]', {
      code: publicErrorCode(error),
      status: error?.status,
      detail: error?.detail
    });
    return apiError(res, 503, publicErrorCode(error), 'Não foi possível concluir a ativação agora. Tente novamente em instantes.');
  }
}
