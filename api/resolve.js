import { publicErrorCode, supabaseRest } from './_supabase.js';

const HTML_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow'
};

function safeCode(value) {
  const code = String(value || '').trim().toUpperCase();
  return /^TT-[A-Z0-9]{6,12}$/.test(code) ? code : null;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function htmlPage(title, text, status = 200, reference = '') {
  const safeTitle = escapeHtml(title);
  const safeText = escapeHtml(text);
  const safeReference = escapeHtml(reference);
  return {
    status,
    body: `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${safeTitle} · TAJO TAP</title><style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0d0e;color:#f4f7f4;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;padding:24px}main{width:min(100%,660px)}b{color:#54d90d;font-size:.9rem;letter-spacing:.06em}h1{font-size:clamp(2.3rem,7vw,4.4rem);letter-spacing:-.055em;line-height:.96;margin:.55rem 0 1rem}p{color:#a5aea8;line-height:1.65;font-size:clamp(.98rem,2vw,1.08rem)}small{display:block;margin-top:28px;color:#647068}.ref{margin-top:14px;color:#59625c;font:12px ui-monospace,SFMono-Regular,Menlo,monospace}</style></head><body><main><b>TAJO TAP</b><h1>${safeTitle}</h1><p>${safeText}</p><small>tajodigital.com.br</small>${safeReference ? `<div class="ref">REF: ${safeReference}</div>` : ''}</main></body></html>`
  };
}

function sendHtml(res, page) {
  Object.entries(HTML_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
  return res.status(page.status).send(page.body);
}

export default async function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end('Method Not Allowed');
  }

  const code = safeCode(req.query.code);
  const source = req.query.source === 'nfc' ? 'nfc' : 'qr';
  const panelBase = String(process.env.PANEL_BASE_URL || 'https://painel.tajodigital.com.br').replace(/\/+$/, '');

  if (!code) {
    return sendHtml(res, htmlPage('Código inválido', 'O identificador desta plaquinha não possui um formato válido.', 400));
  }

  try {
    const rows = await supabaseRest(
      `plates?code=eq.${encodeURIComponent(code)}&select=id,code,status,current_destination_id&limit=1`
    );
    const plate = Array.isArray(rows) ? rows[0] : null;

    if (!plate) {
      return sendHtml(res, htmlPage('Plaquinha não encontrada', `Não encontramos a plaquinha ${code}. Confira o código ou fale com a TAJO.`, 404));
    }

    if (plate.status === 'inventory' || plate.status === 'unconfigured') {
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      return res.redirect(302, `${panelBase}/#/activate/${encodeURIComponent(code)}`);
    }

    if (plate.status === 'paused') {
      return sendHtml(res, htmlPage('Acesso temporariamente pausado', 'Esta plaquinha existe, mas o direcionamento está temporariamente indisponível.', 200));
    }

    if (plate.status === 'archived') {
      return sendHtml(res, htmlPage('Plaquinha indisponível', 'Esta plaquinha não está mais ativa.', 410));
    }

    if (plate.status !== 'active' || !plate.current_destination_id) {
      return sendHtml(res, htmlPage('Configuração incompleta', 'Esta plaquinha ainda não possui um destino disponível.', 409));
    }

    // The destination must belong to this same plate as a defense-in-depth check.
    const destinations = await supabaseRest(
      `plate_destinations?id=eq.${encodeURIComponent(plate.current_destination_id)}&plate_id=eq.${encodeURIComponent(plate.id)}&select=id,url,type,is_active&limit=1`
    );
    const destination = Array.isArray(destinations) ? destinations[0] : null;

    if (!destination || !destination.is_active || !/^https:\/\/[^\s]+$/i.test(destination.url || '')) {
      return sendHtml(res, htmlPage('Destino indisponível', 'O destino desta plaquinha precisa ser revisado pelo responsável.', 409));
    }

    // Analytics is best-effort. A logging failure must never block the visitor.
    // HEAD requests are not counted to avoid false scans from bots/prefetchers.
    if (req.method === 'GET') {
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
        console.error('[TAJO TAP resolver] analytics failed', {
          code: analyticsError?.code,
          status: analyticsError?.status,
          detail: analyticsError?.detail
        });
      }
    }

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    return res.redirect(302, destination.url);
  } catch (error) {
    const reference = `${publicErrorCode(error)}-${Date.now().toString(36).toUpperCase()}`;
    console.error('[TAJO TAP resolver] fatal', {
      reference,
      code,
      source,
      errorCode: error?.code,
      status: error?.status,
      detail: error?.detail
    });

    res.setHeader('X-Tajo-Error', publicErrorCode(error));
    return sendHtml(
      res,
      htmlPage(
        'Não foi possível abrir esta plaquinha',
        'A conexão com o serviço de direcionamento falhou. Tente novamente em alguns instantes. Se continuar, informe a referência abaixo ao suporte TAJO.',
        503,
        reference
      )
    );
  }
}
