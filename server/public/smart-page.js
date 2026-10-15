import { allowMethods, setNoStore } from '../_http.js';
import { clean, digits, httpsUrl } from '../_smart.js';
import { getWifiProfileBySmartPage } from '../_wifi.js';
import { publicErrorCode, supabaseRest } from '../_supabase.js';

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
}
function attr(value) { return esc(value); }
function safeSlug(value) { return clean(value, 64).toLowerCase().replace(/[^a-z0-9-]/g, ''); }
function buttonHref(slug, key) { return `/bio/${encodeURIComponent(slug)}/go/${encodeURIComponent(key)}`; }
function linkButton(slug, key, label, icon='↗') {
  return `<a class="smart-link" href="${buttonHref(slug,key)}"><span class="smart-link-icon">${icon}</span><span>${esc(label)}</span><b>›</b></a>`;
}
function serviceCards(services) {
  if (!Array.isArray(services) || !services.length) return '';
  return `<section class="smart-section"><div class="smart-section-head"><span>Serviços</span><h2>O que você encontra aqui</h2></div><div class="smart-services">${services.map(s => `<article><strong>${esc(typeof s === 'string' ? s : s.label)}</strong>${typeof s === 'object' && s.description ? `<p>${esc(s.description)}</p>` : ''}</article>`).join('')}</div></section>`;
}
function customLinks(slug, links) {
  if (!Array.isArray(links) || !links.length) return '';
  return links.map((l, i) => l?.url ? linkButton(slug, `custom-${i}`, l.label || `Link ${i+1}`, '↗') : '').join('');
}

function wifiSection(wifi) {
  if (!wifi || !wifi.publicEnabled || !wifi.ssid) return '';
  const modeTitle = wifi.mode === 'wifi' ? 'Wi-Fi Connect' : 'Conecte-se ao Wi-Fi';
  const passwordLine = wifi.security === 'nopass'
    ? '<span>Rede aberta · sem senha</span>'
    : `<span>Senha disponível para copiar</span>`;
  const qr = wifi.directQrEnabled && wifi.payload
    ? `<div class="wifi-qr-wrap"><canvas class="wifi-qr-canvas" width="520" height="520" data-wifi-payload="${attr(wifi.payload)}" aria-label="QR Code de conexão Wi-Fi"></canvas><small>Escaneie este QR com a câmera do celular para receber a opção de conexão à rede.</small></div>`
    : '';
  const copyPassword = wifi.security === 'nopass' ? '' : `<button class="wifi-action" type="button" data-copy="${attr(wifi.password)}">Copiar senha</button>`;
  return `<section class="smart-section wifi-connect ${wifi.mode==='wifi'?'wifi-focus':''}"><div class="smart-section-head"><span>Wi-Fi</span><h2>${esc(modeTitle)}</h2></div><article class="wifi-card"><div class="wifi-copy"><div class="wifi-icon">⌁</div><div><span class="wifi-label">${esc(wifi.label || 'Wi-Fi do estabelecimento')}</span><strong>${esc(wifi.ssid)}</strong>${passwordLine}${wifi.hidden?'<small>Rede oculta</small>':''}</div></div><div class="wifi-actions">${copyPassword}<button class="wifi-action wifi-action-primary" type="button" data-toggle-wifi-qr>Mostrar QR Wi-Fi</button></div>${qr}</article></section>`;
}

export default async function handler(req, res) {
  setNoStore(res);
  if (!allowMethods(req, res, ['GET'])) return;
  const slug = safeSlug(req.query?.slug);
  if (!slug) return res.status(404).send('Smart Page não encontrada.');
  try {
    const rows = await supabaseRest(`tap_smart_pages?slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&select=*&limit=1`);
    const page = rows?.[0];
    if (!page) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(404).send('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>TAJO TAP</title><body style="font-family:system-ui;background:#0b0d0e;color:#fff;display:grid;place-items:center;min-height:100vh"><main><h1>Smart Page não encontrada.</h1><p>Confira o endereço ou fale com a empresa responsável.</p></main></body></html>');
    }

    await supabaseRest('tap_smart_page_events', {
      method: 'POST', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ smart_page_id: page.id, event_type: 'view', action_key: 'page', action_label: 'Visualização' })
    }).catch(() => null);

    const [clientRows, plateRows, wifi] = await Promise.all([
      supabaseRest(`tap_clients?id=eq.${encodeURIComponent(page.client_id)}&select=name,city,state&limit=1`).catch(() => []),
      page.plate_id ? supabaseRest(`tap_plates?id=eq.${encodeURIComponent(page.plate_id)}&select=code&limit=1`).catch(() => []) : [],
      getWifiProfileBySmartPage(page.id).catch((error) => {
        console.error('[public/smart-page:wifi]', { code:error?.code, detail:error?.message });
        return null;
      })
    ]);
    const client = clientRows?.[0] || {};
    const plate = plateRows?.[0] || {};
    const primary = /^#[0-9A-F]{6}$/i.test(page.primary_color || '') ? page.primary_color : '#45E600';
    const background = /^#[0-9A-F]{6}$/i.test(page.background_color || '') ? page.background_color : '#0B0D0E';
    const text = /^#[0-9A-F]{6}$/i.test(page.text_color || '') ? page.text_color : '#F4F7F2';
    const radius = page.button_style === 'pill' ? '999px' : page.button_style === 'square' ? '10px' : '18px';

    const actions = [];
    if (digits(page.whatsapp)) actions.push(linkButton(slug,'whatsapp','WhatsApp','✆'));
    if (digits(page.phone)) actions.push(linkButton(slug,'phone','Ligar','☎'));
    if (page.instagram) actions.push(linkButton(slug,'instagram','Instagram','◎'));
    if (page.tiktok) actions.push(linkButton(slug,'tiktok','TikTok','♪'));
    if (httpsUrl(page.website_url)) actions.push(linkButton(slug,'website','Site oficial','⌂'));
    if (httpsUrl(page.maps_url)) actions.push(linkButton(slug,'maps','Localização','⌖'));
    if (httpsUrl(page.google_review_url)) actions.push(linkButton(slug,'google-review','Avalie no Google','★'));
    if (page.public_email) actions.push(linkButton(slug,'email','E-mail','✉'));
    actions.push(customLinks(slug, page.custom_links));

    const identityImage = page.logo_url && httpsUrl(page.logo_url) ? `<img class="smart-logo" src="${attr(page.logo_url)}" alt="Logo de ${attr(page.business_name)}">` : `<div class="smart-logo smart-logo-fallback">${esc((page.business_name || 'T').slice(0,1).toUpperCase())}</div>`;
    const coverStyle = page.cover_url && httpsUrl(page.cover_url) ? `style="background-image:linear-gradient(180deg,rgba(0,0,0,.12),rgba(0,0,0,.72)),url('${attr(page.cover_url)}')"` : '';
    const location = [client.city, client.state].filter(Boolean).join(' · ');
    const wifiOnly = wifi?.mode === 'wifi';

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'index, follow');
    return res.status(200).send(`<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(page.business_name)} | TAJO TAP</title>
<meta name="description" content="${attr((page.bio || page.subtitle || `Conheça ${page.business_name}`).slice(0,160))}">
<meta name="theme-color" content="${attr(background)}">
<meta property="og:title" content="${attr(page.business_name)}">
<meta property="og:description" content="${attr((page.bio || page.subtitle || '').slice(0,180))}">
${page.cover_url && httpsUrl(page.cover_url) ? `<meta property="og:image" content="${attr(page.cover_url)}">` : ''}
<style>
:root{--brand:${primary};--bg:${background};--ink:${text};--radius:${radius}}*{box-sizing:border-box}html{background:#070908}body{margin:0;background:radial-gradient(circle at 30% -10%,color-mix(in srgb,var(--brand) 20%,transparent),transparent 34%),var(--bg);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;min-height:100vh}.smart-wrap{width:min(100%,620px);margin:auto;padding:18px 16px 48px}.smart-cover{height:190px;border-radius:28px;background:linear-gradient(135deg,color-mix(in srgb,var(--brand) 44%,#111),#111);background-size:cover;background-position:center;box-shadow:0 22px 70px rgba(0,0,0,.28)}.smart-profile{margin:-54px 14px 0;position:relative}.smart-logo{width:104px;height:104px;border-radius:30px;object-fit:cover;background:#fff;border:6px solid var(--bg);box-shadow:0 12px 32px rgba(0,0,0,.35)}.smart-logo-fallback{display:grid;place-items:center;color:#0b0d0e;background:var(--brand);font-size:42px;font-weight:900}.smart-actions-top{position:absolute;right:0;top:60px;display:flex;gap:8px}.smart-icon-btn{border:1px solid rgba(255,255,255,.12);background:rgba(16,18,17,.8);color:var(--ink);padding:11px 14px;border-radius:999px;font-weight:700;backdrop-filter:blur(16px)}.smart-title{padding-top:14px}.smart-title h1{font-size:clamp(30px,8vw,44px);line-height:1;letter-spacing:-.04em;margin:8px 0}.smart-title p{margin:8px 0;color:color-mix(in srgb,var(--ink) 72%,transparent);font-size:15px;line-height:1.55}.smart-location{display:inline-flex;gap:7px;align-items:center;margin-top:8px;padding:7px 11px;border-radius:999px;background:rgba(255,255,255,.06);font-size:12px}.smart-links{display:grid;gap:11px;margin:28px 0}.smart-link{min-height:58px;display:grid;grid-template-columns:34px 1fr 22px;align-items:center;gap:10px;text-decoration:none;color:var(--ink);padding:11px 15px;border:1px solid rgba(255,255,255,.10);border-radius:var(--radius);background:linear-gradient(90deg,color-mix(in srgb,var(--brand) 18%,rgba(255,255,255,.05)),rgba(255,255,255,.04));box-shadow:0 8px 30px rgba(0,0,0,.12);font-weight:780;transition:.18s transform,.18s border-color}.smart-link:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--brand) 55%,transparent)}.smart-link-icon{width:34px;height:34px;display:grid;place-items:center;background:var(--brand);color:#0b0d0e;border-radius:12px;font-weight:900}.smart-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.smart-info{padding:16px;border-radius:20px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);min-height:92px}.smart-info span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.12em;opacity:.58;margin-bottom:7px}.smart-info strong{font-size:14px;word-break:break-word}.smart-section{margin-top:28px}.smart-section-head span{color:var(--brand);text-transform:uppercase;letter-spacing:.13em;font-size:11px;font-weight:900}.smart-section-head h2{margin:5px 0 14px;font-size:22px}.smart-services{display:grid;gap:10px}.smart-services article{padding:17px;border-radius:20px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}.smart-services p{margin:6px 0 0;opacity:.68;font-size:13px;line-height:1.5}.wifi-card{padding:18px;border:1px solid color-mix(in srgb,var(--brand) 36%,rgba(255,255,255,.12));border-radius:24px;background:linear-gradient(145deg,color-mix(in srgb,var(--brand) 12%,rgba(255,255,255,.05)),rgba(255,255,255,.035));box-shadow:0 16px 44px rgba(0,0,0,.16)}.wifi-copy{display:grid;grid-template-columns:52px 1fr;gap:13px;align-items:center}.wifi-icon{width:52px;height:52px;border-radius:17px;background:var(--brand);color:#081006;display:grid;place-items:center;font-size:28px;font-weight:900}.wifi-copy>div:last-child{display:grid;gap:3px}.wifi-label{font-size:11px;text-transform:uppercase;letter-spacing:.1em;opacity:.62}.wifi-copy strong{font-size:20px;overflow-wrap:anywhere}.wifi-copy span,.wifi-copy small{color:color-mix(in srgb,var(--ink) 68%,transparent);font-size:12px}.wifi-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:16px}.wifi-action{min-height:46px;border:1px solid rgba(255,255,255,.11);border-radius:14px;background:rgba(255,255,255,.05);color:var(--ink);font-weight:800}.wifi-action-primary{background:var(--brand);color:#081006;border-color:var(--brand)}.wifi-qr-wrap{display:none;margin-top:16px;padding:14px;border-radius:18px;background:#fff;color:#111;text-align:center}.wifi-qr-wrap.is-visible{display:block}.wifi-qr-canvas{display:block;width:min(100%,280px);height:auto;margin:auto}.wifi-qr-wrap small{display:block;margin:10px auto 0;max-width:34ch;line-height:1.45;color:#525852}.wifi-focus{margin-top:18px}.smart-footer{text-align:center;padding:36px 12px 0;opacity:.66;font-size:12px}.smart-footer strong{color:var(--brand)}@media(max-width:420px){.smart-wrap{padding-inline:11px}.smart-cover{height:165px;border-radius:23px}.smart-profile{margin-inline:10px}.smart-info-grid{grid-template-columns:1fr}.smart-title h1{font-size:34px}.wifi-actions{grid-template-columns:1fr}}
</style>
<script src="/assets/js/qr-core.js" defer></script><script src="/assets/js/smart-page.js" defer></script>
</head><body><main class="smart-wrap">
<section class="smart-cover" ${coverStyle}></section>
<section class="smart-profile">${identityImage}<div class="smart-actions-top"><button class="smart-icon-btn" data-share="${attr(page.business_name)}">Compartilhar</button></div><div class="smart-title"><h1>${esc(page.business_name)}</h1>${page.subtitle ? `<p><strong>${esc(page.subtitle)}</strong></p>` : ''}${page.bio ? `<p>${esc(page.bio)}</p>` : ''}${location ? `<span class="smart-location">⌖ ${esc(location)}</span>` : ''}</div></section>
${wifiOnly ? wifiSection(wifi) : ''}
${wifiOnly ? '' : `<section class="smart-links">${actions.join('')}</section>`}
${wifiOnly ? '' : wifiSection(wifi)}
${wifiOnly ? '' : ((page.pix_key || page.opening_hours || page.address) ? `<section class="smart-info-grid">${page.pix_key ? `<button class="smart-info smart-copy" data-copy="${attr(page.pix_key)}"><span>Chave Pix</span><strong>${esc(page.pix_key)}</strong></button>` : ''}${page.opening_hours ? `<div class="smart-info"><span>Horário</span><strong>${esc(page.opening_hours)}</strong></div>` : ''}${page.address ? `<div class="smart-info"><span>Endereço</span><strong>${esc(page.address)}</strong></div>` : ''}</section>` : '')}
${wifiOnly ? '' : serviceCards(page.services)}
<footer class="smart-footer">Powered by <strong>TAJO TAP</strong>${plate.code ? ` · ${esc(plate.code)}` : ''}<br>Sistema desenvolvido por João Paulo Brandão</footer>
</main><div id="smart-toast" style="position:fixed;left:50%;bottom:22px;transform:translateX(-50%) translateY(16px);opacity:0;transition:.2s;background:#fff;color:#111;padding:11px 15px;border-radius:999px;font:700 12px system-ui;pointer-events:none">Copiado</div></body></html>`);
  } catch (error) {
    console.error('[public/smart-page:v7]', { code: publicErrorCode(error), status: error?.status, detail: error?.detail || error?.message });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(503).send('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>TAJO TAP</title><body style="font-family:system-ui;background:#0b0d0e;color:#fff;display:grid;place-items:center;min-height:100vh"><main><h1>Smart Page temporariamente indisponível.</h1><p>Tente novamente em instantes.</p></main></body></html>');
  }
}
