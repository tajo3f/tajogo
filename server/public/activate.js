import crypto from 'node:crypto';
import { allowMethods, apiError, readJson, safePlateCode, setNoStore, text } from '../_http.js';
import { currentUser, setSessionCookies } from '../_auth.js';
import { publicErrorCode, supabaseAuth, supabaseAuthAdmin, supabaseRest } from '../_supabase.js';
import { smartUrl } from '../_smart.js';

const TYPES = new Set(['google', 'whatsapp', 'instagram', 'smart', 'map', 'custom']);
const LABELS = {
  google: 'Avaliações Google',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  smart: 'TAJO Smart Page',
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
    `tap_plates?code=eq.${encodeURIComponent(code)}&select=id,code,name,status,client_id,owner_user_id,current_destination_id,setup_status,configuration_locked,configured_at,activated_at&limit=1`
  );
  return rows?.[0] || null;
}

async function getActivation(plateId) {
  const rows = await supabaseRest(
    `tap_plate_activation_codes?plate_id=eq.${encodeURIComponent(plateId)}&select=plate_id,code_hash,consumed_at,expires_at,failed_attempts,last_failed_at,locked_until&limit=1`
  );
  return rows?.[0] || null;
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

async function cleanupFailedClaim({ destinationId, createdClientId, clientId, userId, membershipCreated }) {
  if (destinationId) {
    await supabaseRest(`tap_plate_destinations?id=eq.${encodeURIComponent(destinationId)}`, {
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

      const configured = Boolean(plate.configuration_locked || plate.setup_status === 'completed' || plate.status === 'active');
      const available = !configured && ['inventory', 'unconfigured'].includes(plate.status);
      const smartRows = await supabaseRest(`tap_smart_pages?plate_id=eq.${encodeURIComponent(plate.id)}&is_published=eq.true&select=id,slug,business_name&limit=1`).catch(() => []);
      const smartPage = smartRows?.[0] || null;
      return res.status(200).json({
        ok: true,
        activationEngine: 'REST_V4_4',
        plate: {
          code: plate.code,
          name: plate.name,
          status: plate.status,
          assigned: Boolean(plate.client_id),
          setupStatus: plate.setup_status || (configured ? 'completed' : 'pending'),
          configured,
          available,
          configuredAt: plate.configured_at || null,
          smartPage: smartPage ? { id: smartPage.id, businessName: smartPage.business_name, url: smartUrl(req, smartPage.slug) } : null
        }
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
    const url = validHttps(body?.url);

    if (!code) return apiError(res, 400, 'CODE_INVALID', 'Código de plaquinha inválido.');
    if (!/^\d{6}$/.test(pin)) return apiError(res, 400, 'PIN_INVALID', 'Informe os seis números do código de ativação.');
    if (!TYPES.has(type)) return apiError(res, 400, 'TYPE_INVALID', 'Selecione um tipo de destino válido.');
    if (!url) return apiError(res, 400, 'URL_INVALID', 'Informe um link HTTPS válido.');
    if (companyName.length < 2) return apiError(res, 400, 'COMPANY_REQUIRED', 'Informe o nome do estabelecimento.');

    // V4.4: validação direta via REST server-side. Não depende do cache de RPC do PostgREST.
    stage = 'pin_validation_rest';
    let plate = await getPlate(code);
    if (!plate) return activationError(res, 'PLATE_NOT_FOUND');
    const pinCheck = await validatePin(plate, pin);
    if (!pinCheck.ok) return activationError(res, pinCheck.code, pinCheck.retryAfter || null);

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

      let signup;
      try {
        signup = await supabaseAuth('signup', {
          method: 'POST',
          body: JSON.stringify({ email, password, data: { full_name: fullName, phone } })
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
      createdUserId = user.id;
      createdNewUser = true;
      const signupSession = signup.session || signup;
      if (signupSession?.access_token && signupSession?.refresh_token) {
        setSessionCookies(res, signupSession);
        sessionReady = true;
      }
    }

    stage = 'activate_rest_v4_4';
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

    const accountEmail = String(user.email || email || '').toLowerCase();
    const accountName = text(fullName || user.user_metadata?.full_name || accountEmail?.split('@')[0] || 'Cliente', 120);
    const accountPhone = text(phone || user.user_metadata?.phone || '', 40);
    const nowIso = new Date().toISOString();

    let clientId = plate.client_id || null;
    let createdClientId = null;
    let membershipCreated = false;
    let destinationId = null;
    let claimSucceeded = false;

    try {
      if (clientId) {
        const assignedRows = await supabaseRest(`tap_clients?id=eq.${encodeURIComponent(clientId)}&select=id,email&limit=1`);
        const assignedEmail = String(assignedRows?.[0]?.email || '').trim().toLowerCase();
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

      const destination = await createDestination(plate.id, type, url, LABELS[type], user.id);
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
        await cleanupFailedClaim({ destinationId, createdClientId, clientId, userId: user.id, membershipCreated });
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
        console.error('[public/activate:v4.4:pin-consume]', { plateId: plate.id, detail: postClaimError?.detail || postClaimError?.message });
      });

      await supabaseRest('tap_audit_logs', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          actor_user_id: user.id,
          action: 'plate.self_activation.complete.v4_4',
          entity_type: 'plate',
          entity_id: plate.id,
          metadata: { client_id: clientId, destination_id: destinationId, type, source: 'atv', engine: 'rest_v4_4' }
        })
      }).catch(() => null);

      if (mode === 'existing') sessionReady = true;
      stage = 'done';
      return res.status(200).json({
        ok: true,
        activated: true,
        activationEngine: 'REST_V4_4',
        code,
        sessionReady,
        emailConfirmationRequired: mode === 'signup' && !sessionReady,
        plateId: plate.id,
        clientId,
        configuredAt: nowIso
      });
    } catch (innerError) {
      if (!claimSucceeded) {
        await cleanupFailedClaim({ destinationId, createdClientId, clientId, userId: user.id, membershipCreated });
      }
      throw innerError;
    }
  } catch (error) {
    const code = publicErrorCode(error);
    const reference = activationReference();
    console.error('[public/activate:v4.4]', { reference, stage, code, status: error?.status, detail: error?.detail || error?.message });

    if (createdNewUser && createdUserId && stage === 'activate_rest_v4_4') {
      await supabaseAuthAdmin(`users/${encodeURIComponent(createdUserId)}`, { method: 'DELETE' }).catch(() => null);
    }

    return res.status(503).json({
      ok: false,
      error: code,
      message: 'Não foi possível concluir a ativação. Nenhuma nova ativação foi confirmada. Tente novamente e, se persistir, informe a referência ao suporte TAJO.',
      reference
    });
  }
}
