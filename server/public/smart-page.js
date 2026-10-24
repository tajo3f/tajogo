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
function actionHref(slug, key, fallback = '#') { return key ? buttonHref(slug, key) : fallback; }

function iconSvg(name) {
  const icons = {
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.7a8.3 8.3 0 0 1-12.3 7.2L3.5 20l1.2-4.5A8.3 8.3 0 1 1 20.5 11.7Z"/><path d="M8.2 7.9c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .5.4l.8 1.9c.1.3.1.5-.1.7l-.7.8c-.2.2-.1.4 0 .6.6 1 1.4 1.8 2.4 2.4.2.1.4.2.6 0l.9-1c.2-.2.4-.3.7-.2l1.9.9c.3.1.4.3.4.5 0 .3-.2 1.4-.9 2-.6.6-1.5.8-2.4.6-1.2-.3-2.8-1-4.5-2.5-1.5-1.4-2.5-3.1-2.8-4.2-.3-.9 0-1.8.4-2.5Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.6" cy="6.6" r="1" class="fill"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4v10.3a4.2 4.2 0 1 1-3.3-4.1v2.6a1.8 1.8 0 1 0 .8 1.5V4h2.5Z"/><path d="M14.5 4c.7 2.1 1.9 3.3 4 3.8v2.6c-1.6-.2-2.9-.8-4-1.8"/></svg>',
    website: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.8 12h16.4M12 3.5c2.2 2.3 3.4 5.1 3.4 8.5S14.2 18.2 12 20.5C9.8 18.2 8.6 15.4 8.6 12S9.8 5.8 12 3.5Z"/></svg>',
    maps: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6.5-5.7 6.5-11.5a6.5 6.5 0 1 0-13 0C5.5 15.3 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.2"/></svg>',
    review: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.9-5.4 2.9 1-6-4.4-4.3 6.1-.9L12 3Z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.4 4.5 9.2 8c.2.4.1.9-.2 1.2l-1.3 1.2a14 14 0 0 0 5.9 5.9l1.2-1.3c.3-.3.8-.4 1.2-.2l3.5 1.8c.5.2.7.8.5 1.3l-.7 2c-.2.6-.8 1-1.4 1C9.7 20.4 3.6 14.3 3.1 6.1c0-.6.4-1.2 1-1.4l2-.7c.5-.2 1 .1 1.3.5Z"/></svg>',
    email: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="14" rx="3"/><path d="m5 7 7 5.5L19 7"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 14.5 14.5 9.5M8 17H6a4 4 0 0 1 0-8h3M16 7h2a4 4 0 0 1 0 8h-3"/></svg>',
    wifi: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5a12.5 12.5 0 0 1 16 0M7 13a8 8 0 0 1 10 0M10 16.5a3.5 3.5 0 0 1 4 0"/><circle cx="12" cy="19.5" r="1" class="fill"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    pix: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7.2 6.1 3.4-3.4a2 2 0 0 1 2.8 0l3.4 3.4a2 2 0 0 0 1.4.6h1.4L15.3 11a2 2 0 0 1-2.8 0L9 7.5a2 2 0 0 0-2.8 0L2.5 11h1.4a2 2 0 0 0 1.4-.6l1.9-1.9M16.8 17.9l-3.4 3.4a2 2 0 0 1-2.8 0l-3.4-3.4a2 2 0 0 0-1.4-.6H4.4L8.7 13a2 2 0 0 1 2.8 0l3.5 3.5a2 2 0 0 0 2.8 0l3.7-3.5h-1.4a2 2 0 0 0-1.4.6l-1.9 1.9"/></svg>'
  };
  return icons[name] || icons.link;
}

function card(slug, key, title, description, icon = 'link', options = {}) {
  const cls = options.featured ? 'bio-action bio-action-featured' : 'bio-action';
  const eyebrow = options.eyebrow ? `<span class="bio-action-eyebrow"><i></i>${esc(options.eyebrow)}</span>` : '';
  return `<a class="${cls}" href="${actionHref(slug,key)}"><span class="bio-action-icon">${iconSvg(icon)}</span><span class="bio-action-copy">${eyebrow}<strong>${esc(title)}</strong>${description ? `<small>${esc(description)}</small>` : ''}</span><span class="bio-action-arrow">›</span></a>`;
}

function serviceLabel(item) {
  return clean(typeof item === 'string' ? item : item?.label, 80);
}
function serviceDesc(item) {
  return typeof item === 'object' ? clean(item?.description, 220) : '';
}
function serviceTags(services) {
  const tags = (Array.isArray(services) ? services : []).map(serviceLabel).filter(Boolean).slice(0, 4);
  return tags.length ? `<div class="bio-tags">${tags.map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : '';
}
function serviceSection(services) {
  const rows = (Array.isArray(services) ? services : []).map((item) => ({ label: serviceLabel(item), description: serviceDesc(item) })).filter((x) => x.label);
  if (!rows.length) return '';
  return `<section class="bio-section"><div class="bio-section-title"><span>Serviços</span><h2>O que você encontra aqui</h2></div><div class="bio-service-grid">${rows.map((x) => `<article><strong>${esc(x.label)}</strong>${x.description ? `<p>${esc(x.description)}</p>` : ''}</article>`).join('')}</div></section>`;
}

function customCards(slug, links) {
  if (!Array.isArray(links) || !links.length) return '';
  return links.map((item, i) => {
    if (!item?.url || !httpsUrl(item.url)) return '';
    return card(slug, `custom-${i}`, item.label || `Link ${i + 1}`, item.description || 'Acesse para saber mais', 'link');
  }).join('');
}

function infoCards(page) {
  const cards = [];
  if (page.opening_hours) cards.push(`<article class="bio-info"><span class="bio-info-icon">${iconSvg('clock')}</span><div><small>Horário</small><strong>${esc(page.opening_hours)}</strong></div></article>`);
  if (page.address) cards.push(`<article class="bio-info"><span class="bio-info-icon">${iconSvg('maps')}</span><div><small>Endereço</small><strong>${esc(page.address)}</strong></div></article>`);
  if (page.pix_key) cards.push(`<button class="bio-info bio-info-button" type="button" data-copy="${attr(page.pix_key)}"><span class="bio-info-icon">${iconSvg('pix')}</span><div><small>Pix · toque para copiar</small><strong>${esc(page.pix_key)}</strong></div></button>`);
  return cards.length ? `<section class="bio-info-grid">${cards.join('')}</section>` : '';
}

function wifiSection(wifi, android = false) {
  if (!wifi || !wifi.publicEnabled || !wifi.ssid) return '';
  const openNetwork = wifi.security === 'nopass';
  const passwordLine = openNetwork ? 'Rede aberta · sem senha' : 'Toque para iniciar a conexão';
  const passwordAttr = openNetwork ? '' : ` data-wifi-password="${attr(wifi.password)}"`;
  const commonAttrs = `data-connect-wifi data-wifi-ssid="${attr(wifi.ssid)}" data-wifi-security="${attr(wifi.security)}" data-wifi-hidden="${wifi.hidden ? 'true' : 'false'}"${passwordAttr}`;
  const connectControl = android
    ? `<a class="wifi-action wifi-action-primary" href="intent:#Intent;action=android.settings.WIFI_SETTINGS;end" ${commonAttrs} data-android-wifi-intent>${iconSvg('wifi')} <span>Conectar ao Wi-Fi</span></a>`
    : `<button class="wifi-action wifi-action-primary" type="button" ${commonAttrs}>${iconSvg('wifi')} <span>Conectar ao Wi-Fi</span></button>`;
  return `<section class="bio-section wifi-connect"><div class="bio-section-title"><span>Wi-Fi</span><h2>Conecte-se com facilidade</h2></div><article class="wifi-card"><div class="wifi-copy"><span class="wifi-icon">${iconSvg('wifi')}</span><div><small>${esc(wifi.label || 'Wi-Fi do estabelecimento')}</small><strong>${esc(wifi.ssid)}</strong><p>${esc(passwordLine)}${wifi.hidden ? ' · Rede oculta' : ''}</p></div></div><div class="wifi-actions">${connectControl}</div><p class="wifi-connect-note">A conexão depende da confirmação do sistema do seu celular. A senha é preparada automaticamente quando necessário.</p></article></section>`;
}

function ticker(page, wifi) {
  const items = ['CONECTE-SE'];
  if (Array.isArray(page.services) && page.services.length) items.push('NOSSOS SERVIÇOS');
  if (httpsUrl(page.google_review_url)) items.push('AVALIE SUA EXPERIÊNCIA');
  if (wifi?.publicEnabled) items.push('WI-FI PARA CLIENTES');
  if (items.length < 3) items.push('INFORMAÇÕES EM UM SÓ LUGAR');
  const content = items.map((x) => `<span>${esc(x)}</span><b>✦</b>`).join('');
  return `<div class="bio-ticker"><div>${content}${content}</div></div>`;
}

export default async function handler(req, res) {
  setNoStore(res);
  if (!allowMethods(req, res, ['GET'])) return;
  const slug = safeSlug(req.query?.slug);
  if (!slug) return res.status(404).send('Smart Page não encontrada.');
  const androidDevice = /Android/i.test(String(req.headers?.['user-agent'] || ''));
  try {
    const rows = await supabaseRest(`tap_smart_pages?slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&select=*&limit=1`);
    const page = rows?.[0];
    if (!page) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(404).send('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><link rel="icon" type="image/png" href="/assets/images/favicon-32.png"><title>TAJO TAP</title><body style="font-family:system-ui;background:#07101b;color:#fff;display:grid;place-items:center;min-height:100vh"><main><h1>Smart Page não encontrada.</h1><p>Confira o endereço ou fale com a empresa responsável.</p></main></body></html>');
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
    const text = /^#[0-9A-F]{6}$/i.test(page.text_color || '') ? page.text_color : '#FFFFFF';
    const radius = page.button_style === 'pill' ? '32px' : page.button_style === 'square' ? '14px' : '22px';
    const cityState = [client.city, client.state].filter(Boolean).join('/');
    const locationText = clean(page.address, 160) || cityState;
    const cover = page.cover_url && httpsUrl(page.cover_url) ? page.cover_url : '';
    const logo = page.logo_url && httpsUrl(page.logo_url) ? page.logo_url : '';
    const wifiOnly = wifi?.mode === 'wifi';

    const secondaryCards = [];
    if (httpsUrl(page.website_url)) secondaryCards.push(card(slug, 'website', 'Visitar nosso site', 'Conheça nossos serviços e novidades', 'website'));
    if (page.instagram) secondaryCards.push(card(slug, 'instagram', 'Instagram', 'Acompanhe novidades e conteúdos', 'instagram'));
    if (page.tiktok) secondaryCards.push(card(slug, 'tiktok', 'TikTok', 'Veja nossos conteúdos mais recentes', 'tiktok'));
    if (httpsUrl(page.maps_url)) secondaryCards.push(card(slug, 'maps', 'Como chegar', locationText || 'Abra a rota no mapa', 'maps'));
    if (httpsUrl(page.google_review_url)) secondaryCards.push(card(slug, 'google-review', 'Avalie no Google', 'Sua opinião ajuda nosso negócio', 'review'));
    if (digits(page.phone)) secondaryCards.push(card(slug, 'phone', 'Ligar agora', 'Fale diretamente com nossa equipe', 'phone'));
    if (page.public_email) secondaryCards.push(card(slug, 'email', 'Enviar e-mail', page.public_email, 'email'));
    secondaryCards.push(customCards(slug, page.custom_links));

    const identityImage = logo
      ? `<img class="bio-logo" src="${attr(logo)}" alt="Logo de ${attr(page.business_name)}">`
      : `<div class="bio-logo bio-logo-fallback">${esc((page.business_name || 'T').slice(0,1).toUpperCase())}</div>`;
    const coverImage = cover ? `<img class="bio-cover-image" src="${attr(cover)}" alt="" aria-hidden="true">` : '';
    const locationBadge = locationText
      ? (httpsUrl(page.maps_url)
        ? `<a class="bio-location" href="${buttonHref(slug,'maps')}">${iconSvg('maps')}<span>${esc(locationText)}</span></a>`
        : `<span class="bio-location">${iconSvg('maps')}<span>${esc(locationText)}</span></span>`)
      : '';

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'index, follow');
    return res.status(200).send(`<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(page.business_name)} | TAJO TAP</title>
<meta name="description" content="${attr((page.bio || page.subtitle || `Conheça ${page.business_name}`).slice(0,160))}">
<meta name="theme-color" content="${attr(background)}">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/images/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/images/favicon-16.png">
<link rel="apple-touch-icon" href="/assets/images/icon-192.png">
<meta property="og:title" content="${attr(page.business_name)}">
<meta property="og:description" content="${attr((page.bio || page.subtitle || '').slice(0,180))}">
${cover ? `<meta property="og:image" content="${attr(cover)}">` : ''}
<style>
:root{--brand:${primary};--brand-soft:color-mix(in srgb,var(--brand) 16%,#fff);--bg:${background};--hero-ink:${text};--radius:${radius};--page:#f7f7f8;--ink:#17191d;--muted:#6d7078;--line:#e9eaed;--shadow:0 18px 60px rgba(4,10,20,.18)}*{box-sizing:border-box}html{background:#07101b;scroll-behavior:smooth}body{margin:0;min-height:100vh;color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:radial-gradient(circle at 50% -10%,color-mix(in srgb,var(--brand) 18%,transparent),transparent 42%),#07101b;-webkit-font-smoothing:antialiased}.bio-shell{width:min(100%,540px);margin:0 auto;min-height:100vh;background:var(--page);box-shadow:0 0 90px rgba(0,0,0,.25);overflow:hidden}.bio-hero{position:relative;min-height:390px;padding:34px 22px 26px;color:var(--hero-ink);text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;background:linear-gradient(145deg,color-mix(in srgb,var(--brand) 72%,#151923),#111827);isolation:isolate;overflow:hidden}.bio-cover-image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2}.bio-hero:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 15%,color-mix(in srgb,var(--brand) 26%,transparent),transparent 36%),linear-gradient(180deg,transparent 34%,rgba(0,0,0,.32));z-index:-1}.bio-logo{width:104px;height:104px;border-radius:50%;object-fit:cover;background:#fff;border:5px solid rgba(255,255,255,.92);box-shadow:0 18px 44px rgba(0,0,0,.32);margin-bottom:14px}.bio-logo-fallback{display:grid;place-items:center;color:#111;background:var(--brand);font-size:40px;font-weight:900}.bio-hero h1{font-size:clamp(28px,8vw,40px);line-height:1.02;letter-spacing:-.035em;margin:0;max-width:13ch;text-wrap:balance}.bio-subtitle{font-size:14px;line-height:1.45;margin:9px auto 0;color:rgba(255,255,255,.86);max-width:38ch}.bio-tags{display:flex;flex-wrap:wrap;justify-content:center;gap:7px;margin-top:15px}.bio-tags span{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:6px 9px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(8,12,17,.34);backdrop-filter:blur(10px)}.bio-location{margin-top:14px;display:inline-flex;align-items:center;justify-content:center;gap:7px;max-width:90%;padding:7px 11px;border-radius:999px;background:color-mix(in srgb,var(--brand) 88%,#111 12%);color:#fff;text-decoration:none;font-size:11px;font-weight:800;box-shadow:0 8px 24px rgba(0,0,0,.18)}.bio-location svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.9;flex:none}.bio-about{padding:18px 24px 2px;text-align:center}.bio-about p{margin:0 auto;color:var(--muted);font-size:13px;line-height:1.58;max-width:44ch}.bio-ticker{margin-top:18px;height:38px;overflow:hidden;border-block:1px solid color-mix(in srgb,var(--brand) 34%,var(--line));background:linear-gradient(90deg,color-mix(in srgb,var(--brand) 88%,#111 12%),color-mix(in srgb,var(--brand) 72%,#111 28%));color:#fff}.bio-ticker>div{display:flex;align-items:center;width:max-content;height:100%;animation:ticker 24s linear infinite}.bio-ticker span{font-size:10px;font-weight:900;letter-spacing:.12em;white-space:nowrap;padding:0 20px}.bio-ticker b{opacity:.72}@keyframes ticker{to{transform:translateX(-50%)}}.bio-content{padding:18px 18px 38px}.bio-actions{display:grid;gap:11px}.bio-action{display:grid;grid-template-columns:44px minmax(0,1fr) 22px;gap:12px;align-items:center;min-height:76px;padding:12px 14px;text-decoration:none;color:var(--ink);border:1px solid var(--line);border-radius:var(--radius);background:#fff;box-shadow:0 8px 24px rgba(12,19,31,.07);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;animation:rise .55s both}.bio-action:nth-child(2){animation-delay:.04s}.bio-action:nth-child(3){animation-delay:.08s}.bio-action:nth-child(4){animation-delay:.12s}.bio-action:nth-child(5){animation-delay:.16s}.bio-action:hover{transform:translateY(-2px);box-shadow:0 14px 32px rgba(12,19,31,.11);border-color:color-mix(in srgb,var(--brand) 32%,var(--line))}.bio-action-featured{min-height:92px;color:#fff;border-color:transparent;background:linear-gradient(135deg,color-mix(in srgb,var(--brand) 78%,#111 22%),color-mix(in srgb,var(--brand) 55%,#111 45%));box-shadow:0 16px 34px color-mix(in srgb,var(--brand) 24%,transparent)}.bio-action-icon{width:44px;height:44px;display:grid;place-items:center;border-radius:15px;background:var(--brand-soft);color:color-mix(in srgb,var(--brand) 75%,#111 25%)}.bio-action-featured .bio-action-icon{background:rgba(255,255,255,.16);color:#fff}.bio-action-icon svg,.bio-info-icon svg,.wifi-icon svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.bio-action-icon svg .fill,.wifi-icon svg .fill{fill:currentColor;stroke:none}.bio-action-copy{min-width:0;display:grid;gap:2px}.bio-action-copy strong{font-size:15px;line-height:1.15}.bio-action-copy small{font-size:11px;color:var(--muted);line-height:1.35;white-space:normal}.bio-action-featured .bio-action-copy small{color:rgba(255,255,255,.78)}.bio-action-eyebrow{display:flex;align-items:center;gap:6px;font-size:9px;color:rgba(255,255,255,.76);font-weight:800}.bio-action-eyebrow i{width:6px;height:6px;border-radius:50%;background:#5CFF8A;box-shadow:0 0 0 4px rgba(92,255,138,.12)}.bio-action-arrow{font-size:25px;color:#a4a7ad;font-weight:300}.bio-action-featured .bio-action-arrow{color:#fff}.bio-section{margin-top:26px}.bio-section-title span{display:block;color:color-mix(in srgb,var(--brand) 70%,#111 30%);text-transform:uppercase;letter-spacing:.14em;font-size:9px;font-weight:900}.bio-section-title h2{margin:5px 0 12px;font-size:20px;letter-spacing:-.025em}.bio-service-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.bio-service-grid article{min-height:88px;padding:14px;border-radius:18px;border:1px solid var(--line);background:#fff}.bio-service-grid strong{font-size:13px}.bio-service-grid p{margin:5px 0 0;color:var(--muted);font-size:10.5px;line-height:1.4}.bio-info-grid{display:grid;gap:9px;margin-top:22px}.bio-info{width:100%;display:grid;grid-template-columns:40px 1fr;align-items:center;gap:10px;text-align:left;padding:12px 14px;border:1px solid var(--line);border-radius:18px;background:#fff;color:var(--ink);font:inherit}.bio-info-button{cursor:pointer}.bio-info-icon{width:40px;height:40px;display:grid;place-items:center;border-radius:13px;background:var(--brand-soft);color:color-mix(in srgb,var(--brand) 68%,#111 32%)}.bio-info-icon svg{width:20px;height:20px}.bio-info div{min-width:0}.bio-info small{display:block;color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px}.bio-info strong{display:block;font-size:12px;line-height:1.35;overflow-wrap:anywhere}.wifi-card{padding:15px;border-radius:20px;border:1px solid var(--line);background:#fff;box-shadow:0 8px 24px rgba(12,19,31,.06)}.wifi-copy{display:grid;grid-template-columns:48px 1fr;gap:12px;align-items:center}.wifi-icon{width:48px;height:48px;border-radius:15px;background:#6759ff;color:#fff;display:grid;place-items:center}.wifi-copy div{display:grid;gap:2px}.wifi-copy small{font-size:10px;color:var(--muted)}.wifi-copy strong{font-size:16px}.wifi-copy p{font-size:10px;color:var(--muted);margin:0}.wifi-actions{display:grid;grid-template-columns:1fr;gap:8px;margin-top:12px}.wifi-action{min-height:43px;border:1px solid var(--line);border-radius:13px;background:#f7f7f8;color:var(--ink);font-weight:800}.wifi-action-primary{background:#6759ff;color:#fff;border-color:#6759ff;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}.wifi-action-primary svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.wifi-connect-note{margin:9px 2px 0;color:var(--muted);font-size:9.5px;line-height:1.45;text-align:center}.bio-footer{padding:28px 18px 34px;text-align:center;color:#8a8d94;font-size:10px}.bio-footer img{width:32px;height:32px;object-fit:contain;display:block;margin:0 auto 7px;opacity:.86}.bio-footer strong{display:block;color:#555961;font-size:11px;letter-spacing:.04em}.bio-footer span{display:block;margin-top:2px}.bio-share{position:absolute;top:18px;right:18px;width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(7,12,20,.34);color:#fff;display:grid;place-items:center;backdrop-filter:blur(14px);font-size:18px;cursor:pointer}.bio-share:before{content:"↗"}.bio-toast{position:fixed;left:50%;bottom:22px;z-index:20;transform:translateX(-50%) translateY(16px);opacity:0;transition:.2s;background:#111;color:#fff;padding:11px 15px;border-radius:999px;font:700 11px system-ui;pointer-events:none;box-shadow:0 10px 30px rgba(0,0,0,.2)}@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@media(max-width:420px){.bio-hero{min-height:356px;padding-inline:18px}.bio-content{padding-inline:13px}.bio-service-grid{grid-template-columns:1fr}.bio-action{min-height:72px}.bio-action-featured{min-height:88px}.wifi-actions{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
</style>
<script src="/assets/js/smart-page.js" defer></script>
</head><body><main class="bio-shell">
<section class="bio-hero">${coverImage}<button class="bio-share" type="button" data-share="${attr(page.business_name)}" aria-label="Compartilhar"></button>${identityImage}<h1>${esc(page.business_name)}</h1>${page.subtitle ? `<p class="bio-subtitle">${esc(page.subtitle)}</p>` : ''}${serviceTags(page.services)}${locationBadge}</section>
${page.bio ? `<section class="bio-about"><p>${esc(page.bio)}</p></section>` : ''}
${ticker(page,wifi)}
<section class="bio-content">
${wifiOnly ? wifiSection(wifi, androidDevice) : `<div class="bio-actions">${digits(page.whatsapp) ? card(slug,'whatsapp','Chamar no WhatsApp','Tire dúvidas e fale com nossa equipe','whatsapp',{featured:true,eyebrow:'Atendimento rápido'}) : ''}${secondaryCards.join('')}</div>${wifiSection(wifi, androidDevice)}${infoCards(page)}${serviceSection(page.services)}`}
</section>
<footer class="bio-footer"><img src="/assets/images/tajo-tap-mark.png" alt="TAJO TAP"><strong>Desenvolvido por TAJO DIGITAL 3F</strong><span>Smart Page · TAJO TAP${plate.code ? ` · ${esc(plate.code)}` : ''}</span><span>Sistema desenvolvido por João Paulo Brandão</span></footer>
</main><div id="smart-toast" class="bio-toast">Copiado</div></body></html>`);
  } catch (error) {
    console.error('[public/smart-page:v10]', { code: publicErrorCode(error), status: error?.status, detail: error?.detail || error?.message });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(503).send('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><link rel="icon" type="image/png" href="/assets/images/favicon-32.png"><title>TAJO TAP</title><body style="font-family:system-ui;background:#07101b;color:#fff;display:grid;place-items:center;min-height:100vh"><main><h1>Smart Page temporariamente indisponível.</h1><p>Tente novamente em instantes.</p></main></body></html>');
  }
}
