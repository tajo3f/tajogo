/* TAJO TAP Frontend V1
 * Frontend-only prototype: data is stored locally for UX validation.
 * Supabase/Auth/RLS/redirect engine will be connected in the backend phase.
 */
(function () {
  'use strict';

  const CONFIG = window.TAJO_TAP_CONFIG || { primaryDomain:'tajodigital.com.br', panelDomain:'painel.tajodigital.com.br', goDomain:'go.tajodigital.com.br', platePath:'/t/' };
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const app = $('#app');
  const modalRoot = $('#modal-root');
  const toastRoot = $('#toast-root');

  const ICONS = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
    plate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="4" width="18" height="16" rx="4"/><path d="M7 8h4v4H7zM14 8h3M14 12h3M7 16h10"/></svg>',
    scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/><path d="M7 12h10"/></svg>',
    clients: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    analytics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.19.36.4.66.6 1 .22.35.36.75.4 1.16V13h-.09A1.7 1.7 0 0 0 19.4 15Z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M10 13a5 5 0 0 0 7.1 0l2.1-2.1a5 5 0 0 0-7.1-7.1L11 4.9"/><path d="M14 11a5 5 0 0 0-7.1 0l-2.1 2.1a5 5 0 0 0 7.1 7.1L13 19.1"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.6A8.5 8.5 0 1 1 20.5 11.5Z"/><path d="M8.4 7.8c.3 2.8 2.1 5 4.8 6.3l1.7-1.5 2 .8"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2l-5-4.9 6.9-1Z"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="4"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',
    wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M5 12.5a10 10 0 0 1 14 0M8 15.5a6 6 0 0 1 8 0M11 18.5a2 2 0 0 1 2 0"/><circle cx="12" cy="21" r="1" fill="currentColor" stroke="none"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>'
  };

  const samplePlaques = [
    { id: 'p1', code: 'TT-7K2P9A', name: 'Balcão principal', client: 'Restaurante Central', clientId: 'c1', status: 'active', destinationType: 'google', destinationLabel: 'Avaliações Google', destination: 'https://search.google.com/local/writereview?placeid=EXEMPLO', scansToday: 18, scansMonth: 438, scansTotal: 1827, qr: 1192, nfc: 635 },
    { id: 'p2', code: 'TT-M8X4QL', name: 'Caixa 01', client: 'Mercado Exemplo', clientId: 'c2', status: 'active', destinationType: 'whatsapp', destinationLabel: 'WhatsApp', destination: 'https://wa.me/5527999999999', scansToday: 11, scansMonth: 291, scansTotal: 912, qr: 612, nfc: 300 },
    { id: 'p3', code: 'TT-P3W7RT', name: 'Recepção', client: 'Studio Aurora', clientId: 'c3', status: 'active', destinationType: 'smart', destinationLabel: 'Smart Page', destination: `https://${CONFIG.goDomain}/p/studio-aurora`, scansToday: 7, scansMonth: 173, scansTotal: 648, qr: 401, nfc: 247 },
    { id: 'p4', code: 'TT-V4N8DK', name: 'Plaquinha nova', client: 'Não vinculado', clientId: null, status: 'unconfigured', destinationType: null, destinationLabel: 'Aguardando configuração', destination: '', scansToday: 0, scansMonth: 0, scansTotal: 0, qr: 0, nfc: 0 },
    { id: 'p5', code: 'TT-A6Q3ZS', name: 'Mesa 04', client: 'Restaurante Central', clientId: 'c1', status: 'paused', destinationType: 'google', destinationLabel: 'Avaliações Google', destination: 'https://search.google.com/local/writereview?placeid=EXEMPLO', scansToday: 0, scansMonth: 94, scansTotal: 307, qr: 198, nfc: 109 }
  ];

  const sampleClients = [
    { id: 'c1', name: 'Restaurante Central', contact: 'Responsável comercial', phone: '(27) 99999-0001', city: 'Afonso Cláudio — ES', plates: 2, scans: 2134, status: 'active' },
    { id: 'c2', name: 'Mercado Exemplo', contact: 'Gerência', phone: '(27) 99999-0002', city: 'Afonso Cláudio — ES', plates: 1, scans: 912, status: 'active' },
    { id: 'c3', name: 'Studio Aurora', contact: 'Atendimento', phone: '(27) 99999-0003', city: 'Venda Nova — ES', plates: 1, scans: 648, status: 'active' }
  ];

  const persisted = safeParse(localStorage.getItem('tajoTapState')) || {};
  const state = {
    role: persisted.role || null,
    theme: persisted.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    plaques: Array.isArray(persisted.plaques) ? persisted.plaques : samplePlaques,
    clients: sampleClients,
    sidebarOpen: false,
    activation: { step: 1, selected: 'google', code: 'TT-V4N8DK' },
    scanner: { stream: null, raf: null, detector: null, running: false }
  };

  function safeParse(value) { try { return JSON.parse(value); } catch { return null; } }
  function saveState() {
    localStorage.setItem('tajoTapState', JSON.stringify({ role: state.role, theme: state.theme, plaques: state.plaques }));
  }
  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.dataset.theme = theme;
    saveState();
  }
  setTheme(state.theme);

  function route() {
    const raw = location.hash.replace(/^#\/?/, '') || (state.role ? 'dashboard' : 'login');
    const parts = raw.split('/').filter(Boolean);
    return { name: parts[0] || 'login', param: decodeURIComponent(parts[1] || '') };
  }

  function go(path) {
    state.sidebarOpen = false;
    stopScanner();
    location.hash = '#/' + path.replace(/^\//, '');
  }

  function esc(v) {
    return String(v ?? '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
  }

  function statusBadge(status) {
    const map = {
      active: ['Ativa', 'success'],
      paused: ['Pausada', 'warning'],
      unconfigured: ['Não configurada', 'muted'],
      archived: ['Arquivada', 'danger']
    };
    const [label, type] = map[status] || ['Status', 'muted'];
    return `<span class="badge badge-${type}">${label}</span>`;
  }

  function formatNumber(n) { return new Intl.NumberFormat('pt-BR').format(n || 0); }

  function toast(title, message = '') {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="dot"></span><div><strong>${esc(title)}</strong>${message ? `<span>${esc(message)}</span>` : ''}</div>`;
    toastRoot.appendChild(el);
    setTimeout(() => el.remove(), 3600);
  }

  function render() {
    const r = route();
    document.body.classList.toggle('is-auth', r.name === 'login');
    if (r.name === 'login') return renderLogin();
    if (r.name === 'activate') return renderActivation(r.param || 'TT-V4N8DK');
    if (r.name === 'portal') return renderPortal();
    if (!state.role) return go('login');
    app.innerHTML = shell(renderPage(r), r.name);
    bindPageEnhancements(r);
  }

  function renderLogin() {
    app.innerHTML = `
      <main class="auth-shell">
        <section class="auth-brand" aria-label="TAJO TAP">
          <img class="auth-brand-logo" src="assets/images/tajo-tap-logo.png" alt="TAJO TAP">
          <div class="auth-copy">
            <div class="auth-kicker">Plaquinhas inteligentes</div>
            <h1>Um toque. Um destino. Controle total.</h1>
            <p>Gerencie QR Codes e NFC dinâmicos, altere destinos sem reimprimir a placa e acompanhe cada acesso em uma experiência criada para a TAJO.</p>
            <div class="auth-proof"><span>QR dinâmico</span><span>NFC</span><span>Analytics</span><span>Smart Page</span></div>
          </div>
          <small style="position:relative;z-index:1;color:#68716a">TAJO Digital 3F · Frontend V1</small>
        </section>
        <section class="auth-panel">
          <div class="auth-card">
            <img class="auth-mobile-logo" src="assets/images/tajo-tap-logo.png" alt="TAJO TAP">
            <div class="eyebrow">Acesso seguro</div>
            <h2>Bem-vindo ao TAJO TAP</h2>
            <p>Entre para gerenciar plaquinhas, clientes e direcionamentos.</p>
            <form id="login-form" class="stack" novalidate>
              <div class="field"><label for="email">E-mail</label><input class="input" id="email" type="email" autocomplete="email" value="admin@tajodigital.com.br" required></div>
              <div class="field"><label for="password">Senha</label><input class="input" id="password" type="password" autocomplete="current-password" value="demonstracao" minlength="8" required></div>
              <button class="btn btn-primary" type="submit">Entrar no painel ${ICONS.arrow}</button>
            </form>
            <div class="auth-separator">demonstração do frontend</div>
            <div class="auth-actions">
              <button class="btn btn-ghost" type="button" data-action="demo-admin">Abrir como administrador</button>
              <button class="btn btn-ghost" type="button" data-action="demo-client">Visualizar área do cliente</button>
            </div>
            <div class="demo-note">Nesta primeira etapa os dados são demonstrativos e ficam no navegador. A autenticação real e o banco serão conectados ao Supabase na etapa de backend.</div>
          </div>
        </section>
      </main>`;
  }

  function shell(content, active) {
    const nav = [
      ['dashboard','dashboard','Visão geral'],
      ['plaques','plate','Plaquinhas'],
      ['scanner','scan','Escanear'],
      ['clients','clients','Clientes'],
      ['analytics','analytics','Analytics'],
      ['settings','settings','Configurações']
    ];
    const navHtml = nav.map(([path, icon, label]) => `<a class="nav-item ${active === path || (active === 'plaque' && path === 'plaques') ? 'active':''}" href="#/${path}">${ICONS[icon]}<span>${label}</span></a>`).join('');
    return `
      <div class="app-shell">
        <aside class="sidebar ${state.sidebarOpen ? 'open':''}" id="sidebar">
          <div class="sidebar-logo"><img src="assets/images/tajo-tap-logo.png" alt="TAJO TAP"></div>
          <div class="sidebar-context"><img class="context-mark" src="assets/images/tajo-tap-mark.png" alt=""><div class="context-copy"><strong>TAJO TAP</strong><span>Administração</span></div>${ICONS.chevron}</div>
          <nav class="nav-group" aria-label="Navegação principal"><div class="nav-label">Operação</div>${navHtml}</nav>
          <div class="sidebar-spacer"></div>
          <div class="sidebar-help"><strong>Precisa localizar uma placa?</strong><p>Abra a câmera e escaneie o QR Code físico.</p><button class="btn btn-soft btn-sm" data-action="open-scanner">${ICONS.scan} Escanear agora</button></div>
          <div class="sidebar-user"><div class="avatar">JP</div><div class="meta"><strong>João Paulo</strong><span>Administrador</span></div><button class="btn btn-icon btn-sm btn-ghost" data-action="logout" aria-label="Sair">${ICONS.logout}</button></div>
        </aside>
        <div class="drawer-backdrop ${state.sidebarOpen ? 'show':''}" data-action="close-sidebar"></div>
        <div class="app-main">
          <header class="topbar">
            <button class="btn btn-icon btn-ghost mobile-menu-btn" data-action="toggle-sidebar" aria-label="Abrir menu">${ICONS.menu}</button>
            <a class="mobile-brand" href="#/dashboard"><img src="assets/images/tajo-tap-logo.png" alt="TAJO TAP"></a>
            <div class="topbar-title"><strong>Central TAJO TAP</strong><span>Controle seus pontos de contato</span></div>
            <div class="topbar-search input-with-icon">${ICONS.search}<input class="input" id="global-search" placeholder="Buscar placa, cliente ou código" aria-label="Busca global"></div>
            <div class="topbar-actions">
              <button class="btn btn-ghost" data-action="open-scanner">${ICONS.scan}<span class="scan-label">Escanear</span></button>
              <button class="btn btn-icon btn-ghost" data-action="theme" aria-label="Alternar tema">${state.theme === 'dark' ? ICONS.sun : ICONS.moon}</button>
              <button class="btn btn-icon btn-ghost" data-action="notifications" aria-label="Notificações">${ICONS.bell}</button>
            </div>
          </header>
          <main class="content">${content}</main>
        </div>
        <nav class="mobile-bottom-nav" aria-label="Navegação móvel">
          <a class="${active==='dashboard'?'active':''}" href="#/dashboard">${ICONS.dashboard}<span>Início</span></a>
          <a class="${active==='plaques'||active==='plaque'?'active':''}" href="#/plaques">${ICONS.plate}<span>Placas</span></a>
          <a class="scan-main" href="#/scanner">${ICONS.scan}<span>Scan</span></a>
          <a class="${active==='clients'?'active':''}" href="#/clients">${ICONS.clients}<span>Clientes</span></a>
          <a class="${active==='analytics'?'active':''}" href="#/analytics">${ICONS.analytics}<span>Dados</span></a>
        </nav>
      </div>`;
  }

  function renderPage(r) {
    if (r.name === 'dashboard') return dashboardPage();
    if (r.name === 'plaques') return plaquesPage();
    if (r.name === 'plaque') return plaqueDetail(r.param);
    if (r.name === 'scanner') return scannerPage();
    if (r.name === 'clients') return clientsPage();
    if (r.name === 'analytics') return analyticsPage();
    if (r.name === 'settings') return settingsPage();
    return notFoundPage();
  }

  function pageHead(eyebrow, title, text, actions='') {
    return `<div class="page-head"><div class="page-head-copy"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${text}</p></div>${actions ? `<div class="page-actions">${actions}</div>`:''}</div>`;
  }

  function dashboardPage() {
    const active = state.plaques.filter(p=>p.status==='active').length;
    const month = state.plaques.reduce((s,p)=>s+p.scansMonth,0);
    const total = state.plaques.reduce((s,p)=>s+p.scansTotal,0);
    return `
      ${pageHead('Painel administrativo','Controle que vira resultado.','Acompanhe as plaquinhas, encontre pontos que precisam de atenção e altere destinos sem tocar na peça física.', `<button class="btn btn-ghost" data-action="open-scanner">${ICONS.scan} Escanear placa</button><button class="btn btn-primary" data-action="new-plaque">${ICONS.plus} Nova plaquinha</button>`)}
      <section class="metric-grid" aria-label="Indicadores principais">
        ${metric('Plaquinhas ativas',active,'+2 neste mês','plate')}
        ${metric('Acessos no mês',formatNumber(month),'+18% vs. período anterior','analytics')}
        ${metric('Clientes ativos',state.clients.length,'Operação demonstrativa','clients')}
        ${metric('Acessos acumulados',formatNumber(total),'QR + NFC','scan')}
      </section>
      <section class="dashboard-grid">
        <div class="card card-pad">
          <div class="card-title"><div><h2>Ações rápidas</h2><p>O que você precisa fazer agora?</p></div></div>
          <div class="quick-actions">
            ${quick('Criar plaquinha','Gere um código único e prepare a peça para produção.','plate','new-plaque')}
            ${quick('Escanear uma placa','Use a câmera para localizar e gerenciar uma unidade.','scan','open-scanner')}
            ${quick('Alterar destino','Encontre uma placa e troque o direcionamento em segundos.','link','go-plaques')}
            ${quick('Ver desempenho','Entenda QR x NFC e os pontos com mais acessos.','analytics','go-analytics')}
          </div>
        </div>
        <div class="card card-pad">
          <div class="card-title"><div><h2>Atividade recente</h2><p>Últimas alterações da operação.</p></div><span class="chip">Agora</span></div>
          <div class="activity-list">
            ${activity('Destino alterado','TT-7K2P9A · Google Reviews','link','há 8 min')}
            ${activity('Nova plaquinha','TT-V4N8DK · aguardando configuração','plate','há 1 h')}
            ${activity('Pico de acessos','Restaurante Central · +31% hoje','analytics','há 3 h')}
            ${activity('Cliente cadastrado','Studio Aurora','clients','ontem')}
          </div>
        </div>
      </section>`;
  }

  function metric(label, value, trend, icon) {
    return `<article class="card metric"><div class="metric-icon">${ICONS[icon]}</div><div><span class="metric-value">${value}</span><span class="metric-label">${label}</span></div><span class="metric-trend text-success">${trend}</span></article>`;
  }
  function quick(title, text, icon, action) { return `<button class="quick-card" data-action="${action}" type="button"><span class="icon-box">${ICONS[icon]}</span><strong>${title}</strong><span>${text}</span></button>`; }
  function activity(title,text,icon,time) { return `<div class="activity"><div class="activity-icon">${ICONS[icon]}</div><div><strong>${title}</strong><span>${text}</span></div><time>${time}</time></div>`; }

  function plaquesPage() {
    const rows = state.plaques.map(p => `<tr data-route="plaque/${esc(p.code)}"><td><div class="entity"><div class="entity-icon">${ICONS.plate}</div><div class="entity-copy"><strong>${esc(p.name)}</strong><span class="mono">${esc(p.code)}</span></div></div></td><td>${esc(p.client)}</td><td>${esc(p.destinationLabel)}</td><td>${formatNumber(p.scansMonth)}</td><td>${statusBadge(p.status)}</td><td><button class="btn btn-sm btn-ghost" data-route="plaque/${esc(p.code)}">Gerenciar ${ICONS.chevron}</button></td></tr>`).join('');
    const cards = state.plaques.map(p => `<article class="card mobile-card"><div class="mobile-card-head"><div class="entity"><div class="entity-icon">${ICONS.plate}</div><div class="entity-copy"><strong>${esc(p.name)}</strong><span class="mono">${esc(p.code)}</span></div></div>${statusBadge(p.status)}</div><div class="mobile-card-meta"><div><span>Cliente</span><strong>${esc(p.client)}</strong></div><div><span>Acessos / mês</span><strong>${formatNumber(p.scansMonth)}</strong></div><div><span>Destino</span><strong>${esc(p.destinationLabel)}</strong></div><div><span>Total</span><strong>${formatNumber(p.scansTotal)}</strong></div></div><button class="btn btn-ghost" style="width:100%" data-route="plaque/${esc(p.code)}">Gerenciar plaquinha ${ICONS.arrow}</button></article>`).join('');
    return `
      ${pageHead('Operação','Plaquinhas','Crie, filtre e gerencie todos os pontos QR/NFC da TAJO TAP.', `<button class="btn btn-ghost" data-action="open-scanner">${ICONS.scan} Escanear</button><button class="btn btn-primary" data-action="new-plaque">${ICONS.plus} Nova plaquinha</button>`)}
      <div class="toolbar"><div class="grow input-with-icon">${ICONS.search}<input id="plaque-search" class="input" placeholder="Buscar por nome, cliente ou código"></div><select id="plaque-filter" class="select" style="width:auto"><option value="all">Todos os status</option><option value="active">Ativas</option><option value="unconfigured">Não configuradas</option><option value="paused">Pausadas</option></select></div>
      <div class="table-wrap"><table><thead><tr><th>Plaquinha</th><th>Cliente</th><th>Destino</th><th>Acessos mês</th><th>Status</th><th></th></tr></thead><tbody id="plaque-tbody">${rows}</tbody></table></div>
      <div class="mobile-list" id="plaque-mobile-list">${cards}</div>`;
  }

  function plaqueDetail(code) {
    const p = state.plaques.find(x=>x.code===code) || state.plaques[0];
    const url = `https://${CONFIG.goDomain}${CONFIG.platePath}${p.code}`;
    return `
      ${pageHead('Plaquinha','Gerenciar '+esc(p.code),esc(p.name)+' · '+esc(p.client), `<button class="btn btn-ghost" data-action="copy" data-copy="${esc(url)}">${ICONS.copy} Copiar link</button><button class="btn btn-primary" data-action="edit-destination" data-code="${esc(p.code)}">${ICONS.edit} Alterar destino</button>`)}
      <div class="detail-grid">
        <div class="stack">
          <section class="card plaque-hero"><div class="row-between"><span class="badge ${p.status==='active'?'badge-success':'badge-warning'}">${p.status==='active'?'ATIVA':'STATUS: '+esc(p.status.toUpperCase())}</span><img src="assets/images/tajo-tap-mark.png" alt="" style="width:54px;background:#fff;border-radius:13px;padding:5px"></div><div><div class="plaque-code">${esc(p.code)}</div><div class="plaque-link">${esc(url)}</div></div></section>
          <section class="card card-pad"><div class="card-title"><div><h2>Destino atual</h2><p>O QR e o NFC permanecem iguais. Só o destino muda.</p></div>${statusBadge(p.status)}</div><div class="destination-option active"><div class="destination-icon">${destinationIcon(p.destinationType)}</div><div class="destination-copy"><strong>${esc(p.destinationLabel)}</strong><span>${p.destination ? esc(p.destination) : 'O cliente ainda precisa escolher um destino.'}</span></div></div><div class="row wrap" style="margin-top:16px"><button class="btn btn-primary" data-action="edit-destination" data-code="${esc(p.code)}">${ICONS.edit} Alterar destino</button><button class="btn btn-ghost" data-action="toggle-plate" data-code="${esc(p.code)}">${p.status==='paused'?'Ativar plaquinha':'Pausar plaquinha'}</button></div></section>
          <section class="metric-grid" style="grid-template-columns:repeat(3,minmax(0,1fr))">${metric('Hoje',formatNumber(p.scansToday),'Acessos','scan')}${metric('Este mês',formatNumber(p.scansMonth),'Acessos','analytics')}${metric('Total',formatNumber(p.scansTotal),'Desde ativação','dashboard')}</section>
        </div>
        <div class="stack">
          <section class="card card-pad"><div class="card-title"><div><h2>QR da plaquinha</h2><p>Mesmo código físico, destino editável.</p></div></div><div class="qr-frame"><canvas class="qr-canvas" data-qr="${esc(url)}" width="512" height="512"></canvas></div><div class="qr-caption mono">${esc(url)}</div><div class="row wrap" style="justify-content:center;margin-top:16px"><button class="btn btn-ghost" data-action="download-qr" data-code="${esc(p.code)}">${ICONS.download} Baixar PNG</button><button class="btn btn-ghost" data-action="copy" data-copy="${esc(url)}">${ICONS.copy} Link NFC</button></div></section>
          <section class="card card-pad"><div class="card-title"><div><h3>Origem dos acessos</h3><p>Separação pronta para QR e NFC.</p></div></div>${breakdown('QR Code',p.qr,p.scansTotal)}${breakdown('NFC / aproximação',p.nfc,p.scansTotal)}</section>
        </div>
      </div>`;
  }

  function destinationIcon(type) {
    return ({ google:ICONS.star, whatsapp:ICONS.whatsapp, instagram:ICONS.instagram, smart:ICONS.globe, map:ICONS.map, custom:ICONS.link }[type] || ICONS.link);
  }
  function breakdown(label,value,total) { const pct = total ? Math.round(value/total*100) : 0; return `<div class="breakdown-row" style="margin-bottom:14px"><div class="breakdown-head"><span>${label}</span><strong>${pct}%</strong></div><div class="progress"><span style="width:${pct}%"></span></div><small class="text-muted">${formatNumber(value)} acessos</small></div>`; }

  function scannerPage() {
    return `
      ${pageHead('Scanner','Localize qualquer plaquinha.','Abra a câmera, aponte para o QR Code e o sistema encontra a unidade para você.', `<button class="btn btn-primary" data-action="open-scanner">${ICONS.camera} Abrir câmera</button>`)}
      <section class="scanner-launch"><div><div class="eyebrow" style="color:var(--brand)">Scan inteligente</div><h2>Escaneie. Identifique. Gerencie.</h2><p>Ideal para suporte, instalação e manutenção em campo. O leitor reconhece links do padrão <span class="mono">${esc(CONFIG.goDomain + CONFIG.platePath + "CODIGO")}</span> e abre a plaquinha encontrada.</p><div class="row wrap" style="margin-top:22px"><button class="btn btn-primary" data-action="open-scanner">${ICONS.camera} Usar câmera</button><button class="btn btn-ghost" style="border-color:#334037;color:#fff" data-action="simulate-scan">Testar com placa demo</button></div></div><div class="scanner-visual"><img src="assets/images/tajo-tap-mark.png" alt=""></div></section>
      <div class="card card-pad" style="margin-top:18px"><div class="card-title"><div><h2>Também dá para buscar manualmente</h2><p>Útil quando a câmera estiver indisponível ou o código estiver impresso no verso.</p></div></div><form id="manual-scan-form" class="row wrap"><input class="input" style="flex:1;min-width:220px" name="code" placeholder="Ex.: TT-7K2P9A" autocomplete="off"><button class="btn btn-dark">Localizar ${ICONS.arrow}</button></form></div>`;
  }

  function clientsPage() {
    const rows = state.clients.map(c=>`<tr><td><div class="entity"><div class="entity-icon">${esc(c.name[0])}</div><div class="entity-copy"><strong>${esc(c.name)}</strong><span>${esc(c.city)}</span></div></div></td><td>${esc(c.contact)}</td><td>${esc(c.phone)}</td><td>${c.plates}</td><td>${formatNumber(c.scans)}</td><td><span class="badge badge-success">Ativo</span></td></tr>`).join('');
    const cards = state.clients.map(c=>`<article class="card mobile-card"><div class="mobile-card-head"><div class="entity"><div class="entity-icon">${esc(c.name[0])}</div><div class="entity-copy"><strong>${esc(c.name)}</strong><span>${esc(c.city)}</span></div></div><span class="badge badge-success">Ativo</span></div><div class="mobile-card-meta"><div><span>Plaquinhas</span><strong>${c.plates}</strong></div><div><span>Acessos</span><strong>${formatNumber(c.scans)}</strong></div></div><button class="btn btn-ghost" style="width:100%">Ver cliente ${ICONS.arrow}</button></article>`).join('');
    return `${pageHead('Relacionamento','Clientes','Centralize quem possui plaquinhas e acompanhe o uso por estabelecimento.', `<button class="btn btn-primary" data-action="new-client">${ICONS.plus} Novo cliente</button>`)}<div class="toolbar"><div class="grow input-with-icon">${ICONS.search}<input class="input" placeholder="Buscar cliente"></div></div><div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Contato</th><th>Telefone</th><th>Placas</th><th>Acessos</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div><div class="mobile-list">${cards}</div>`;
  }

  function analyticsPage() {
    return `
      ${pageHead('Mensuração','Analytics','Veja como QR e NFC estão sendo usados sem transformar o painel em um monte de gráficos sem decisão.', `<button class="btn btn-ghost">Últimos 30 dias</button>`)}
      <section class="metric-grid">${metric('Acessos',formatNumber(996),'+18%','analytics')}${metric('QR Code','67%','667 acessos','scan')}${metric('NFC','33%','329 acessos','wifi')}${metric('Melhor horário','12h–13h','Pico de uso','dashboard')}</section>
      <section class="analytics-grid" style="margin-top:18px">
        <div class="card card-pad"><div class="card-title"><div><h2>Acessos nos últimos 14 dias</h2><p>Tendência geral da operação.</p></div><span class="chip">Atualizado agora</span></div>${analyticsChart()}</div>
        <div class="card card-pad"><div class="card-title"><div><h2>Distribuição</h2><p>De onde os acessos vieram.</p></div></div><div class="breakdown">${breakdown('QR Code',667,996)}${breakdown('NFC',329,996)}${breakdown('Google Reviews',542,996)}${breakdown('WhatsApp',287,996)}</div></div>
      </section>`;
  }

  function analyticsChart() {
    const vals=[38,52,43,61,58,71,68,82,76,91,84,99,107,121];
    const w=780,h=300,p=28,max=Math.max(...vals),min=Math.min(...vals);
    const pts=vals.map((v,i)=>{const x=p+i*((w-p*2)/(vals.length-1)); const y=h-p-((v-min)/(max-min||1))*(h-p*2); return [x,y];});
    const path=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
    const area=path+` L ${pts[pts.length-1][0]} ${h-p} L ${pts[0][0]} ${h-p} Z`;
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Gráfico de acessos crescendo nos últimos 14 dias"><defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#54d90d" stop-opacity=".24"/><stop offset="1" stop-color="#54d90d" stop-opacity="0"/></linearGradient></defs>${[.2,.4,.6,.8].map(n=>`<line class="chart-grid-line" x1="${p}" x2="${w-p}" y1="${h*n}" y2="${h*n}"/>`).join('')}<path class="chart-area" d="${area}"/><path class="chart-line" d="${path}"/>${pts.map(([x,y])=>`<circle class="chart-dot" cx="${x}" cy="${y}" r="4"/>`).join('')}</svg>`;
  }

  function settingsPage() {
    return `${pageHead('Sistema','Configurações','Preferências visuais e parâmetros que serão conectados ao backend.', '')}
      <div class="detail-grid">
        <section class="card card-pad"><div class="card-title"><div><h2>Identidade</h2><p>A marca oficial já está aplicada em todo o sistema.</p></div></div><div class="row" style="padding:20px;background:#fff;border-radius:16px;border:1px solid #e5e8e4"><img src="assets/images/tajo-tap-logo.png" style="width:min(260px,80%)" alt="TAJO TAP"></div><div class="form-grid" style="margin-top:18px"><div class="field"><label>Domínio principal</label><input class="input" value="${esc(CONFIG.primaryDomain)}"></div><div class="field"><label>Motor das plaquinhas</label><input class="input" value="${esc(CONFIG.goDomain)}"></div></div></section>
        <section class="card card-pad"><div class="card-title"><div><h2>Experiência</h2><p>Preferências locais do frontend.</p></div></div><div class="destination-option"><div class="destination-icon">${state.theme==='dark'?ICONS.moon:ICONS.sun}</div><div class="destination-copy" style="flex:1"><strong>Tema ${state.theme==='dark'?'escuro':'claro'}</strong><span>Você pode alternar a qualquer momento.</span></div><button class="btn btn-sm btn-ghost" data-action="theme">Alternar</button></div><div class="destination-option" style="margin-top:12px"><div class="destination-icon">${ICONS.lock}</div><div class="destination-copy"><strong>Backend ainda não conectado</strong><span>Supabase Auth, RLS, banco e redirect engine entram na próxima etapa.</span></div></div></section>
      </div>`;
  }

  function notFoundPage() { return `${pageHead('Erro 404','Página não encontrada.','O endereço solicitado não existe neste frontend.', `<button class="btn btn-primary" data-route="dashboard">Voltar ao painel</button>`)}`; }

  function renderPortal() {
    const owned = state.plaques.filter(p=>p.clientId==='c1');
    app.innerHTML = `
      <div class="activate-shell" style="display:block;padding:0;background:var(--bg);color:var(--ink)">
        <header class="topbar" style="position:sticky"><a href="#/portal"><img src="assets/images/tajo-tap-logo.png" style="width:140px;background:#fff;border-radius:11px;padding:6px 8px" alt="TAJO TAP"></a><div style="margin-left:auto" class="row"><button class="btn btn-ghost" data-action="theme">${state.theme==='dark'?ICONS.sun:ICONS.moon}</button><button class="btn btn-dark" data-action="portal-exit">Sair</button></div></header>
        <main class="content">
          ${pageHead('Área do cliente','Minhas plaquinhas','Gerencie para onde seus clientes serão direcionados. O QR e o NFC físicos não precisam ser trocados.', '')}
          <div class="portal-grid">${owned.map(p=>`<article class="card portal-plaque"><div class="row-between"><div class="entity"><div class="entity-icon">${ICONS.plate}</div><div class="entity-copy"><strong>${esc(p.name)}</strong><span class="mono">${esc(p.code)}</span></div></div>${statusBadge(p.status)}</div><div class="destination-option active" style="margin-top:18px"><div class="destination-icon">${destinationIcon(p.destinationType)}</div><div class="destination-copy"><strong>${esc(p.destinationLabel)}</strong><span>Destino atual</span></div></div><div class="row wrap" style="margin-top:18px"><button class="btn btn-primary" data-action="edit-destination" data-code="${esc(p.code)}">Alterar destino</button><span class="chip">${formatNumber(p.scansMonth)} acessos/mês</span></div></article>`).join('')}</div>
        </main>
      </div>`;
    bindPageEnhancements({name:'portal'});
  }

  function renderActivation(code) {
    const p = state.plaques.find(x=>x.code===code) || state.plaques.find(x=>x.status==='unconfigured') || state.plaques[0];
    state.activation.code = p.code;
    const step=state.activation.step;
    app.innerHTML = `<main class="activate-shell"><section class="activate-card"><header class="activate-head"><img class="activate-logo" src="assets/images/tajo-tap-logo.png" alt="TAJO TAP"><span class="badge badge-${p.status==='unconfigured'?'warning':'success'}">${p.status==='unconfigured'?'CONFIGURAÇÃO':'ATIVA'}</span></header><div class="activate-body"><div class="eyebrow" style="color:var(--brand)">Plaquinha ${esc(p.code)}</div>${activationStep(p,step)}</div></section></main>`;
  }

  function activationStep(p,step) {
    if(step===1) return `<h1>Configure sua plaquinha.</h1><p>Escolha o que deve acontecer quando alguém escanear o QR Code ou aproximar o celular.</p><div class="steps"><span class="step active"></span><span class="step"></span><span class="step"></span></div><div class="choice-grid">${destinationChoices()}</div><button class="btn btn-primary" style="width:100%" data-action="activation-next">Continuar ${ICONS.arrow}</button>`;
    if(step===2) return `<h1>Agora, informe o destino.</h1><p>Vamos usar esta informação para redirecionar os acessos da sua plaquinha.</p><div class="steps"><span class="step active"></span><span class="step active"></span><span class="step"></span></div>${destinationField(state.activation.selected)}<div class="row" style="margin-top:22px"><button class="btn btn-ghost" data-action="activation-back">Voltar</button><button class="btn btn-primary" style="flex:1" data-action="activation-next">Revisar configuração ${ICONS.arrow}</button></div>`;
    return `<div style="width:68px;height:68px;border-radius:22px;background:var(--brand);display:grid;place-items:center;color:#111">${ICONS.check}</div><h1>Pronto para ativar.</h1><p>Depois de concluir, a mesma plaquinha poderá ter o destino alterado pelo painel do cliente sem reimpressão.</p><div class="steps"><span class="step active"></span><span class="step active"></span><span class="step active"></span></div><div class="destination-option active" style="background:#172216;border-color:#335631"><div class="destination-icon">${destinationIcon(state.activation.selected)}</div><div class="destination-copy"><strong>${destinationName(state.activation.selected)}</strong><span>Plaquinha ${esc(p.code)}</span></div></div><button class="btn btn-primary" style="width:100%;margin-top:22px" data-action="activation-complete">Concluir e ativar</button>`;
  }

  function destinationChoices() {
    const items=[['google','Avaliações Google','Leve o cliente direto para avaliar.'],['whatsapp','WhatsApp','Abra uma conversa pronta.'],['instagram','Instagram','Direcione para o perfil da empresa.'],['smart','Smart Page','Uma página com vários botões.'],['map','Localização','Abra a rota no mapa.'],['custom','Outro link','Use qualquer endereço HTTPS.']];
    return items.map(([id,name,desc])=>`<button class="choice ${state.activation.selected===id?'active':''}" data-action="activation-choice" data-choice="${id}">${destinationIcon(id)}<strong>${name}</strong><span>${desc}</span></button>`).join('');
  }
  function destinationField(type) {
    if(type==='whatsapp') return `<div class="stack"><div class="field"><label>WhatsApp</label><input id="activation-value" class="input" inputmode="tel" placeholder="(27) 99999-9999"></div><div class="field"><label>Mensagem inicial <span class="text-muted">(opcional)</span></label><textarea class="textarea" placeholder="Olá! Vim pela plaquinha..."></textarea></div></div>`;
    if(type==='google') return `<div class="field"><label>Link de avaliação do Google</label><input id="activation-value" class="input" type="url" placeholder="https://g.page/r/.../review"><span class="field-help">Na etapa de backend poderemos oferecer um assistente para montar o link correto.</span></div>`;
    return `<div class="field"><label>${destinationName(type)}</label><input id="activation-value" class="input" type="url" placeholder="https://"><span class="field-help">Informe um endereço HTTPS válido.</span></div>`;
  }
  function destinationName(type) { return ({google:'Avaliações Google',whatsapp:'WhatsApp',instagram:'Instagram',smart:'Smart Page',map:'Localização',custom:'Link personalizado'}[type]||'Destino'); }

  function newPlaqueModal() {
    const generated = generateCode();
    const url=`https://${CONFIG.goDomain}${CONFIG.platePath}${generated}`;
    showModal(`
      <div class="modal-head"><div><div class="eyebrow">Produção</div><h2>Nova plaquinha</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal" aria-label="Fechar">${ICONS.close}</button></div>
      <form id="new-plaque-form"><div class="modal-body stack"><div class="form-grid"><div class="field"><label>Nome interno</label><input class="input" name="name" placeholder="Ex.: Balcão principal" required></div><div class="field"><label>Cliente</label><select class="select" name="client"><option value="">Ainda não vinculado</option>${state.clients.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div></div><div class="form-grid"><div class="field"><label>Código gerado</label><input class="input mono" name="code" value="${generated}" readonly></div><div class="field"><label>Link físico</label><input class="input mono" value="${url}" readonly></div></div><div class="card card-pad" style="box-shadow:none;background:var(--surface-2)"><div class="row-between mobile-stack"><div><strong>QR padronizado TAJO TAP</strong><div class="text-muted" style="font-size:.8rem">Este é o link que também pode ser gravado na tag NFC.</div></div><div class="qr-frame" style="width:180px;margin:0"><canvas class="qr-canvas" data-qr="${url}" width="360" height="360"></canvas></div></div></div></div><div class="modal-footer"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-primary" type="submit">Criar plaquinha ${ICONS.arrow}</button></div></form>`, true);
    renderQRCodes();
  }

  function editDestinationModal(code) {
    const p=state.plaques.find(x=>x.code===code); if(!p) return;
    const current=p.destinationType||'google';
    showModal(`<div class="modal-head"><div><div class="eyebrow">${esc(code)}</div><h2>Alterar destino</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><form id="destination-form" data-code="${esc(code)}"><div class="modal-body"><p class="text-muted" style="margin-top:0">O QR Code e o NFC da plaquinha permanecem os mesmos.</p><div class="choice-grid" id="destination-choice-grid">${[['google','Avaliações Google'],['whatsapp','WhatsApp'],['instagram','Instagram'],['smart','Smart Page'],['map','Localização'],['custom','Outro link']].map(([id,n])=>`<button type="button" class="choice destination-modal-choice ${current===id?'active':''}" data-type="${id}">${destinationIcon(id)}<strong>${n}</strong><span>${id==='smart'?'Página inteligente TAJO':'Redirecionamento dinâmico'}</span></button>`).join('')}</div><input type="hidden" name="type" value="${current}"><div class="field"><label>Destino / configuração</label><input class="input" name="destination" value="${esc(p.destination)}" placeholder="https://..." required><span class="field-help">Frontend demonstrativo: a validação específica por tipo será implementada junto do backend.</span></div></div><div class="modal-footer"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-primary">Salvar alteração</button></div></form>`);
  }

  function newClientModal() {
    showModal(`<div class="modal-head"><div><div class="eyebrow">Clientes</div><h2>Novo cliente</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><form id="new-client-form"><div class="modal-body stack"><div class="field"><label>Empresa</label><input class="input" name="name" required placeholder="Nome do estabelecimento"></div><div class="form-grid"><div class="field"><label>Responsável</label><input class="input" name="contact" required></div><div class="field"><label>WhatsApp</label><input class="input" name="phone" inputmode="tel" required></div></div><div class="field"><label>Cidade / Estado</label><input class="input" name="city" required></div></div><div class="modal-footer"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-primary">Cadastrar cliente</button></div></form>`);
  }

  function showModal(html, large=false) {
    modalRoot.innerHTML=`<div class="modal-backdrop" data-action="modal-backdrop"><div class="modal ${large?'modal-lg':''}" role="dialog" aria-modal="true">${html}</div></div>`;
    const close=$('[data-action="close-modal"]',modalRoot); if(close) close.focus();
  }
  function closeModal(){ stopScanner(); modalRoot.innerHTML=''; }

  async function openScannerModal() {
    showModal(`<div class="modal-head"><div><div class="eyebrow">Scanner</div><h2>Escanear plaquinha</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><div class="modal-body"><div class="scanner-camera"><video id="scanner-video" playsinline muted></video><div class="scan-overlay"><div class="scan-box"><i></i><i></i><i></i><i></i><span class="scan-line"></span></div></div></div><div class="scanner-state" id="scanner-state">Preparando a câmera…</div><div class="scanner-fallback"><input class="input mono" id="scanner-manual" placeholder="Ou digite o código: TT-7K2P9A"><button class="btn btn-ghost" data-action="scanner-manual-go">Localizar</button></div><div class="field" style="margin-top:12px"><label class="btn btn-ghost" for="qr-image-input" style="width:100%">${ICONS.scan} Ler QR de uma imagem<input class="sr-only" id="qr-image-input" type="file" accept="image/*" capture="environment"></label></div></div>`);
    await startScanner();
  }

  async function startScanner() {
    const video=$('#scanner-video'); const msg=$('#scanner-state');
    if(!video || !msg) return;
    if(!navigator.mediaDevices?.getUserMedia){ msg.textContent='Este navegador não disponibiliza acesso direto à câmera. Use o código manual ou selecione uma imagem.'; return; }
    try {
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});
      state.scanner.stream=stream; state.scanner.running=true; video.srcObject=stream; await video.play();
      if('BarcodeDetector' in window){
        const formats=await BarcodeDetector.getSupportedFormats();
        if(formats.includes('qr_code')){
          state.scanner.detector=new BarcodeDetector({formats:['qr_code']});
          msg.textContent='Câmera ativa. Aponte para o QR Code da plaquinha.';
          scanLoop(video); return;
        }
      }
      msg.textContent='Câmera aberta, mas este navegador não possui decodificação QR nativa. Use “Ler QR de uma imagem” ou informe o código abaixo.';
    } catch(err) {
      msg.textContent = err && err.name === 'NotAllowedError' ? 'Permissão da câmera negada. Libere a câmera nas configurações do navegador ou use a busca manual.' : 'Não foi possível iniciar a câmera. Use o código manual como alternativa.';
    }
  }

  async function scanLoop(video) {
    if(!state.scanner.running || !state.scanner.detector) return;
    try {
      if(video.readyState>=2){
        const codes=await state.scanner.detector.detect(video);
        if(codes.length){ handleScannedValue(codes[0].rawValue); return; }
      }
    } catch(_e) { /* transient frame errors are ignored */ }
    state.scanner.raf=requestAnimationFrame(()=>scanLoop(video));
  }

  function stopScanner() {
    state.scanner.running=false;
    if(state.scanner.raf) cancelAnimationFrame(state.scanner.raf);
    state.scanner.raf=null;
    if(state.scanner.stream){ state.scanner.stream.getTracks().forEach(t=>t.stop()); state.scanner.stream=null; }
    state.scanner.detector=null;
  }

  async function scanImage(file) {
    const msg=$('#scanner-state');
    if(!file || !msg) return;
    if(!('BarcodeDetector' in window)){ msg.textContent='Leitura por imagem não está disponível neste navegador. Digite o código da plaquinha.'; return; }
    try {
      const formats=await BarcodeDetector.getSupportedFormats();
      if(!formats.includes('qr_code')) throw new Error('qr-not-supported');
      const bmp=await createImageBitmap(file);
      const detector=new BarcodeDetector({formats:['qr_code']});
      const codes=await detector.detect(bmp); bmp.close?.();
      if(codes.length) handleScannedValue(codes[0].rawValue); else msg.textContent='Nenhum QR Code foi encontrado nessa imagem.';
    } catch(_e) { msg.textContent='Não foi possível ler esse arquivo. Tente outra imagem ou use o código manual.'; }
  }

  function extractPlateCode(value) {
    const clean=String(value||'').trim().toUpperCase();
    const m=clean.match(/TT-[A-Z0-9]{6,12}/); if(m) return m[0];
    const urlMatch=String(value||'').match(/\/t\/([A-Za-z0-9-]+)/i); return urlMatch ? urlMatch[1].toUpperCase() : clean;
  }

  function handleScannedValue(value) {
    const code=extractPlateCode(value); const p=state.plaques.find(x=>x.code===code);
    stopScanner(); closeModal();
    if(p){ toast('Plaquinha encontrada',code); go('plaque/'+code); }
    else { toast('Código lido',code+' ainda não está cadastrado nesta demonstração.'); }
  }

  function bindPageEnhancements(r) {
    renderQRCodes();
    if(r.name==='plaques') {
      const input=$('#plaque-search'), filter=$('#plaque-filter');
      const update=()=>filterPlaques(input?.value||'',filter?.value||'all');
      input?.addEventListener('input',update); filter?.addEventListener('change',update);
    }
  }

  function filterPlaques(term,status) {
    const q=term.toLowerCase().trim();
    $$('#plaque-tbody tr').forEach(row=>{ const code=row.textContent.toLowerCase(); const p=state.plaques.find(x=>code.includes(x.code.toLowerCase())); row.hidden = !(!q||code.includes(q)) || !(status==='all'||p?.status===status); });
    $$('#plaque-mobile-list .mobile-card').forEach(card=>{ const txt=card.textContent.toLowerCase(); const p=state.plaques.find(x=>txt.includes(x.code.toLowerCase())); card.hidden=!(!q||txt.includes(q)) || !(status==='all'||p?.status===status); });
  }

  function generateCode() {
    const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s='TT-';
    for(let i=0;i<6;i++) s+=chars[Math.floor(Math.random()*chars.length)];
    if(state.plaques.some(p=>p.code===s)) return generateCode(); return s;
  }

  function renderQRCodes() {
    $$('.qr-canvas').forEach(canvas=>drawQR(canvas,canvas.dataset.qr));
  }

  function drawQR(canvas,text) {
    if(!window.TajoQRCodeCore || !text) return;
    const QR=window.TajoQRCodeCore, levels=window.TajoQRErrorCorrectLevel;
    const qr=new QR(-1,levels.H); qr.addData(text); qr.make();
    const count=qr.getModuleCount(), ctx=canvas.getContext('2d');
    const size=canvas.width, quiet=4, total=count+quiet*2, cell=size/total;
    ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,size,size); ctx.fillStyle='#0b0d0e';
    for(let r=0;r<count;r++) for(let c=0;c<count;c++) if(qr.isDark(r,c)) {
      const x=Math.round((c+quiet)*cell), y=Math.round((r+quiet)*cell), x2=Math.round((c+quiet+1)*cell), y2=Math.round((r+quiet+1)*cell);
      ctx.fillRect(x,y,x2-x,y2-y);
    }
  }

  function downloadQR(code) {
    const p=state.plaques.find(x=>x.code===code); if(!p) return;
    const canvas=document.createElement('canvas'); canvas.width=1024; canvas.height=1024;
    drawQR(canvas,`https://${CONFIG.goDomain}${CONFIG.platePath}${p.code}`);
    const a=document.createElement('a'); a.download=`tajo-tap-${p.code}.png`; a.href=canvas.toDataURL('image/png'); a.click();
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); toast('Copiado','Link copiado para a área de transferência.'); }
    catch { const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('Copiado'); }
  }

  document.addEventListener('click', (e) => {
    const routeEl=e.target.closest('[data-route]');
    if(routeEl){ e.preventDefault(); go(routeEl.dataset.route); return; }
    const actionEl=e.target.closest('[data-action]'); if(!actionEl) return;
    const action=actionEl.dataset.action;
    if(action==='demo-admin'){state.role='admin';saveState();go('dashboard');}
    if(action==='demo-client'){state.role='client';saveState();go('portal');}
    if(action==='logout'||action==='portal-exit'){state.role=null;saveState();go('login');}
    if(action==='toggle-sidebar'){state.sidebarOpen=!state.sidebarOpen;render();}
    if(action==='close-sidebar'){state.sidebarOpen=false;render();}
    if(action==='theme'){setTheme(state.theme==='dark'?'light':'dark');render();}
    if(action==='notifications') toast('Tudo em dia','Nenhuma notificação crítica no momento.');
    if(action==='new-plaque') newPlaqueModal();
    if(action==='new-client') newClientModal();
    if(action==='open-scanner') openScannerModal();
    if(action==='simulate-scan') handleScannedValue(`https://${CONFIG.goDomain}${CONFIG.platePath}TT-7K2P9A`);
    if(action==='close-modal') closeModal();
    if(action==='modal-backdrop' && e.target===actionEl) closeModal();
    if(action==='scanner-manual-go') handleScannedValue($('#scanner-manual')?.value||'');
    if(action==='copy') copyText(actionEl.dataset.copy||'');
    if(action==='download-qr') downloadQR(actionEl.dataset.code);
    if(action==='edit-destination') editDestinationModal(actionEl.dataset.code);
    if(action==='toggle-plate') { const p=state.plaques.find(x=>x.code===actionEl.dataset.code); if(p){p.status=p.status==='paused'?'active':'paused';saveState();toast('Status atualizado');render();} }
    if(action==='go-plaques') go('plaques');
    if(action==='go-analytics') go('analytics');
    if(action==='activation-choice'){state.activation.selected=actionEl.dataset.choice;render();}
    if(action==='activation-next'){state.activation.step=Math.min(3,state.activation.step+1);render();}
    if(action==='activation-back'){state.activation.step=Math.max(1,state.activation.step-1);render();}
    if(action==='activation-complete'){
      const p=state.plaques.find(x=>x.code===state.activation.code); if(p){p.status='active';p.destinationType=state.activation.selected;p.destinationLabel=destinationName(state.activation.selected);p.destination='https://destino-configurado.exemplo';saveState();}
      state.activation.step=1; toast('Plaquinha ativada','Agora o destino pode ser alterado pelo painel.'); state.role='client'; saveState(); go('portal');
    }
  });

  document.addEventListener('submit', (e) => {
    if(e.target.id==='login-form') { e.preventDefault(); if(!e.target.reportValidity()) return; state.role='admin'; saveState(); go('dashboard'); }
    if(e.target.id==='manual-scan-form'){e.preventDefault();handleScannedValue(new FormData(e.target).get('code'));}
    if(e.target.id==='new-plaque-form'){
      e.preventDefault(); if(!e.target.reportValidity()) return; const fd=new FormData(e.target); const client=state.clients.find(c=>c.id===fd.get('client'));
      state.plaques.unshift({id:'p'+Date.now(),code:fd.get('code'),name:fd.get('name'),client:client?.name||'Não vinculado',clientId:client?.id||null,status:'unconfigured',destinationType:null,destinationLabel:'Aguardando configuração',destination:'',scansToday:0,scansMonth:0,scansTotal:0,qr:0,nfc:0}); saveState(); closeModal(); toast('Plaquinha criada',fd.get('code')); go('plaques');
    }
    if(e.target.id==='new-client-form'){
      e.preventDefault(); if(!e.target.reportValidity()) return; const fd=new FormData(e.target); state.clients.push({id:'c'+Date.now(),name:fd.get('name'),contact:fd.get('contact'),phone:fd.get('phone'),city:fd.get('city'),plates:0,scans:0,status:'active'}); closeModal(); toast('Cliente cadastrado',fd.get('name')); render();
    }
    if(e.target.id==='destination-form'){
      e.preventDefault(); if(!e.target.reportValidity()) return; const fd=new FormData(e.target), p=state.plaques.find(x=>x.code===e.target.dataset.code); if(p){p.destinationType=fd.get('type');p.destinationLabel=destinationName(fd.get('type'));p.destination=fd.get('destination');p.status='active';saveState();} closeModal();toast('Destino atualizado','A plaquinha física continua a mesma.');render();
    }
  });

  document.addEventListener('change',(e)=>{
    if(e.target.id==='qr-image-input' && e.target.files?.[0]) scanImage(e.target.files[0]);
  });

  document.addEventListener('click',(e)=>{
    const choice=e.target.closest('.destination-modal-choice'); if(!choice) return;
    $$('.destination-modal-choice').forEach(x=>x.classList.remove('active')); choice.classList.add('active'); const f=$('#destination-form [name="type"]'); if(f) f.value=choice.dataset.type;
  });

  window.addEventListener('hashchange',render);
  window.addEventListener('beforeunload',stopScanner);
  render();
})();
