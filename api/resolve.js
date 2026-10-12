const HTML_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer'
};

function safeCode(value) {
  const code = String(value || '').trim().toUpperCase();
  return /^TT-[A-Z0-9]{6,12}$/.test(code) ? code : null;
}

function htmlPage(title, text, status = 200) {
  return {
    status,
    body: `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title} · TAJO TAP</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0d0e;color:#f4f7f4;font-family:system-ui,-apple-system,Segoe UI,sans-serif;padding:24px}main{max-width:560px}b{color:#54d90d}h1{font-size:clamp(2rem,7vw,4rem);letter-spacing:-.05em;line-height:.95;margin:.4rem 0 1rem}p{color:#a5aea8;line-height:1.65}small{color:#647068}</style></head><body><main><b>TAJO TAP</b><h1>${title}</h1><p>${text}</p><small>tajodigital.com.br</small></main></body></html>`
  };
}

async function supabaseRest(path, options = {}) {
  const base = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!base || !secret) throw new Error('SERVER_ENV_MISSING');

  const response = await fetch(`${base}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: secret,
      Authorization: `Bearer ${secret}`,
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('[TAJO TAP resolver] Supabase error', response.status, detail.slice(0, 500));
    throw new Error(`SUPABASE_${response.status}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export default async function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end('Method Not Allowed');
  }

  const code = safeCode(req.query.code);
  const source = req.query.source === 'nfc' ? 'nfc' : 'qr';
  const panelBase = (process.env.PANEL_BASE_URL || 'https://painel.tajodigital.com.br').replace(/\/$/, '');

  if (!code) {
    const page = htmlPage('Código inválido', 'O identificador desta plaquinha não possui um formato válido.', 400);
    Object.entries(HTML_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(page.status).send(page.body);
  }

  try {
    const rows = await supabaseRest(`plates?code=eq.${encodeURIComponent(code)}&select=id,code,status,current_destination_id&limit=1`);
    const plate = Array.isArray(rows) ? rows[0] : null;

    if (!plate) {
      const page = htmlPage('Plaquinha não encontrada', `Não encontramos a plaquinha ${code}. Confira o código ou fale com a TAJO.`, 404);
      Object.entries(HTML_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
      return res.status(page.status).send(page.body);
    }

    if (plate.status === 'inventory' || plate.status === 'unconfigured') {
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      return res.redirect(302, `${panelBase}/#/activate/${encodeURIComponent(code)}`);
    }

    if (plate.status === 'paused') {
      const page = htmlPage('Acesso temporariamente pausado', 'Esta plaquinha existe, mas o direcionamento está temporariamente indisponível.', 200);
      Object.entries(HTML_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
      return res.status(page.status).send(page.body);
    }

    if (plate.status === 'archived') {
      const page = htmlPage('Plaquinha indisponível', 'Esta plaquinha não está mais ativa.', 410);
      Object.entries(HTML_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
      return res.status(page.status).send(page.body);
    }

    if (plate.status !== 'active' || !plate.current_destination_id) {
      const page = htmlPage('Configuração incompleta', 'Esta plaquinha ainda não possui um destino disponível.', 409);
      Object.entries(HTML_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
      return res.status(page.status).send(page.body);
    }

    const destinations = await supabaseRest(`plate_destinations?id=eq.${encodeURIComponent(plate.current_destination_id)}&select=id,url,type,is_active&limit=1`);
    const destination = Array.isArray(destinations) ? destinations[0] : null;

    if (!destination || !destination.is_active || !/^https:\/\//i.test(destination.url || '')) {
      const page = htmlPage('Destino indisponível', 'O destino desta plaquinha precisa ser revisado pelo responsável.', 409);
      Object.entries(HTML_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
      return res.status(page.status).send(page.body);
    }

    // Analytics is best-effort: a logging failure must never break the redirect.
    try {
      await supabaseRest('scan_events', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          plate_id: plate.id,
          destination_id: destination.id,
          source
        })
      });
    } catch (analyticsError) {
      console.error('[TAJO TAP resolver] analytics failed', analyticsError?.message || analyticsError);
    }

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    return res.redirect(302, destination.url);
  } catch (error) {
    console.error('[TAJO TAP resolver] fatal', error?.message || error);
    const page = htmlPage('Não foi possível abrir esta plaquinha', 'Tente novamente em alguns instantes. Se continuar, fale com o suporte TAJO.', 503);
    Object.entries(HTML_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(page.status).send(page.body);
  }
}
