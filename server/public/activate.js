import crypto from 'node:crypto';
import { allowMethods, apiError, readJson, safePlateCode, setNoStore, text } from '../_http.js';
import { currentUser, setSessionCookies } from '../_auth.js';
import { publicErrorCode, supabaseAuth, supabaseAuthAdmin, supabaseRest } from '../_supabase.js';
import { smartUrl, uniqueSlug, slugify } from '../_smart.js';
import { assertWifiEncryptionReady, normalizeWifiConfig, upsertWifiProfile } from '../_wifi.js';

const TYPES = new Set(['google', 'whatsapp', 'instagram', 'smart', 'wifi', 'hybrid', 'map', 'custom']);
const LABELS = {
  google: 'Avaliações Google',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  smart: 'TAJO Smart Page',
  wifi: 'Wi-Fi Connect',
  hybrid: 'Smart Page + Wi-Fi',
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

function hashPin(pin) {
  return crypto.createHash('sha256').update(String(pin || ''), 'utf8').digest('hex');
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
    PIN_LOCKED: [429, retryAfter ? `Muitas tentativas incorretas. Tente novamente após ${new Date(retryAfter).toLocaleString('pt-BR')}.` : 'Muitas tentativas incorretas. A ativação foi bloqueada temporariamente.'],
    USER_NOT_FOUND: [401, 'Não foi possível validar a conta responsável.'],
    COMPANY_REQUIRED: [400, 'Informe o nome do estabelecimento.'],
    TYPE_INVALID: [400, 'Selecione um tipo de destino válido.'],
    URL_INVALID: [400, 'Informe um link HTTPS válido.'],
    ACTIVATION_CONFLICT: [409, 'Esta plaquinha acabou de ser ativada em outra sessão. Atualize a página.'],
    EMAIL_MISMATCH: [403, 'Use o mesmo e-mail informado no momento da compra desta plaquinha.']
  };
  const [status, message] = map[code] || [409, 'Não foi possível concluir a ativação.'];
  setNoStore(res);
  return res.status(status).json({ ok: false, error: code, message, retryAfter });
}

async function getPlate(code) {
  const rows = await supabaseRest(
    `tap_plates?code=eq.${encodeURIComponent(code)}&select=id,code,name,status,client_id,seller_id,owner_user_id,current_destination_id,setup_status,configuration_locked,configured_at,activated_at&limit=1`
  );
  return rows?.[0] || null;
}

async function getActivation(plateId) {
  const rows = await supabaseRest(
    `tap_plate_activation_codes?plate_id=eq.${encodeURIComponent(plateId)}&select=plate_id,code_hash,consumed_at,expires_at,failed_attempts,last_failed_at,locked_until&limit=1`
  );
  return rows?.[0] || null;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function maskEmail(value) {
  const email = normalizeEmail(value);
  const [local, domain] = email.split('@');
  if (!local || !domain) return '';
  const visible = local.slice(0, 1);
  return `${visible}${'*'.repeat(Math.max(3, Math.min(8, local.length - 1)))}@${domain}`;
}

function authErrorCode(error) {
  const payload = error?.payload && typeof error.payload === 'object' ? error.payload : {};
  return String(payload.code || payload.error_code || payload.error || '').trim().toLowerCase();
}

function authErrorText(error) {
  const payload = error?.payload;
  const parts = [
    typeof payload === 'object' ? payload?.message : payload,
    typeof payload === 'object' ? payload?.msg : null,
    error?.detail,
    error?.message
  ].filter(Boolean);
  return parts.join(' ').toLowerCase();
}

function isExistingAuthAccount(error) {
  const code = authErrorCode(error);
  const textValue = authErrorText(error);
  return ['email_exists','user_already_exists','email_conflict','user_exists'].includes(code)
    || /already\s+(been\s+)?registered|already\s+exists|email\s+exists|user\s+already/.test(textValue);
}

async function passwordLogin(email, password) {
  return supabaseAuth('token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

async function createActivationAccount({ email, password, fullName, phone }) {
  // V10.3: a ativação já foi autorizada por plaquinha + PIN. Criamos a conta
  // pelo Admin API para não depender da opção "Allow new users to sign up"
  // do Supabase Auth, que podia devolver 422 e ser confundida com conta existente.
  try {
    const user = await supabaseAuthAdmin('users', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, phone }
      })
    });
    if (!user?.id) {
      const error = new Error('AUTH_USER_CREATE_EMPTY');
      error.code = 'AUTH_USER_CREATE_EMPTY';
      throw error;
    }
    return { user, created: true };
  } catch (error) {
    if (!isExistingAuthAccount(error)) throw error;

    // Recuperação amigável: se esse e-mail já existir e a senha informada for
    // a mesma, seguimos sem obrigar o cliente a voltar uma etapa.
    try {
      const session = await passwordLogin(email, password);
      if (session?.user?.id) return { user: session.user, session, created: false, recoveredExisting: true };
    } catch {
      // A conta existe, mas a senha informada não autenticou. O front orienta
      // a usar "Já tenho uma conta" sem fingir que todo erro 422 é duplicidade.
    }

    const exists = new Error('ACCOUNT_EXISTS');
    exists.code = 'ACCOUNT_EXISTS';
    exists.status = 409;
    throw exists;
  }
}

async function getAccessReservation(plate) {
  const inviteRows = await supabaseRest(
    `tap_client_access_invites?plate_id=eq.${encodeURIComponent(plate.id)}&status=eq.pending&select=id,client_id,plate_id,seller_id,email,status,created_at&order=created_at.desc&limit=1`
  ).catch(() => []);
  const invite = inviteRows?.[0] || null;
  if (invite?.email) {
    return { source: 'invite', id: invite.id, clientId: invite.client_id || plate.client_id || null, email: normalizeEmail(invite.email) };
  }

  if (plate.client_id) {
    const clientRows = await supabaseRest(
      `tap_clients?id=eq.${encodeURIComponent(plate.client_id)}&select=id,email&limit=1`
    ).catch(() => []);
    const client = clientRows?.[0] || null;
    if (client?.email) {
      return { source: 'client', id: null, clientId: client.id, email: normalizeEmail(client.email) };
    }
  }
  return null;
}

async function claimAccessReservation(reservation, userId) {
  if (!reservation?.id) return;
  await supabaseRest(`tap_client_access_invites?id=eq.${encodeURIComponent(reservation.id)}&status=eq.pending`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ status: 'claimed', claimed_at: new Date().toISOString(), claimed_by: userId })
  }).catch(() => null);
}

async function updateActivation(plateId, patch) {
  return supabaseRest(`tap_plate_activation_codes?plate_id=eq.${encodeURIComponent(plateId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(patch)
  });
}

async function validatePin(plate, pin) {
  if (plate.configuration_locked || plate.setup_status === 'completed' || plate.owner_user_id || plate.status === 'active') {
    return { ok: false, code: 'ALREADY_CONFIGURED' };
  }
  if (!['inventory', 'unconfigured'].includes(plate.status)) {
    return { ok: false, code: 'PLATE_UNAVAILABLE' };
  }

  const activation = await getActivation(plate.id);
  if (!activation) return { ok: false, code: 'PIN_NOT_AVAILABLE' };
  if (activation.consumed_at) return { ok: false, code: 'PIN_USED' };

  const now = Date.now();
  if (activation.expires_at && new Date(activation.expires_at).getTime() <= now) {
    return { ok: false, code: 'PIN_EXPIRED' };
  }
  if (activation.locked_until && new Date(activation.locked_until).getTime() > now) {
    return { ok: false, code: 'PIN_LOCKED', retryAfter: activation.locked_until };
  }

  const valid = /^\d{6}$/.test(pin) && hashPin(pin) === activation.code_hash;
  if (!valid) {
    const attempts = Math.min(Number(activation.failed_attempts || 0) + 1, 50);
    const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
    await updateActivation(plate.id, {
      failed_attempts: attempts,
      last_failed_at: new Date().toISOString(),
      locked_until: lockUntil
    });
    return { ok: false, code: lockUntil ? 'PIN_LOCKED' : 'PIN_INVALID', retryAfter: lockUntil };
  }

  if (Number(activation.failed_attempts || 0) > 0 || activation.last_failed_at || activation.locked_until) {
    await updateActivation(plate.id, { failed_attempts: 0, last_failed_at: null, locked_until: null });
  }
  return { ok: true, activation };
}

function activationReference() {
  return `ATV-${Date.now().toString(36).slice(-6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function createClient({ companyName, contactName, phone, email, userId }) {
  const rows = await supabaseRest('tap_clients?select=id,name,contact_name,phone,email', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      name: companyName.slice(0, 120),
      contact_name: contactName || null,
      phone: phone || null,
      email: email || null,
      status: 'active',
      created_by: userId
    })
  });
  return rows?.[0] || null;
}

async function enrichExistingClient(clientId, { contactName, phone, email }) {
  const rows = await supabaseRest(`tap_clients?id=eq.${encodeURIComponent(clientId)}&select=id,contact_name,phone,email&limit=1`);
  const client = rows?.[0];
  if (!client) return null;
  const patch = {};
  if (!client.contact_name && contactName) patch.contact_name = contactName;
  if (!client.phone && phone) patch.phone = phone;
  if (!client.email && email) patch.email = email;
  if (Object.keys(patch).length) {
    await supabaseRest(`tap_clients?id=eq.${encodeURIComponent(clientId)}`, {
      method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(patch)
    });
  }
  return client;
}

async function ensureMembership(clientId, userId) {
  const found = await supabaseRest(
    `tap_client_members?client_id=eq.${encodeURIComponent(clientId)}&user_id=eq.${encodeURIComponent(userId)}&select=client_id,user_id&limit=1`
  );
  if (found?.[0]) {
    await supabaseRest(`tap_client_members?client_id=eq.${encodeURIComponent(clientId)}&user_id=eq.${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ role: 'owner', active: true })
    });
    return { created: false };
  }
  await supabaseRest('tap_client_members', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ client_id: clientId, user_id: userId, role: 'owner', active: true })
  });
  return { created: true };
}

async function getSmartPageForPlate(plateId) {
  const rows = await supabaseRest(`tap_smart_pages?plate_id=eq.${encodeURIComponent(plateId)}&select=*&limit=1`).catch(() => []);
  return rows?.[0] || null;
}

async function createSmartPage({ req, plate, clientId, businessName, requestedSlug, phone }) {
  const existing = await getSmartPageForPlate(plate.id);
  if (existing) {
    const patch = {};
    if (existing.client_id !== clientId) patch.client_id = clientId;
    if (!existing.business_name && businessName) patch.business_name = businessName;
    if (!existing.whatsapp && phone) patch.whatsapp = String(phone).replace(/\D/g, '').slice(0, 20) || null;
    if (!existing.is_published) patch.is_published = true;
    if (Object.keys(patch).length) {
      const rows = await supabaseRest(`tap_smart_pages?id=eq.${encodeURIComponent(existing.id)}&select=*`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(patch)
      });
      return { page: rows?.[0] || { ...existing, ...patch }, created: false };
    }
    return { page: existing, created: false };
  }

  const slug = await uniqueSlug(requestedSlug || businessName);
  const payload = {
    client_id: clientId,
    plate_id: plate.id,
    created_by_seller_id: plate.seller_id || null,
    slug,
    business_name: String(businessName || 'Minha empresa').slice(0, 120),
    subtitle: 'Sua empresa mais perto do cliente',
    bio: 'Encontre nossos principais canais, localização e informações em um só lugar.',
    whatsapp: String(phone || '').replace(/\D/g, '').slice(0, 20) || null,
    seller_edit_allowed: true,
    is_published: true
  };
  const rows = await supabaseRest('tap_smart_pages?select=*', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(payload)
  });
  const page = rows?.[0] || null;
  if (!page?.id) throw new Error('SMART_PAGE_CREATE_FAILED');
  return { page, created: true, url: smartUrl(req, page.slug) };
}

async function createDestination(plateId, type, url, label, userId) {
  const rows = await supabaseRest('tap_plate_destinations?select=id,plate_id,type,url', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      plate_id: plateId,
      type,
      label: String(label || 'Destino').slice(0, 120),
      url,
      is_active: true,
      created_by: userId
    })
  });
  return rows?.[0] || null;
}

async function claimPlate(plateId, patch) {
  const path = [
    'tap_plates?',
    `id=eq.${encodeURIComponent(plateId)}`,
    '&configuration_locked=eq.false',
    '&setup_status=eq.pending',
    '&owner_user_id=is.null',
    '&status=in.(inventory,unconfigured)',
    '&select=id,code,client_id,owner_user_id,current_destination_id,status,setup_status,configuration_locked,configured_at'
  ].join('');
  const rows = await supabaseRest(path, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch)
  });
  return rows?.[0] || null;
}

async function cleanupFailedClaim({ destinationId, smartPageId, smartPageCreated, createdClientId, clientId, userId, membershipCreated }) {
  if (destinationId) {
    await supabaseRest(`tap_plate_destinations?id=eq.${encodeURIComponent(destinationId)}`, {
      method: 'DELETE', headers: { Prefer: 'return=minimal' }
    }).catch(() => null);
  }
  if (smartPageCreated && smartPageId) {
    await supabaseRest(`tap_smart_pages?id=eq.${encodeURIComponent(smartPageId)}`, {
      method: 'DELETE', headers: { Prefer: 'return=minimal' }
    }).catch(() => null);
  }
  if (membershipCreated && clientId && userId) {
    await supabaseRest(`tap_client_members?client_id=eq.${encodeURIComponent(clientId)}&user_id=eq.${encodeURIComponent(userId)}`, {
      method: 'DELETE', headers: { Prefer: 'return=minimal' }
    }).catch(() => null);
  }
  if (createdClientId) {
    await supabaseRest(`tap_clients?id=eq.${encodeURIComponent(createdClientId)}`, {
      method: 'DELETE', headers: { Prefer: 'return=minimal' }
    }).catch(() => null);
  }
}

export default async function handler(req, res) {
  setNoStore(res);
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (!allowMethods(req, res, ['GET', 'POST'])) return;

  let stage = 'start';
  let createdUserId = null;
  let createdNewUser = false;

  try {
    if (req.method === 'GET') {
      stage = 'plate_lookup';
      const code = safePlateCode(req.query?.code);
      if (!code) return apiError(res, 400, 'CODE_INVALID', 'Código de plaquinha inválido.');
      const plate = await getPlate(code);
      if (!plate) return apiError(res, 404, 'PLATE_NOT_FOUND', 'Plaquinha não encontrada.');

      if (req.query?.checkSlug) {
        const requested = slugify(req.query.checkSlug);
        const rows = await supabaseRest(`tap_smart_pages?slug=eq.${encodeURIComponent(requested)}&select=id,plate_id&limit=1`).catch(() => []);
        const occupied = rows?.[0] && rows[0].plate_id !== plate.id;
        const suggested = occupied ? await uniqueSlug(requested) : requested;
        return res.status(200).json({
          ok: true,
          slug: requested,
          available: !occupied,
          suggestedSlug: suggested
        });
      }

      const configured = Boolean(plate.configuration_locked || plate.setup_status === 'completed' || plate.status === 'active');
      const available = !configured && ['inventory', 'unconfigured'].includes(plate.status);
      const smartRows = await supabaseRest(`tap_smart_pages?plate_id=eq.${encodeURIComponent(plate.id)}&is_published=eq.true&select=id,slug,business_name&limit=1`).catch(() => []);
      const smartPage = smartRows?.[0] || null;
      let wifiMode = 'off';
      if (smartPage?.id) {
        const wifiRows = await supabaseRest(`tap_wifi_profiles?smart_page_id=eq.${encodeURIComponent(smartPage.id)}&select=mode&limit=1`).catch(() => []);
        wifiMode = wifiRows?.[0]?.mode || 'off';
      }
      const reservation = await getAccessReservation(plate);
      let sessionMatchesPurchaseEmail = null;
      if (reservation?.email) {
        const sessionUser = await currentUser(req, res).catch(() => null);
        if (sessionUser?.email) sessionMatchesPurchaseEmail = normalizeEmail(sessionUser.email) === reservation.email;
      }
      return res.status(200).json({
        ok: true,
        activationEngine: 'REST_V7',
        plate: {
          code: plate.code,
          name: plate.name,
          status: plate.status,
          assigned: Boolean(plate.client_id),
          setupStatus: plate.setup_status || (configured ? 'completed' : 'pending'),
          configured,
          available,
          configuredAt: plate.configured_at || null,
          smartPage: smartPage ? { id: smartPage.id, slug: smartPage.slug, businessName: smartPage.business_name, url: smartUrl(req, smartPage.slug), wifiMode } : null
        },
        access: reservation?.email ? {
          restricted: true,
          emailMasked: maskEmail(reservation.email),
          source: reservation.source,
          sessionMatchesPurchaseEmail
        } : { restricted: false, emailMasked: null, source: null, sessionMatchesPurchaseEmail: null }
      });
    }

    stage = 'input_validation';
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
    const smartExperience = ['smart', 'wifi', 'hybrid'].includes(type);
    const smartBusinessName = text(body?.smartBusinessName, 120) || companyName;
    const requestedSmartSlug = slugify(body?.smartSlug || smartBusinessName || companyName);
    const url = smartExperience ? null : validHttps(body?.url);
    let wifiConfig = null;

    if (!code) return apiError(res, 400, 'CODE_INVALID', 'Código de plaquinha inválido.');
    if (!/^\d{6}$/.test(pin)) return apiError(res, 400, 'PIN_INVALID', 'Informe os seis números do código de ativação.');
    if (!TYPES.has(type)) return apiError(res, 400, 'TYPE_INVALID', 'Selecione um tipo de destino válido.');
    if (!smartExperience && !url) return apiError(res, 400, 'URL_INVALID', 'Informe um link HTTPS válido.');
    if (smartExperience && smartBusinessName.length < 2) return apiError(res, 400, 'COMPANY_REQUIRED', 'Informe o nome da Smart Page.');
    if (companyName.length < 2) return apiError(res, 400, 'COMPANY_REQUIRED', 'Informe o nome do estabelecimento.');
    if (type === 'wifi' || type === 'hybrid') {
      try {
        assertWifiEncryptionReady();
        wifiConfig = normalizeWifiConfig({
          wifiMode: type,
          wifiSsid: body?.wifiSsid,
          wifiSecurity: body?.wifiSecurity,
          wifiPassword: body?.wifiPassword,
          wifiHidden: body?.wifiHidden,
          wifiPublicEnabled: true,
          wifiDirectQrEnabled: false,
          wifiLabel: body?.wifiLabel
        });
      } catch (wifiError) {
        if (wifiError?.code === 'WIFI_SSID_INVALID') return apiError(res, 400, 'WIFI_SSID_INVALID', 'Informe o nome da rede Wi-Fi.');
        if (wifiError?.code === 'WIFI_PASSWORD_INVALID') return apiError(res, 400, 'WIFI_PASSWORD_INVALID', 'Use uma senha compatível com o tipo de segurança escolhido. Para WPA/WPA2/WPA3, use 8 a 63 caracteres.');
        throw wifiError;
      }
    }

    // V4.4: validação direta via REST server-side. Não depende do cache de RPC do PostgREST.
    stage = 'pin_validation_rest';
    let plate = await getPlate(code);
    if (!plate) return activationError(res, 'PLATE_NOT_FOUND');
    const pinCheck = await validatePin(plate, pin);
    if (!pinCheck.ok) return activationError(res, pinCheck.code, pinCheck.retryAfter || null);

    const accessReservation = await getAccessReservation(plate);
    if (mode !== 'existing' && accessReservation?.email && normalizeEmail(email) !== accessReservation.email) {
      return activationError(res, 'EMAIL_MISMATCH');
    }

    let user = null;
    let sessionReady = false;

    stage = 'account';
    if (mode === 'existing') {
      user = await currentUser(req, res);
      if (!user?.id) return apiError(res, 401, 'AUTH_REQUIRED', 'Entre com sua conta antes de concluir a ativação.');
    } else {
      if (fullName.length < 2) return apiError(res, 400, 'NAME_REQUIRED', 'Informe seu nome.');
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) return apiError(res, 400, 'EMAIL_INVALID', 'Informe um e-mail válido.');
      if (password.length < 8 || password.length > 200) return apiError(res, 400, 'PASSWORD_INVALID', 'Crie uma senha com pelo menos 8 caracteres.');

      let account;
      try {
        account = await createActivationAccount({ email, password, fullName, phone });
      } catch (error) {
        if (error?.code === 'ACCOUNT_EXISTS') {
          return apiError(res, 409, 'ACCOUNT_EXISTS', 'Este e-mail já possui uma conta. Use “Já tenho uma conta”.');
        }
        const code = authErrorCode(error);
        const textValue = authErrorText(error);
        if (error?.status === 400 || error?.status === 422) {
          const passwordRejected = code.includes('password') || /password|senha/.test(textValue);
          return apiError(
            res,
            400,
            passwordRejected ? 'PASSWORD_REJECTED' : 'ACCOUNT_CREATE_INVALID',
            passwordRejected
              ? 'A senha não atende à política de segurança. Use uma senha mais forte e tente novamente.'
              : 'Não foi possível criar a conta com esses dados. Revise o e-mail e a senha e tente novamente.'
          );
        }
        throw error;
      }

      user = account.user;
      createdUserId = account.created ? user.id : null;
      createdNewUser = Boolean(account.created);

      let signupSession = account.session || null;
      if (!signupSession?.access_token || !signupSession?.refresh_token) {
        try {
          signupSession = await passwordLogin(email, password);
        } catch (loginError) {
          if (createdNewUser && createdUserId) {
            await supabaseAuthAdmin(`users/${encodeURIComponent(createdUserId)}`, { method: 'DELETE' }).catch(() => null);
            createdUserId = null;
            createdNewUser = false;
          }
          throw loginError;
        }
      }

      if (signupSession?.access_token && signupSession?.refresh_token) {
        setSessionCookies(res, signupSession);
        sessionReady = true;
        if (signupSession.user?.id) user = signupSession.user;
      }
    }

    if (accessReservation?.email && normalizeEmail(user?.email || email) !== accessReservation.email) {
      if (createdNewUser && createdUserId) await supabaseAuthAdmin(`users/${encodeURIComponent(createdUserId)}`, { method: 'DELETE' }).catch(() => null);
      return activationError(res, 'EMAIL_MISMATCH');
    }

    stage = 'activate_rest_v7';
    // Releitura antes do claim reduz a janela de concorrência.
    plate = await getPlate(code);
    if (!plate) throw Object.assign(new Error('PLATE_NOT_FOUND'), { activationCode: 'PLATE_NOT_FOUND' });
    if (plate.configuration_locked || plate.setup_status === 'completed' || plate.owner_user_id || plate.status === 'active') {
      if (createdNewUser && createdUserId) await supabaseAuthAdmin(`users/${encodeURIComponent(createdUserId)}`, { method: 'DELETE' }).catch(() => null);
      return activationError(res, 'ALREADY_CONFIGURED');
    }

    // Valida PIN novamente imediatamente antes do claim.
    const finalPinCheck = await validatePin(plate, pin);
    if (!finalPinCheck.ok) {
      if (createdNewUser && createdUserId) await supabaseAuthAdmin(`users/${encodeURIComponent(createdUserId)}`, { method: 'DELETE' }).catch(() => null);
      return activationError(res, finalPinCheck.code, finalPinCheck.retryAfter || null);
    }

    const accountEmail = normalizeEmail(user.email || email || '');
    const accountName = text(fullName || user.user_metadata?.full_name || accountEmail?.split('@')[0] || 'Cliente', 120);
    const accountPhone = text(phone || user.user_metadata?.phone || '', 40);
    const nowIso = new Date().toISOString();

    let clientId = accessReservation?.clientId || plate.client_id || null;
    let createdClientId = null;
    let membershipCreated = false;
    let destinationId = null;
    let destinationUrl = url;
    let smartPageId = null;
    let smartPageCreated = false;
    let smartPage = null;
    let claimSucceeded = false;

    try {
      if (clientId && !accessReservation?.email) {
        const assignedRows = await supabaseRest(`tap_clients?id=eq.${encodeURIComponent(clientId)}&select=id,email&limit=1`);
        const assignedEmail = normalizeEmail(assignedRows?.[0]?.email || '');
        if (assignedEmail && assignedEmail !== accountEmail) {
          if (createdNewUser && createdUserId) await supabaseAuthAdmin(`users/${encodeURIComponent(createdUserId)}`, { method: 'DELETE' }).catch(() => null);
          return activationError(res, 'EMAIL_MISMATCH');
        }
      }

      if (!clientId) {
        const client = await createClient({ companyName, contactName: accountName, phone: accountPhone, email: accountEmail, userId: user.id });
        if (!client?.id) throw new Error('CLIENT_CREATE_FAILED');
        clientId = client.id;
        createdClientId = client.id;
      } else {
        const client = await enrichExistingClient(clientId, { contactName: accountName, phone: accountPhone, email: accountEmail });
        if (!client) throw new Error('CLIENT_NOT_FOUND');
      }

      const member = await ensureMembership(clientId, user.id);
      membershipCreated = Boolean(member.created);

      if (smartExperience) {
        const smart = await createSmartPage({
          req,
          plate,
          clientId,
          businessName: smartBusinessName || companyName,
          requestedSlug: requestedSmartSlug,
          phone: accountPhone
        });
        smartPage = smart.page;
        smartPageId = smart.page?.id || null;
        smartPageCreated = Boolean(smart.created);
        destinationUrl = smartUrl(req, smart.page.slug);
      }

      const destinationType = smartExperience ? 'smart' : type;
      const destination = await createDestination(plate.id, destinationType, destinationUrl, LABELS[type], user.id);
      if (!destination?.id) throw new Error('DESTINATION_CREATE_FAILED');
      destinationId = destination.id;

      const claimed = await claimPlate(plate.id, {
        client_id: clientId,
        owner_user_id: user.id,
        setup_status: 'completed',
        configuration_locked: true,
        configured_at: nowIso,
        configured_by: user.id,
        claimed_at: nowIso,
        current_destination_id: destinationId,
        status: 'active',
        production_status: 'activated',
        production_status_updated_at: nowIso,
        activated_at: plate.activated_at || nowIso,
        updated_at: nowIso
      });

      if (!claimed?.id) {
        await cleanupFailedClaim({ destinationId, smartPageId, smartPageCreated, createdClientId, clientId, userId: user.id, membershipCreated });
        if (createdNewUser && createdUserId) await supabaseAuthAdmin(`users/${encodeURIComponent(createdUserId)}`, { method: 'DELETE' }).catch(() => null);
        return activationError(res, 'ACTIVATION_CONFLICT');
      }
      claimSucceeded = true;

      // Depois do claim, deixa somente o destino atual como ativo e consome o PIN.
      await supabaseRest(`tap_plate_destinations?plate_id=eq.${encodeURIComponent(plate.id)}&id=neq.${encodeURIComponent(destinationId)}&is_active=eq.true`, {
        method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ is_active: false })
      }).catch(() => null);

      await updateActivation(plate.id, {
        consumed_at: nowIso,
        failed_attempts: 0,
        last_failed_at: null,
        locked_until: null
      }).catch((postClaimError) => {
        console.error('[public/activate:v7:pin-consume]', { plateId: plate.id, detail: postClaimError?.detail || postClaimError?.message });
      });

      await claimAccessReservation(accessReservation, user.id);

      let wifi = null;
      if ((type === 'wifi' || type === 'hybrid') && smartPageId && wifiConfig) {
        try {
          wifi = await upsertWifiProfile({ plateId: plate.id, smartPageId, userId: user.id, config: wifiConfig });
          await supabaseRest(`tap_smart_pages?id=eq.${encodeURIComponent(smartPageId)}`, {
            method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ wifi_name: null, wifi_password: null })
          }).catch(() => null);
        } catch (wifiError) {
          console.error('[public/activate:v7:wifi]', { plateId: plate.id, code: wifiError?.code, detail: wifiError?.detail || wifiError?.message });
        }
      }

      await supabaseRest('tap_audit_logs', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          actor_user_id: user.id,
          action: 'plate.self_activation.complete.v7',
          entity_type: 'plate',
          entity_id: plate.id,
          metadata: { client_id: clientId, destination_id: destinationId, smart_page_id: smartPageId, type, wifi_mode: wifi?.mode || 'off', source: 'atv', engine: 'rest_v7' }
        })
      }).catch(() => null);

      if (mode === 'existing') sessionReady = true;
      stage = 'done';
      return res.status(200).json({
        ok: true,
        activated: true,
        activationEngine: 'REST_V7',
        code,
        sessionReady,
        emailConfirmationRequired: mode === 'signup' && !sessionReady,
        plateId: plate.id,
        clientId,
        destinationUrl,
        smartPage: smartPage ? { id: smartPage.id, slug: smartPage.slug, businessName: smartPage.business_name, url: smartUrl(req, smartPage.slug) } : null,
        wifi: wifi ? { mode: wifi.mode, ssid: wifi.ssid, security: wifi.security, hidden: wifi.hidden, directQrEnabled: wifi.directQrEnabled, payload: wifi.directQrEnabled ? wifi.payload : '' } : null,
        configuredAt: nowIso
      });
    } catch (innerError) {
      if (!claimSucceeded) {
        await cleanupFailedClaim({ destinationId, smartPageId, smartPageCreated, createdClientId, clientId, userId: user.id, membershipCreated });
      }
      throw innerError;
    }
  } catch (error) {
    const code = publicErrorCode(error);
    const reference = activationReference();
    console.error('[public/activate:v7]', { reference, stage, code, status: error?.status, detail: error?.detail || error?.message });

    if (createdNewUser && createdUserId && stage === 'activate_rest_v7') {
      await supabaseAuthAdmin(`users/${encodeURIComponent(createdUserId)}`, { method: 'DELETE' }).catch(() => null);
    }

    if (code === 'WIFI_ENCRYPTION_KEY_MISSING') {
      return res.status(503).json({ ok:false, error:code, message:'O Wi-Fi Connect ainda não foi habilitado no servidor. Configure TAJO_WIFI_ENCRYPTION_KEY na Vercel.', reference });
    }

    return res.status(503).json({
      ok: false,
      error: code,
      message: 'Não foi possível concluir a ativação. Nenhuma nova ativação foi confirmada. Tente novamente e, se persistir, informe a referência ao suporte TAJO.',
      reference
    });
  }
}
