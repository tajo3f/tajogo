/* TAJO TAP Frontend + Backend V3.4
 * Production-oriented SPA connected to Vercel Functions + Supabase.
 * Sensitive Supabase keys stay server-side; browser talks only to same-origin /api routes.
 */
(function () {
  'use strict';

  const CONFIG = window.TAJO_TAP_CONFIG || { primaryDomain:'tajodigital.com.br', panelDomain:'go.tajodigital.com.br', goDomain:'go.tajodigital.com.br', platePath:'/q/', nfcPath:'/n/', activationPath:'/atv/' };
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
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    sales: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 19V9m5 10V5m5 14v-7m5 7V3"/><path d="m4 8 5-3 5 6 5-8"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M20 4 14 10"/></svg>'
  };

  const PLAYBOOK = window.TAJO_TAP_SALES_PLAYBOOK || { prospecting: [], principles: [], scripts: [], objections: [], routine: [], guardrails: [] };


  const persisted = safeParse(localStorage.getItem('tajoTapPrefs')) || {};
  const state = {
    role: null,
    sessionRole: null,
    user: null,
    authReady: false,
    theme: persisted.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    plaques: [],
    clients: [],
    sidebarOpen: false,
    busy: false,
    activation: { step: 1, selected: 'google', code: '', value: '', message: '', pin: '', plate: null, loading: false, loaded: false, error: '', accountMode: 'signup', fullName: '', companyName: '', phone: '', email: '', password: '', completed: false, sessionReady: false, confirmationRequired: false },
    scanner: { stream: null, raf: null, detector: null, running: false }
  };

  function safeParse(value) { try { return JSON.parse(value); } catch { return null; } }
  function saveState() {
    localStorage.setItem('tajoTapPrefs', JSON.stringify({ theme: state.theme }));
  }
  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.dataset.theme = theme;
    saveState();
  }
  setTheme(state.theme);

  async function apiFetch(url, options = {}) {
    const init = { credentials: 'same-origin', ...options, headers: { ...(options.headers || {}) } };
    if (init.body && typeof init.body !== 'string') {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(init.body);
    }
    const response = await fetch(url, init);
    let payload = null;
    try { payload = await response.json(); } catch { payload = null; }
    if (!response.ok || payload?.ok === false) {
      const error = new Error(payload?.message || 'Não foi possível concluir a operação.');
      error.status = response.status;
      error.code = payload?.error || 'REQUEST_FAILED';
      throw error;
    }
    return payload || { ok: true };
  }

  async function loadAdminData() {
    const [platesResult, clientsResult] = await Promise.all([
      apiFetch('/api/admin/plates'),
      apiFetch('/api/admin/clients')
    ]);
    state.plaques = Array.isArray(platesResult.plates) ? platesResult.plates : [];
    state.clients = Array.isArray(clientsResult.clients) ? clientsResult.clients : [];
  }

  async function loadClientData() {
    const result = await apiFetch('/api/client/plates');
    state.plaques = Array.isArray(result.plates) ? result.plates : [];
    state.clients = [];
  }

  async function refreshRoleData() {
    if (state.role === 'admin') return loadAdminData();
    if (state.role === 'client') return loadClientData();
  }

  async function bootstrap() {
    try {
      const session = await apiFetch('/api/auth/me');
      if (session.authenticated) {
        state.user = session.user || null;
        state.sessionRole = session.role || 'unassigned';
        if (session.role === 'admin' || session.role === 'client') {
          state.role = session.role;
          await refreshRoleData();
        }
      }
    } catch (error) {
      console.error('[TAJO TAP bootstrap]', error);
    } finally {
      state.authReady = true;
      render();
    }
  }


  function route() {
    const cleanPath = location.pathname.match(/^\/atv\/(TT-[A-Za-z0-9]{6,12})\/?$/i);
    if (cleanPath) return { name: 'activate', param: cleanPath[1].toUpperCase(), clean: true };
    const raw = location.hash.replace(/^#\/?/, '') || (state.role ? 'dashboard' : 'login');
    const parts = raw.split('/').filter(Boolean);
    return { name: parts[0] || 'login', param: decodeURIComponent(parts[1] || '') };
  }

  function go(path) {
    state.sidebarOpen = false;
    stopScanner();
    const target = '#/' + path.replace(/^\//, '');
    if (/^\/atv\//i.test(location.pathname)) {
      history.replaceState(null, '', '/' + target);
      render();
      return;
    }
    location.hash = target;
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
    if (!state.authReady) return renderLoading();
    document.body.classList.toggle('is-auth', r.name === 'login');
    if (r.name === 'login') return renderLogin();
    if (r.name === 'activate') return renderActivation(r.param || '');
    if (!state.role) return go('login');
    if (state.role === 'client') {
      if (r.name !== 'portal') return go('portal');
      return renderPortal();
    }
    if (r.name === 'portal') return go('dashboard');
    app.innerHTML = shell(renderPage(r), r.name);
    bindPageEnhancements(r);
  }

  function renderLoading() {
    app.innerHTML = `<main class="auth-shell"><section class="auth-brand" aria-label="TAJO TAP"><img class="auth-brand-logo" src="assets/images/tajo-tap-logo.png" alt="TAJO TAP"><div class="auth-copy"><div class="auth-kicker">Conectando</div><h1>Preparando sua central.</h1><p>Validando sua sessão e sincronizando as plaquinhas com o backend TAJO TAP.</p></div></section><section class="auth-panel"><div class="auth-card"><div class="eyebrow">Aguarde</div><h2>Carregando dados...</h2><p>A conexão segura com o Supabase está sendo verificada.</p></div></section></main>`;
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
          <small style="position:relative;z-index:1;color:#68716a">TAJO Digital 3F · Operação segura</small>
        </section>
        <section class="auth-panel">
          <div class="auth-card">
            <img class="auth-mobile-logo" src="assets/images/tajo-tap-logo.png" alt="TAJO TAP">
            <div class="eyebrow">Acesso seguro</div>
            <h2>Bem-vindo ao TAJO TAP</h2>
            <p>Entre para gerenciar plaquinhas, clientes e direcionamentos.</p>
            <form id="login-form" class="stack" novalidate>
              <div class="field"><label for="email">E-mail</label><input class="input" id="email" name="email" type="email" autocomplete="email" placeholder="seuemail@empresa.com.br" required></div>
              <div class="field"><label for="password">Senha</label><input class="input" id="password" name="password" type="password" autocomplete="current-password" placeholder="Sua senha" minlength="8" required></div>
              <button class="btn btn-primary" type="submit">Entrar no painel ${ICONS.arrow}</button>
            </form>
            <div class="demo-note">Acesso protegido. Sua sessão é validada pelo backend e as chaves administrativas do Supabase nunca são enviadas ao navegador.</div>
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
      ['sales','sales','Vendas'],
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
          <div class="sidebar-user"><div class="avatar">${esc(userInitials())}</div><div class="meta"><strong>${esc(state.user?.name || 'Administrador')}</strong><span>Administrador</span></div></div>
          <button class="sidebar-logout" type="button" data-action="logout">${ICONS.logout}<span>Sair da conta</span></button>
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
          <a class="${active==='sales'?'active':''}" href="#/sales">${ICONS.sales}<span>Vendas</span></a>
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
    if (r.name === 'sales') return salesPage();
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
        ${metric('Plaquinhas ativas',active,`${state.plaques.filter(p=>p.status==='unconfigured').length} aguardando configuração`,'plate')}
        ${metric('Acessos no mês',formatNumber(month),'Dados registrados pelo redirect','analytics')}
        ${metric('Clientes ativos',state.clients.filter(c=>c.status==='active').length,'Base sincronizada','clients')}
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
            ${quick('Scripts de vendas','Abra o playbook comercial com abordagem, objeções e follow-up.','sales','go-sales')}
          </div>
        </div>
        <div class="card card-pad">
          <div class="card-title"><div><h2>Atividade recente</h2><p>Últimas alterações da operação.</p></div><span class="chip">Agora</span></div>
          <div class="activity-list">
            ${state.plaques.slice(0,4).map(p=>activity(p.status==='unconfigured'?'Plaquinha criada':'Plaquinha sincronizada',`${p.code} · ${p.client}`,p.status==='unconfigured'?'plate':'link',p.createdAt?new Date(p.createdAt).toLocaleDateString('pt-BR'):'agora')).join('') || '<div class="empty-state"><strong>Nenhuma plaquinha cadastrada.</strong><span>Crie a primeira unidade para iniciar a operação.</span></div>'}
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
    const p = state.plaques.find(x=>x.code===code);
    if(!p) return notFoundPage();
    const qrUrl = `https://${CONFIG.goDomain}${CONFIG.platePath}${p.code}`;
    const nfcUrl = `https://${CONFIG.goDomain}${CONFIG.nfcPath || '/n/'}${p.code}`;
    const activationUrl = `https://${CONFIG.goDomain}${CONFIG.activationPath || '/atv/'}${p.code}`;
    const setupLabel = p.configurationLocked || p.setupStatus === 'completed' ? 'Configuração concluída' : 'Aguardando ativação do cliente';
    return `
      ${pageHead('Plaquinha','Gerenciar '+esc(p.code),esc(p.name)+' · '+esc(p.client), `<button class="btn btn-ghost" data-action="copy" data-copy="${esc(qrUrl)}">${ICONS.copy} Copiar QR</button><button class="btn btn-primary" data-action="edit-destination" data-code="${esc(p.code)}">${ICONS.edit} Alterar destino</button>`)}
      <div class="detail-grid">
        <div class="stack">
          <section class="card plaque-hero"><div class="row-between"><span class="badge ${p.status==='active'?'badge-success':'badge-warning'}">${p.status==='active'?'ATIVA':'STATUS: '+esc(p.status.toUpperCase())}</span><img src="assets/images/tajo-tap-mark.png" alt="" style="width:54px;background:#fff;border-radius:13px;padding:5px"></div><div><div class="plaque-code">${esc(p.code)}</div><div class="plaque-link">${esc(qrUrl)}</div></div></section>
          <section class="card card-pad"><div class="card-title"><div><h2>Ativação do cliente</h2><p>${esc(setupLabel)}.</p></div><span class="badge ${p.configurationLocked?'badge-success':'badge-warning'}">${p.configurationLocked?'BLOQUEADA':'PENDENTE'}</span></div><div class="form-grid"><div class="field"><label>URL de ativação</label><input class="input mono" readonly value="${esc(activationUrl)}"></div><div class="field"><label>Proprietário</label><input class="input" readonly value="${esc(p.ownerUserId ? 'Conta vinculada' : 'Ainda não vinculado')}"></div></div><div class="row wrap" style="margin-top:14px"><button class="btn btn-ghost" data-action="copy" data-copy="${esc(activationUrl)}">${ICONS.copy} Copiar ativação</button></div></section>
          <section class="card card-pad"><div class="card-title"><div><h2>Destino atual</h2><p>O QR e o NFC permanecem iguais. Só o destino muda.</p></div>${statusBadge(p.status)}</div><div class="destination-option active"><div class="destination-icon">${destinationIcon(p.destinationType)}</div><div class="destination-copy"><strong>${esc(p.destinationLabel)}</strong><span>${p.destination ? esc(p.destination) : 'O cliente ainda precisa escolher um destino.'}</span></div></div><div class="row wrap" style="margin-top:16px"><button class="btn btn-primary" data-action="edit-destination" data-code="${esc(p.code)}">${ICONS.edit} Alterar destino</button><button class="btn btn-ghost" data-action="toggle-plate" data-code="${esc(p.code)}">${p.status==='paused'?'Ativar plaquinha':'Pausar plaquinha'}</button></div></section>
          <section class="metric-grid" style="grid-template-columns:repeat(3,minmax(0,1fr))">${metric('Hoje',formatNumber(p.scansToday),'Acessos','scan')}${metric('Este mês',formatNumber(p.scansMonth),'Acessos','analytics')}${metric('Total',formatNumber(p.scansTotal),'Desde ativação','dashboard')}</section>
        </div>
        <div class="stack">
          <section class="card card-pad"><div class="card-title"><div><h2>QR da plaquinha</h2><p>Use este QR na impressão do acrílico.</p></div></div><div class="qr-frame"><canvas class="qr-canvas" data-qr="${esc(qrUrl)}" width="512" height="512"></canvas></div><div class="qr-caption mono">${esc(qrUrl)}</div><div class="row wrap" style="justify-content:center;margin-top:16px"><button class="btn btn-ghost" data-action="download-qr" data-code="${esc(p.code)}">${ICONS.download} Baixar PNG</button><button class="btn btn-ghost" data-action="copy" data-copy="${esc(nfcUrl)}">${ICONS.wifi} Copiar NFC</button></div></section>
          <section class="card card-pad"><div class="card-title"><div><h3>Origem dos acessos</h3><p>QR e NFC são contabilizados separadamente.</p></div></div>${breakdown('QR Code',p.qr,p.scansTotal)}${breakdown('NFC / aproximação',p.nfc,p.scansTotal)}</section>
          <section class="card card-pad danger-card"><div class="card-title"><div><h3>Zona de teste e exclusão</h3><p>Use para remover unidades criadas apenas para testes. A exclusão apaga destinos, PIN e eventos vinculados à plaquinha.</p></div></div><button class="btn btn-danger" data-action="delete-plate" data-code="${esc(p.code)}">${ICONS.trash} Excluir plaquinha</button></section>
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
      <section class="scanner-launch"><div><div class="eyebrow" style="color:var(--brand)">Scan inteligente</div><h2>Escaneie. Identifique. Gerencie.</h2><p>Ideal para suporte, instalação e manutenção em campo. O leitor reconhece links do padrão <span class="mono">${esc(CONFIG.goDomain + CONFIG.platePath + "CODIGO")}</span> e abre a plaquinha encontrada.</p><div class="row wrap" style="margin-top:22px"><button class="btn btn-primary" data-action="open-scanner">${ICONS.camera} Usar câmera</button></div></div><div class="scanner-visual"><img src="assets/images/tajo-tap-mark.png" alt=""></div></section>
      <div class="card card-pad" style="margin-top:18px"><div class="card-title"><div><h2>Também dá para buscar manualmente</h2><p>Útil quando a câmera estiver indisponível ou o código estiver impresso no verso.</p></div></div><form id="manual-scan-form" class="row wrap"><input class="input" style="flex:1;min-width:220px" name="code" placeholder="Ex.: TT-7K2P9A" autocomplete="off"><button class="btn btn-dark">Localizar ${ICONS.arrow}</button></form></div>`;
  }

  function clientsPage() {
    const rows = state.clients.map(c=>`<tr><td><div class="entity"><div class="entity-icon">${esc(c.name[0])}</div><div class="entity-copy"><strong>${esc(c.name)}</strong><span>${esc(c.city)}</span></div></div></td><td>${esc(c.contact)}</td><td>${esc(c.phone)}</td><td>${c.plates}</td><td>${formatNumber(c.scans)}</td><td>${c.status==='active'?'<span class="badge badge-success">Ativo</span>':'<span class="badge badge-muted">Inativo</span>'}</td></tr>`).join('');
    const cards = state.clients.map(c=>`<article class="card mobile-card"><div class="mobile-card-head"><div class="entity"><div class="entity-icon">${esc(c.name[0])}</div><div class="entity-copy"><strong>${esc(c.name)}</strong><span>${esc(c.city)}</span></div></div>${c.status==='active'?'<span class="badge badge-success">Ativo</span>':'<span class="badge badge-muted">Inativo</span>'}</div><div class="mobile-card-meta"><div><span>Plaquinhas</span><strong>${c.plates}</strong></div><div><span>Acessos</span><strong>${formatNumber(c.scans)}</strong></div></div><button class="btn btn-ghost" style="width:100%">Ver cliente ${ICONS.arrow}</button></article>`).join('');
    return `${pageHead('Relacionamento','Clientes','Centralize quem possui plaquinhas e acompanhe o uso por estabelecimento.', `<button class="btn btn-primary" data-action="new-client">${ICONS.plus} Novo cliente</button>`)}<div class="toolbar"><div class="grow input-with-icon">${ICONS.search}<input class="input" placeholder="Buscar cliente"></div></div><div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Contato</th><th>Telefone</th><th>Placas</th><th>Acessos</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div><div class="mobile-list">${cards}</div>`;
  }

  function analyticsPage() {
    const month=state.plaques.reduce((s,p)=>s+p.scansMonth,0);
    const total=state.plaques.reduce((s,p)=>s+p.scansTotal,0);
    const qr=state.plaques.reduce((s,p)=>s+p.qr,0);
    const nfc=state.plaques.reduce((s,p)=>s+p.nfc,0);
    const qrPct=total?Math.round(qr/total*100):0;
    const nfcPct=total?Math.round(nfc/total*100):0;
    const top=[...state.plaques].sort((a,b)=>b.scansTotal-a.scansTotal).slice(0,6);
    const destinationTotals={};
    state.plaques.forEach(p=>{ const key=p.destinationLabel||'Sem destino'; destinationTotals[key]=(destinationTotals[key]||0)+p.scansTotal; });
    const destinations=Object.entries(destinationTotals).sort((a,b)=>b[1]-a[1]).slice(0,5);
    return `
      ${pageHead('Mensuração','Analytics','Dados registrados pelo motor de redirecionamento do TAJO TAP.', '')}
      <section class="metric-grid">${metric('Acessos no mês',formatNumber(month),'Mês atual','analytics')}${metric('QR Code',`${qrPct}%`,`${formatNumber(qr)} acessos acumulados`,'scan')}${metric('NFC',`${nfcPct}%`,`${formatNumber(nfc)} acessos acumulados`,'wifi')}${metric('Total histórico',formatNumber(total),'Todos os acessos','dashboard')}</section>
      <section class="analytics-grid" style="margin-top:18px">
        <div class="card card-pad"><div class="card-title"><div><h2>Top plaquinhas</h2><p>Unidades com maior volume acumulado.</p></div><span class="chip">Supabase</span></div><div class="breakdown">${top.map(p=>breakdown(`${p.code} · ${p.name}`,p.scansTotal,Math.max(total,1))).join('') || '<div class="empty-state"><strong>Sem acessos ainda.</strong><span>Os dados aparecerão após os primeiros scans.</span></div>'}</div></div>
        <div class="card card-pad"><div class="card-title"><div><h2>Destinos mais usados</h2><p>Distribuição por destino atual das plaquinhas.</p></div></div><div class="breakdown">${destinations.map(([label,value])=>breakdown(label,value,Math.max(total,1))).join('') || '<div class="empty-state"><strong>Nenhum destino ativo.</strong><span>Configure uma plaquinha para começar.</span></div>'}</div></div>
      </section>`;
  }

  function salesPage() {
    const scriptCards = PLAYBOOK.scripts.map(item => `<article class="sales-script-card" data-sales-search="${esc([item.title,item.context,item.category,item.text].join(' ').toLowerCase())}"><div class="sales-card-top"><div><span class="sales-tag">${esc(item.category)}</span><h3>${esc(item.title)}</h3><p>${esc(item.context)}</p></div><button class="btn btn-sm btn-ghost" data-action="copy-sales-script" data-script-id="${esc(item.id)}">${ICONS.copy} Copiar</button></div><div class="sales-script-text">${esc(item.text)}</div></article>`).join('');
    const objectionCards = PLAYBOOK.objections.map(item => `<article class="objection-card" data-sales-search="${esc([item.objection,item.answer].join(' ').toLowerCase())}"><div class="objection-q"><span>Objeção</span><strong>${esc(item.objection)}</strong></div><div class="objection-a"><span>Resposta sugerida</span><p>${esc(item.answer)}</p></div><button class="btn btn-sm btn-ghost" data-action="copy-objection" data-objection-id="${esc(item.id)}">${ICONS.copy} Copiar resposta</button></article>`).join('');
    const leadCards = PLAYBOOK.prospecting.map(item => `<article class="sales-mini-card" data-sales-search="${esc([item.title,item.text].join(' ').toLowerCase())}"><span class="icon-box">${ICONS.target}</span><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></article>`).join('');
    const principleCards = PLAYBOOK.principles.map(item => `<article class="sales-principle" data-sales-search="${esc([item.title,item.application].join(' ').toLowerCase())}"><strong>${esc(item.title)}</strong><p>${esc(item.application)}</p></article>`).join('');
    return `
      ${pageHead('Playbook comercial','Vendas TAJO TAP','Um centro de prospecção e fechamento adaptado ao produto: quem abordar, o que observar, como demonstrar valor, responder objeções e acompanhar cada oportunidade.', `<button class="btn btn-primary" data-action="sales-routine">${ICONS.target} Rotina de prospecção</button>`)}
      <div class="sales-searchbar input-with-icon">${ICONS.search}<input id="sales-search" class="input" placeholder="Buscar script, objeção, Google, WhatsApp, preço..."></div>
      <section class="sales-hero-grid">
        <article class="card card-pad sales-positioning"><div class="eyebrow">Posicionamento</div><h2>Venda a redução de atrito, não “um QR Code”.</h2><p>${esc(PLAYBOOK.promise || '')}</p><div class="sales-principle-strip"><span>Um toque</span><span>Menos passos</span><span>Destino editável</span><span>QR + NFC</span></div></article>
        <article class="card card-pad"><div class="card-title"><div><h2>Neuromarketing ético</h2><p>Princípios de decisão aplicados sem manipulação.</p></div><span class="badge badge-success">USO ÉTICO</span></div><div class="sales-guardrails">${PLAYBOOK.guardrails.map(x=>`<div>${ICONS.check}<span>${esc(x)}</span></div>`).join('')}</div></article>
      </section>
      <section class="sales-section"><div class="sales-section-head"><div><span class="eyebrow">Prospecção</span><h2>Como encontrar clientes que realmente têm aderência</h2></div></div><div class="sales-mini-grid">${leadCards}</div></section>
      <section class="sales-section"><div class="sales-section-head"><div><span class="eyebrow">Decisão</span><h2>Princípios de neuromarketing aplicados à TAJO TAP</h2></div></div><div class="sales-principles-grid">${principleCards}</div></section>
      <section class="sales-section"><div class="sales-section-head"><div><span class="eyebrow">Scripts</span><h2>Abordagem, demonstração, fechamento e follow-up</h2></div><span class="chip">Copie e personalize</span></div><div class="sales-scripts-grid" id="sales-script-grid">${scriptCards}</div></section>
      <section class="sales-section"><div class="sales-section-head"><div><span class="eyebrow">Objeções</span><h2>Respostas profissionais sem pressão</h2></div></div><div class="objection-grid" id="sales-objection-grid">${objectionCards}</div></section>
      <section class="card card-pad sales-routine-card"><div class="card-title"><div><h2>Rotina comercial recomendada</h2><p>Use como checklist diário e acompanhe conversão por etapa.</p></div><span class="chip">Execução</span></div><ol>${PLAYBOOK.routine.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></section>`;
  }

  function settingsPage() {
    return `${pageHead('Sistema','Configurações','Preferências, sessão e parâmetros do TAJO TAP.', '')}
      <div class="detail-grid">
        <section class="card card-pad"><div class="card-title"><div><h2>Identidade</h2><p>A marca oficial já está aplicada em todo o sistema.</p></div></div><div class="row" style="padding:20px;background:#fff;border-radius:16px;border:1px solid #e5e8e4"><img src="assets/images/tajo-tap-logo.png" style="width:min(260px,80%)" alt="TAJO TAP"></div><div class="form-grid" style="margin-top:18px"><div class="field"><label>Domínio principal</label><input class="input" readonly value="${esc(CONFIG.primaryDomain)}"></div><div class="field"><label>Sistema TAJO TAP</label><input class="input" readonly value="${esc(CONFIG.goDomain)}"></div></div></section>
        <div class="stack"><section class="card card-pad"><div class="card-title"><div><h2>Experiência</h2><p>Preferências locais do frontend.</p></div></div><div class="destination-option"><div class="destination-icon">${state.theme==='dark'?ICONS.moon:ICONS.sun}</div><div class="destination-copy" style="flex:1"><strong>Tema ${state.theme==='dark'?'escuro':'claro'}</strong><span>Você pode alternar a qualquer momento.</span></div><button class="btn btn-sm btn-ghost" data-action="theme">Alternar</button></div><div class="destination-option" style="margin-top:12px"><div class="destination-icon">${ICONS.lock}</div><div class="destination-copy"><strong>Backend conectado</strong><span>Vercel Functions + Supabase Auth + PostgreSQL + motor de redirecionamento.</span></div></div></section>
        <section class="card card-pad"><div class="card-title"><div><h2>Sessão</h2><p>Conta atualmente autenticada no sistema.</p></div></div><div class="account-session"><div class="avatar">${esc(userInitials())}</div><div><strong>${esc(state.user?.name || 'Administrador')}</strong><span>${esc(state.user?.email || 'Conta TAJO TAP')}</span></div></div><button class="btn btn-dark" style="width:100%;margin-top:16px" data-action="logout">${ICONS.logout} Sair da conta</button></section></div>
      </div>`;
  }

  function notFoundPage() { return `${pageHead('Erro 404','Página não encontrada.','O endereço solicitado não existe neste frontend.', `<button class="btn btn-primary" data-route="dashboard">Voltar ao painel</button>`)}`; }

  function renderPortal() {
    const owned = state.plaques;
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

  function resetActivation(code) {
    state.activation = {
      step: 1,
      selected: 'google',
      code,
      value: '',
      rawValue: '',
      message: '',
      pin: '',
      plate: null,
      loading: false,
      loaded: false,
      error: '',
      accountMode: 'signup',
      fullName: '',
      companyName: '',
      phone: '',
      email: state.user?.email || '',
      password: '',
      completed: false,
      sessionReady: false,
      confirmationRequired: false
    };
  }

  async function loadActivationPlate(code) {
    state.activation.loading = true;
    state.activation.error = '';
    render();
    try {
      const out = await apiFetch(`/api/public/activate?code=${encodeURIComponent(code)}`);
      state.activation.plate = out.plate || null;
      state.activation.loaded = true;
    } catch (error) {
      state.activation.error = error.message || 'Não foi possível consultar esta plaquinha.';
      state.activation.loaded = true;
    } finally {
      state.activation.loading = false;
      render();
    }
  }

  function activationProgress(step) {
    return `<div class="activation-progress" aria-label="Etapa ${step} de 4"><span class="${step>=1?'active':''}"></span><span class="${step>=2?'active':''}"></span><span class="${step>=3?'active':''}"></span><span class="${step>=4?'active':''}"></span></div>`;
  }

  function activationShell(content, badge = 'ATIVAÇÃO SEGURA', badgeType = 'warning') {
    return `<main class="activate-shell"><section class="activate-card"><header class="activate-head"><img class="activate-logo" src="assets/images/tajo-tap-logo.png" alt="TAJO TAP"><span class="badge badge-${badgeType}">${badge}</span></header><div class="activate-body">${content}</div></section></main>`;
  }

  function renderActivation(code) {
    const cleanCode = extractPlateCode(code);
    if (!/^TT-[A-Z0-9]{6,12}$/.test(cleanCode)) {
      app.innerHTML = activationShell(`<div class="eyebrow" style="color:var(--brand)">TAJO TAP</div><h1>Link de ativação inválido.</h1><p>Confira o endereço da plaquinha ou fale com o suporte TAJO.</p><button class="btn btn-ghost" style="width:100%" data-action="activation-home">Ir para o painel</button>`, 'LINK INVÁLIDO', 'danger');
      return;
    }

    if (state.activation.code !== cleanCode) resetActivation(cleanCode);
    if (!state.activation.loaded && !state.activation.loading) {
      loadActivationPlate(cleanCode);
      app.innerHTML = activationShell(`<div class="eyebrow" style="color:var(--brand)">Plaquinha ${esc(cleanCode)}</div><h1>Verificando sua TAJO TAP…</h1><p>Estamos validando o código e preparando a ativação segura.</p><div class="activation-loader" aria-hidden="true"></div>`, 'VERIFICANDO', 'muted');
      return;
    }
    if (state.activation.loading) {
      app.innerHTML = activationShell(`<div class="eyebrow" style="color:var(--brand)">Plaquinha ${esc(cleanCode)}</div><h1>Verificando sua TAJO TAP…</h1><p>Estamos validando o código e preparando a ativação segura.</p><div class="activation-loader" aria-hidden="true"></div>`, 'VERIFICANDO', 'muted');
      return;
    }
    if (state.activation.error || !state.activation.plate) {
      app.innerHTML = activationShell(`<div class="eyebrow" style="color:var(--brand)">${esc(cleanCode)}</div><h1>Não foi possível iniciar a ativação.</h1><p>${esc(state.activation.error || 'Esta plaquinha não foi encontrada.')}</p><button class="btn btn-primary" style="width:100%" data-action="activation-retry">Tentar novamente ${ICONS.arrow}</button>`, 'INDISPONÍVEL', 'danger');
      return;
    }

    const plate = state.activation.plate;
    if (plate.configured && !state.activation.completed) {
      app.innerHTML = activationShell(`<div class="activation-success-icon">${ICONS.check}</div><div class="eyebrow" style="color:var(--brand)">Plaquinha ${esc(cleanCode)}</div><h1>Esta plaquinha já foi ativada.</h1><p>A configuração inicial é feita apenas uma vez. Para alterar o destino, entre na sua conta TAJO TAP.</p><div class="activation-summary"><div><span>Status</span><strong>Ativa</strong></div><div><span>Código</span><strong class="mono">${esc(cleanCode)}</strong></div></div><button class="btn btn-primary" style="width:100%;margin-top:22px" data-action="activation-home">Entrar no painel ${ICONS.arrow}</button>`, 'JÁ ATIVADA', 'success');
      return;
    }
    if (!plate.available && !state.activation.completed) {
      app.innerHTML = activationShell(`<div class="eyebrow" style="color:var(--brand)">${esc(cleanCode)}</div><h1>Ativação indisponível.</h1><p>Esta unidade existe, mas não está liberada para configuração neste momento. Fale com a TAJO para verificar o status.</p><button class="btn btn-ghost" style="width:100%" data-action="activation-home">Ir para o painel</button>`, 'INDISPONÍVEL', 'danger');
      return;
    }

    if (state.activation.completed) {
      const destination = state.activation.value;
      const loginText = state.activation.confirmationRequired ? 'Confirmar e-mail / entrar' : 'Abrir minhas plaquinhas';
      app.innerHTML = activationShell(`<div class="activation-success-icon">${ICONS.check}</div><div class="eyebrow" style="color:var(--brand)">${esc(cleanCode)}</div><h1>Sua TAJO TAP está ativa.</h1><p>O QR Code físico já está direcionando para o destino escolhido. A configuração pública desta plaquinha foi encerrada.</p><div class="activation-summary"><div><span>Destino</span><strong>${esc(destinationName(state.activation.selected))}</strong></div><div><span>Configuração</span><strong>Concluída e bloqueada</strong></div></div>${state.activation.confirmationRequired?'<div class="activation-notice">Enviamos a confirmação de cadastro conforme a configuração de autenticação do projeto. Após confirmar o e-mail, entre normalmente no painel.</div>':''}<div class="row activation-actions"><a class="btn btn-ghost" href="${esc(destination)}" target="_blank" rel="noopener noreferrer">Testar destino</a><button class="btn btn-primary" data-action="activation-finish">${loginText} ${ICONS.arrow}</button></div>`, 'ATIVA', 'success');
      return;
    }

    app.innerHTML = activationShell(`<div class="activation-topline"><div><div class="eyebrow" style="color:var(--brand)">Ativação única</div><strong class="mono">${esc(cleanCode)}</strong></div><span class="activation-step-label">Etapa ${state.activation.step}/4</span></div>${activationProgress(state.activation.step)}${activationStep(plate, state.activation.step)}`);
  }

  function activationStep(plate, step) {
    if (step === 1) {
      return `<div class="activation-hero"><div class="activation-plate-mark">${ICONS.wifi}</div><h1>Ative sua plaquinha.</h1><p>Você vai vincular esta TAJO TAP à sua conta e escolher para onde seus clientes serão direcionados.</p></div><div class="activation-feature-list"><div>${ICONS.check}<span><strong>QR Code permanente</strong><small>O impresso no acrílico não precisa ser trocado.</small></span></div><div>${ICONS.check}<span><strong>Configuração inicial única</strong><small>Depois da confirmação, este link público será bloqueado.</small></span></div><div>${ICONS.check}<span><strong>Controle pelo painel</strong><small>Futuras alterações são feitas com login.</small></span></div></div><button class="btn btn-primary" style="width:100%;margin-top:24px" data-action="activation-next">Começar ativação ${ICONS.arrow}</button>`;
    }

    if (step === 2) {
      if (state.user) {
        return `<h1>Identifique seu negócio.</h1><p>Sua conta já está autenticada como <strong>${esc(state.user.email || state.user.name || 'usuário')}</strong>. Agora informe o estabelecimento que usará esta plaquinha.</p><div class="activation-account-ok">${ICONS.check}<div><strong>Conta conectada</strong><span>${esc(state.user.email || '')}</span></div></div><div class="form-grid"><div class="field"><label for="activation-company">Estabelecimento</label><input id="activation-company" class="input" value="${esc(state.activation.companyName)}" autocomplete="organization" placeholder="Ex.: Restaurante Central" required></div><div class="field"><label for="activation-phone">WhatsApp</label><input id="activation-phone" class="input" value="${esc(state.activation.phone)}" inputmode="tel" autocomplete="tel" placeholder="(27) 99999-9999"></div></div><div class="row activation-actions"><button class="btn btn-ghost" data-action="activation-back">Voltar</button><button class="btn btn-primary" style="flex:1" data-action="activation-next">Continuar ${ICONS.arrow}</button></div>`;
      }

      const tabs = `<div class="activation-tabs"><button class="${state.activation.accountMode==='signup'?'active':''}" data-action="activation-account-mode" data-mode="signup">Criar minha conta</button><button class="${state.activation.accountMode==='existing'?'active':''}" data-action="activation-account-mode" data-mode="existing">Já tenho uma conta</button></div>`;
      if (state.activation.accountMode === 'existing') {
        return `<h1>Entre na sua conta.</h1><p>Use seu acesso TAJO TAP. Depois do login, esta plaquinha será vinculada ao seu negócio.</p>${tabs}<form id="activation-existing-login-form" class="stack"><div class="form-grid"><div class="field"><label>E-mail</label><input class="input" name="email" type="email" autocomplete="email" value="${esc(state.activation.email)}" required></div><div class="field"><label>Senha</label><input class="input" name="password" type="password" autocomplete="current-password" minlength="8" required></div></div><div class="form-grid"><div class="field"><label>Estabelecimento</label><input class="input" name="company" autocomplete="organization" value="${esc(state.activation.companyName)}" required></div><div class="field"><label>WhatsApp</label><input class="input" name="phone" inputmode="tel" autocomplete="tel" value="${esc(state.activation.phone)}"></div></div><div class="row activation-actions"><button type="button" class="btn btn-ghost" data-action="activation-back">Voltar</button><button class="btn btn-primary" style="flex:1" type="submit">Entrar e continuar ${ICONS.arrow}</button></div></form>`;
      }

      return `<h1>Crie seu acesso.</h1><p>Essa conta será a proprietária da plaquinha e permitirá alterar o destino futuramente pelo painel.</p>${tabs}<div class="stack"><div class="form-grid"><div class="field"><label for="activation-name">Seu nome</label><input id="activation-name" class="input" value="${esc(state.activation.fullName)}" autocomplete="name" placeholder="Nome do responsável"></div><div class="field"><label for="activation-company">Estabelecimento</label><input id="activation-company" class="input" value="${esc(state.activation.companyName)}" autocomplete="organization" placeholder="Nome da empresa"></div></div><div class="form-grid"><div class="field"><label for="activation-email">E-mail</label><input id="activation-email" class="input" type="email" value="${esc(state.activation.email)}" autocomplete="email" placeholder="voce@empresa.com.br"></div><div class="field"><label for="activation-phone">WhatsApp</label><input id="activation-phone" class="input" value="${esc(state.activation.phone)}" inputmode="tel" autocomplete="tel" placeholder="(27) 99999-9999"></div></div><div class="field"><label for="activation-password">Crie uma senha</label><input id="activation-password" class="input" type="password" autocomplete="new-password" minlength="8" placeholder="Mínimo de 8 caracteres"><span class="field-help">Use uma senha exclusiva. A TAJO nunca solicita sua senha por WhatsApp.</span></div></div><div class="row activation-actions"><button class="btn btn-ghost" data-action="activation-back">Voltar</button><button class="btn btn-primary" style="flex:1" data-action="activation-next">Continuar ${ICONS.arrow}</button></div>`;
    }

    if (step === 3) {
      return `<h1>Defina o destino.</h1><p>Digite o PIN entregue com a plaquinha e escolha o link que será aberto após o scan.</p><div class="field activation-pin-field"><label for="activation-pin">PIN de ativação</label><input id="activation-pin" class="input mono" inputmode="numeric" autocomplete="one-time-code" maxlength="6" value="${esc(state.activation.pin)}" placeholder="000000"><span class="field-help">Após 5 tentativas incorretas, a ativação é bloqueada temporariamente.</span></div><div class="choice-grid activation-choice-grid">${destinationChoices()}</div>${destinationField(state.activation.selected)}<div class="row activation-actions"><button class="btn btn-ghost" data-action="activation-back">Voltar</button><button class="btn btn-primary" style="flex:1" data-action="activation-next">Revisar ativação ${ICONS.arrow}</button></div>`;
    }

    return `<h1>Revise antes de ativar.</h1><p>Confira os dados. Ao confirmar, esta configuração pública será encerrada e futuras mudanças exigirão login.</p><div class="activation-review"><div><span>Plaquinha</span><strong class="mono">${esc(plate.code)}</strong></div><div><span>Estabelecimento</span><strong>${esc(state.activation.companyName)}</strong></div><div><span>Destino</span><strong>${esc(destinationName(state.activation.selected))}</strong></div><div class="activation-review-url"><span>Link</span><strong>${esc(state.activation.value)}</strong></div></div><label class="activation-consent"><input id="activation-confirm" type="checkbox"><span>Entendo que a ativação inicial é única. Depois de concluir, alterações serão feitas pelo painel autenticado.</span></label><div class="row activation-actions"><button class="btn btn-ghost" data-action="activation-back">Voltar e revisar</button><button class="btn btn-primary" style="flex:1" data-action="activation-complete">Confirmar e ativar ${ICONS.check}</button></div>`;
  }

  function destinationChoices() {
    const items = [
      ['google','Avaliações Google','Leve o cliente direto para avaliar.'],
      ['whatsapp','WhatsApp','Abra uma conversa pronta.'],
      ['instagram','Instagram','Direcione para o perfil da empresa.'],
      ['smart','Site / Cardápio','Abra seu site, catálogo ou cardápio.'],
      ['map','Localização','Abra uma rota ou endereço no mapa.'],
      ['custom','Outro link','Use qualquer endereço HTTPS.']
    ];
    return items.map(([id,name,desc])=>`<button class="choice ${state.activation.selected===id?'active':''}" data-action="activation-choice" data-choice="${id}">${destinationIcon(id)}<strong>${name}</strong><span>${desc}</span></button>`).join('');
  }

  function destinationField(type) {
    const raw = esc(state.activation.rawValue || '');
    if (type === 'whatsapp') return `<div class="stack"><div class="field"><label>WhatsApp de destino</label><input id="activation-value" class="input" inputmode="tel" value="${raw}" placeholder="(27) 99999-9999"></div><div class="field"><label>Mensagem inicial <span class="text-muted">(opcional)</span></label><textarea id="activation-message" class="textarea" placeholder="Olá! Vim pela plaquinha...">${esc(state.activation.message || '')}</textarea></div></div>`;
    if (type === 'google') return `<div class="field"><label>Link de avaliação do Google</label><input id="activation-value" class="input" type="url" value="${raw}" placeholder="https://g.page/r/.../review"><span class="field-help">Cole o link HTTPS de avaliação do estabelecimento.</span></div>`;
    return `<div class="field"><label>${destinationName(type)}</label><input id="activation-value" class="input" type="url" value="${raw}" placeholder="https://"><span class="field-help">Informe um endereço HTTPS válido.</span></div>`;
  }

  function destinationName(type) {
    return ({ google:'Avaliações Google', whatsapp:'WhatsApp', instagram:'Instagram', smart:'Site / Cardápio', map:'Localização', custom:'Link personalizado' }[type] || 'Destino');
  }

  function userInitials() {
    const name=String(state.user?.name||'TAJO').trim();
    return name.split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase() || 'TJ';
  }

  function captureActivationAccount() {
    if (state.user) {
      state.activation.companyName = String($('#activation-company')?.value || state.activation.companyName || '').trim();
      state.activation.phone = String($('#activation-phone')?.value || state.activation.phone || '').trim();
      if (state.activation.companyName.length < 2) throw new Error('Informe o nome do estabelecimento.');
      return;
    }
    if (state.activation.accountMode === 'existing') throw new Error('Entre com sua conta antes de continuar.');
    state.activation.fullName = String($('#activation-name')?.value || '').trim();
    state.activation.companyName = String($('#activation-company')?.value || '').trim();
    state.activation.email = String($('#activation-email')?.value || '').trim().toLowerCase();
    state.activation.phone = String($('#activation-phone')?.value || '').trim();
    state.activation.password = String($('#activation-password')?.value || '');
    if (state.activation.fullName.length < 2) throw new Error('Informe seu nome.');
    if (state.activation.companyName.length < 2) throw new Error('Informe o nome do estabelecimento.');
    if (!/^\S+@\S+\.\S+$/.test(state.activation.email)) throw new Error('Informe um e-mail válido.');
    if (state.activation.password.length < 8) throw new Error('Crie uma senha com pelo menos 8 caracteres.');
  }

  function normalizeActivationDestination(rawInput, messageInput = '') {
    const raw = String(rawInput || '').trim();
    if (state.activation.selected === 'whatsapp') {
      const digits = raw.replace(/\D/g, '');
      if (digits.length < 10) throw new Error('Informe um WhatsApp válido.');
      const phone = digits.startsWith('55') ? digits : `55${digits}`;
      const message = String(messageInput || '').trim();
      return `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
    }
    try {
      const u = new URL(raw);
      if (u.protocol !== 'https:' || !u.hostname || u.username || u.password) throw new Error();
      return u.toString();
    } catch {
      throw new Error('Informe um endereço HTTPS válido.');
    }
  }

  function captureActivationDestination() {
    state.activation.pin = String($('#activation-pin')?.value || state.activation.pin || '').replace(/\D/g, '').slice(0, 6);
    state.activation.rawValue = String($('#activation-value')?.value || state.activation.rawValue || '').trim();
    state.activation.message = String($('#activation-message')?.value || state.activation.message || '').trim();
    if (!/^\d{6}$/.test(state.activation.pin)) throw new Error('Informe os seis números do PIN de ativação.');
    state.activation.value = normalizeActivationDestination(state.activation.rawValue, state.activation.message);
  }

  function showCreatedPlate(plate, activationCode) {
    const qrUrl = `https://${CONFIG.goDomain}${CONFIG.platePath}${plate.code}`;
    const nfcUrl = `https://${CONFIG.goDomain}${CONFIG.nfcPath || '/n/'}${plate.code}`;
    const activationUrl = `https://${CONFIG.goDomain}${CONFIG.activationPath || '/atv/'}${plate.code}`;
    showModal(`<div class="modal-head"><div><div class="eyebrow">Plaquinha criada</div><h2>${esc(plate.code)}</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><div class="modal-body stack"><div class="destination-option active"><div class="destination-icon">${ICONS.check}</div><div class="destination-copy"><strong>Pronta para produção</strong><span>O QR e o NFC são permanentes. Enquanto estiver pendente, ambos conduzem o cliente para a ativação.</span></div></div><div class="form-grid"><div class="field"><label>Link do QR Code</label><input class="input mono" readonly value="${esc(qrUrl)}"></div><div class="field"><label>Link do NFC</label><input class="input mono" readonly value="${esc(nfcUrl)}"></div></div><div class="form-grid"><div class="field"><label>Página de ativação</label><input class="input mono" readonly value="${esc(activationUrl)}"></div><div class="field"><label>PIN de ativação</label><input class="input mono activation-pin-output" readonly value="${esc(activationCode||'—')}"><span class="field-help">Entregue este PIN junto com a plaquinha. Ele é exibido somente na criação.</span></div></div><div class="qr-frame" style="width:220px;margin:auto"><canvas class="qr-canvas" data-qr="${esc(qrUrl)}" width="440" height="440"></canvas></div><div class="activation-notice"><strong>Fluxo:</strong> QR/NFC → <span class="mono">/atv/${esc(plate.code)}</span> enquanto pendente → destino final depois da ativação.</div></div><div class="modal-footer"><button class="btn btn-ghost" data-action="copy" data-copy="${esc(activationUrl)}">${ICONS.copy} Copiar ativação</button><button class="btn btn-ghost" data-action="copy" data-copy="${esc(nfcUrl)}">${ICONS.wifi} Copiar NFC</button><button class="btn btn-primary" data-action="close-modal">Concluir</button></div>`);
    renderQRCodes();
  }

  function newPlaqueModal() {
    const generated = generateCode();
    const qrUrl = `https://${CONFIG.goDomain}${CONFIG.platePath}${generated}`;
    const nfcUrl = `https://${CONFIG.goDomain}${CONFIG.nfcPath || '/n/'}${generated}`;
    const activationUrl = `https://${CONFIG.goDomain}${CONFIG.activationPath || '/atv/'}${generated}`;
    showModal(`
      <div class="modal-head"><div><div class="eyebrow">Produção</div><h2>Nova plaquinha</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal" aria-label="Fechar">${ICONS.close}</button></div>
      <form id="new-plaque-form"><div class="modal-body stack"><div class="form-grid"><div class="field"><label>Nome interno</label><input class="input" name="name" placeholder="Ex.: Balcão principal" required></div><div class="field"><label>Cliente <span class="text-muted">(opcional)</span></label><select class="select" name="client"><option value="">Será vinculado na ativação</option>${state.clients.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div></div><div class="form-grid"><div class="field"><label>Código gerado</label><input class="input mono" name="code" value="${generated}" readonly></div><div class="field"><label>Página de ativação</label><input class="input mono" value="${activationUrl}" readonly></div></div><div class="form-grid"><div class="field"><label>QR impresso</label><input class="input mono" value="${qrUrl}" readonly></div><div class="field"><label>NFC gravado</label><input class="input mono" value="${nfcUrl}" readonly></div></div><div class="card card-pad" style="box-shadow:none;background:var(--surface-2)"><div class="row-between mobile-stack"><div><strong>QR permanente TAJO TAP</strong><div class="text-muted" style="font-size:.8rem">Imprima este QR no acrílico. Ele não muda depois que o cliente ativa a plaquinha.</div></div><div class="qr-frame" style="width:180px;margin:0"><canvas class="qr-canvas" data-qr="${qrUrl}" width="360" height="360"></canvas></div></div></div><div class="activation-notice">Na primeira leitura, o motor envia automaticamente para <span class="mono">/atv/${generated}</span>. Depois da ativação, o mesmo QR redireciona ao destino do cliente.</div></div><div class="modal-footer"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-primary" type="submit">Criar plaquinha ${ICONS.arrow}</button></div></form>`, true);
    renderQRCodes();
  }

  function editDestinationModal(code) {
    const p=state.plaques.find(x=>x.code===code); if(!p) return;
    const current=p.destinationType||'google';
    showModal(`<div class="modal-head"><div><div class="eyebrow">${esc(code)}</div><h2>Alterar destino</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><form id="destination-form" data-code="${esc(code)}"><div class="modal-body"><p class="text-muted" style="margin-top:0">O QR Code e o NFC da plaquinha permanecem os mesmos.</p><div class="choice-grid" id="destination-choice-grid">${[['google','Avaliações Google'],['whatsapp','WhatsApp'],['instagram','Instagram'],['smart','Smart Page'],['map','Localização'],['custom','Outro link']].map(([id,n])=>`<button type="button" class="choice destination-modal-choice ${current===id?'active':''}" data-type="${id}">${destinationIcon(id)}<strong>${n}</strong><span>${id==='smart'?'Página inteligente TAJO':'Redirecionamento dinâmico'}</span></button>`).join('')}</div><input type="hidden" name="type" value="${current}"><div class="field"><label>Destino / configuração</label><input class="input" name="destination" value="${esc(p.destination)}" placeholder="https://..." required><span class="field-help">O backend valida o endereço antes de salvar. Use sempre um link HTTPS válido.</span></div></div><div class="modal-footer"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-primary">Salvar alteração</button></div></form>`);
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

  async function handleScannedValue(value) {
    const code=extractPlateCode(value); let p=state.plaques.find(x=>x.code===code);
    stopScanner(); closeModal();
    if(!p && state.role==='admin') {
      try { const out=await apiFetch(`/api/admin/plate?code=${encodeURIComponent(code)}`); p=out.plate; if(p) state.plaques.unshift(p); }
      catch(err) { if(err.status!==404) toast('Falha na consulta',err.message); }
    }
    if(p){ toast('Plaquinha encontrada',code); go(state.role==='admin'?'plaque/'+code:'portal'); }
    else { toast('Plaquinha não encontrada',code || 'Código inválido'); }
  }

  function bindPageEnhancements(r) {
    renderQRCodes();
    if(r.name==='plaques') {
      const input=$('#plaque-search'), filter=$('#plaque-filter');
      const update=()=>filterPlaques(input?.value||'',filter?.value||'all');
      input?.addEventListener('input',update); filter?.addEventListener('change',update);
    }
    if(r.name==='sales') {
      const input=$('#sales-search');
      input?.addEventListener('input',()=>filterSales(input.value));
    }
  }

  function filterPlaques(term,status) {
    const q=term.toLowerCase().trim();
    $$('#plaque-tbody tr').forEach(row=>{ const code=row.textContent.toLowerCase(); const p=state.plaques.find(x=>code.includes(x.code.toLowerCase())); row.hidden = !(!q||code.includes(q)) || !(status==='all'||p?.status===status); });
    $$('#plaque-mobile-list .mobile-card').forEach(card=>{ const txt=card.textContent.toLowerCase(); const p=state.plaques.find(x=>txt.includes(x.code.toLowerCase())); card.hidden=!(!q||txt.includes(q)) || !(status==='all'||p?.status===status); });
  }

  function filterSales(term) {
    const q=String(term||'').toLowerCase().trim();
    $$('[data-sales-search]').forEach(card => { card.hidden = Boolean(q && !String(card.dataset.salesSearch||'').includes(q)); });
  }

  function deletePlateModal(code) {
    const p = state.plaques.find(x=>x.code===code); if(!p) return;
    showModal(`<div class="modal-head"><div><div class="eyebrow">Ação irreversível</div><h2>Excluir ${esc(p.code)}?</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><div class="modal-body stack"><div class="danger-alert">${ICONS.trash}<div><strong>Esta exclusão é permanente.</strong><p>Serão removidos a plaquinha, PIN de ativação, destinos e eventos vinculados. Use principalmente para unidades criadas em testes.</p></div></div><div class="field"><label for="delete-plate-confirm">Digite <span class="mono">${esc(p.code)}</span> para confirmar</label><input id="delete-plate-confirm" class="input mono" autocomplete="off" placeholder="${esc(p.code)}"></div></div><div class="modal-footer"><button class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-danger" data-action="confirm-delete-plate" data-code="${esc(p.code)}">${ICONS.trash} Excluir definitivamente</button></div>`);
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

  document.addEventListener('click', async (e) => {
    const routeEl=e.target.closest('[data-route]');
    if(routeEl){ e.preventDefault(); go(routeEl.dataset.route); return; }
    const actionEl=e.target.closest('[data-action]'); if(!actionEl) return;
    const action=actionEl.dataset.action;
    if(action==='logout'||action==='portal-exit'){ try{await apiFetch('/api/auth/logout',{method:'POST'});}catch{} state.role=null;state.sessionRole=null;state.user=null;state.plaques=[];state.clients=[];go('login'); }
    if(action==='toggle-sidebar'){state.sidebarOpen=!state.sidebarOpen;render();}
    if(action==='close-sidebar'){state.sidebarOpen=false;render();}
    if(action==='theme'){setTheme(state.theme==='dark'?'light':'dark');render();}
    if(action==='notifications') toast('Tudo em dia','Nenhuma notificação crítica no momento.');
    if(action==='new-plaque') newPlaqueModal();
    if(action==='new-client') newClientModal();
    if(action==='open-scanner') openScannerModal();
    if(action==='close-modal') closeModal();
    if(action==='modal-backdrop' && e.target===actionEl) closeModal();
    if(action==='scanner-manual-go') handleScannedValue($('#scanner-manual')?.value||'');
    if(action==='copy') copyText(actionEl.dataset.copy||'');
    if(action==='download-qr') downloadQR(actionEl.dataset.code);
    if(action==='edit-destination') editDestinationModal(actionEl.dataset.code);
    if(action==='toggle-plate') { const p=state.plaques.find(x=>x.code===actionEl.dataset.code); if(p&&state.role==='admin'){ try{ const target=p.status==='paused'?'active':'paused'; const out=await apiFetch(`/api/admin/plate?code=${encodeURIComponent(p.code)}`,{method:'PATCH',body:{status:target}}); Object.assign(p,out.plate); toast('Status atualizado'); render(); }catch(err){ toast('Não foi possível atualizar',err.message); } } }
    if(action==='go-plaques') go('plaques');
    if(action==='go-analytics') go('analytics');
    if(action==='go-sales') go('sales');
    if(action==='copy-sales-script'){ const item=PLAYBOOK.scripts.find(x=>x.id===actionEl.dataset.scriptId); if(item) copyText(item.text); }
    if(action==='copy-objection'){ const item=PLAYBOOK.objections.find(x=>x.id===actionEl.dataset.objectionId); if(item) copyText(item.answer); }
    if(action==='sales-routine'){ copyText((PLAYBOOK.routine||[]).map((x,i)=>`${i+1}. ${x}`).join('\n')); }
    if(action==='delete-plate' && state.role==='admin') deletePlateModal(actionEl.dataset.code);
    if(action==='confirm-delete-plate' && state.role==='admin'){
      const code=actionEl.dataset.code; const confirmCode=String($('#delete-plate-confirm')?.value||'').trim().toUpperCase();
      if(confirmCode!==code){ toast('Confirmação incorreta',`Digite ${code} exatamente para excluir.`); return; }
      if(state.busy) return; state.busy=true; actionEl.disabled=true;
      try { await apiFetch(`/api/admin/plate?code=${encodeURIComponent(code)}`,{method:'DELETE',body:{confirmCode}}); state.plaques=state.plaques.filter(x=>x.code!==code); closeModal(); toast('Plaquinha excluída',`${code} foi removida do sistema.`); go('plaques'); }
      catch(err){ toast('Não foi possível excluir',err.message); actionEl.disabled=false; } finally { state.busy=false; }
    }
    if(action==='activation-home'){ go(state.role==='admin'?'dashboard':state.role==='client'?'portal':'login'); }
    if(action==='activation-retry'){ state.activation.loaded=false;state.activation.error='';state.activation.plate=null;render(); }
    if(action==='activation-account-mode'){ state.activation.accountMode=actionEl.dataset.mode==='existing'?'existing':'signup';render(); }
    if(action==='activation-choice'){
      state.activation.pin=String($('#activation-pin')?.value||state.activation.pin||'').replace(/\D/g,'').slice(0,6);
      state.activation.selected=actionEl.dataset.choice;
      state.activation.rawValue='';
      state.activation.value='';
      state.activation.message='';
      render();
    }
    if(action==='activation-next'){
      try {
        if(state.activation.step===2) captureActivationAccount();
        if(state.activation.step===3) captureActivationDestination();
        state.activation.step=Math.min(4,state.activation.step+1);
        render();
      } catch(err){ toast('Revise os dados',err.message); }
    }
    if(action==='activation-back'){ state.activation.step=Math.max(1,state.activation.step-1);render(); }
    if(action==='activation-complete'){
      if(state.busy) return;
      if(!$('#activation-confirm')?.checked){ toast('Confirmação necessária','Marque a confirmação antes de ativar.'); return; }
      state.busy=true; actionEl.disabled=true;
      try {
        const out=await apiFetch('/api/public/activate',{method:'POST',body:{
          code:state.activation.code,
          pin:state.activation.pin,
          mode:state.user?'existing':'signup',
          fullName:state.activation.fullName,
          companyName:state.activation.companyName,
          phone:state.activation.phone,
          email:state.activation.email,
          password:state.activation.password,
          type:state.activation.selected,
          url:state.activation.value
        }});
        state.activation.completed=true;
        state.activation.sessionReady=Boolean(out.sessionReady);
        state.activation.confirmationRequired=Boolean(out.emailConfirmationRequired);
        if(out.sessionReady){
          const session=await apiFetch('/api/auth/me');
          state.user=session.user||state.user;
          state.sessionRole=session.role||state.sessionRole;
          if(session.role==='admin'||session.role==='client'){state.role=session.role;await refreshRoleData();}
        }
        toast('Plaquinha ativada','O QR Code já está direcionando para o destino escolhido.');
        render();
      } catch(err) {
        if(err.code==='ACCOUNT_EXISTS'||err.code==='ACCOUNT_EXISTS_OR_INVALID'){ state.activation.accountMode='existing';state.activation.step=2; }
        if(['PIN_INVALID','PIN_LOCKED','PIN_EXPIRED','PIN_USED'].includes(err.code)){ state.activation.step=3; }
        toast('Não foi possível ativar',err.message);
        render();
      } finally { state.busy=false; }
    }
    if(action==='activation-finish'){ go(state.role==='admin'?'dashboard':state.role==='client'?'portal':'login'); }
  });

  document.addEventListener('submit', async (e) => {
    if(e.target.id==='login-form') { e.preventDefault(); if(!e.target.reportValidity()) return; const fd=new FormData(e.target); try{ const out=await apiFetch('/api/auth/login',{method:'POST',body:{email:fd.get('email'),password:fd.get('password')}}); state.role=out.role;state.sessionRole=out.role;state.user=out.user||null;await refreshRoleData(); const after=sessionStorage.getItem('tajoTapAfterLogin');sessionStorage.removeItem('tajoTapAfterLogin'); if(after) go(after); else go(state.role==='admin'?'dashboard':'portal'); }catch(err){toast('Não foi possível entrar',err.message);} }
    if(e.target.id==='activation-existing-login-form'){
      e.preventDefault(); if(!e.target.reportValidity()) return; const fd=new FormData(e.target);
      state.activation.email=String(fd.get('email')||'').trim().toLowerCase();
      state.activation.companyName=String(fd.get('company')||'').trim();
      state.activation.phone=String(fd.get('phone')||'').trim();
      if(state.activation.companyName.length<2){toast('Revise os dados','Informe o nome do estabelecimento.');return;}
      try {
        const out=await apiFetch('/api/public/activation-login',{method:'POST',body:{email:state.activation.email,password:fd.get('password')}});
        state.user=out.user||null;state.sessionRole=out.role||'unassigned';
        if(out.role==='admin'||out.role==='client'){state.role=out.role;await refreshRoleData();}
        toast('Conta conectada','Agora você pode continuar a ativação.');render();
      } catch(err){toast('Não foi possível entrar',err.message);}
    }
    if(e.target.id==='manual-scan-form'){e.preventDefault();handleScannedValue(new FormData(e.target).get('code'));}
    if(e.target.id==='new-plaque-form'){
      e.preventDefault(); if(!e.target.reportValidity()) return; const fd=new FormData(e.target);
      try { const out=await apiFetch('/api/admin/plates',{method:'POST',body:{name:fd.get('name'),clientId:fd.get('client')||null,code:fd.get('code')}}); state.plaques.unshift(out.plate); showCreatedPlate(out.plate,out.activationCode); toast('Plaquinha criada',out.plate.code); }
      catch(err){ toast('Não foi possível criar',err.message); }
    }
    if(e.target.id==='new-client-form'){
      e.preventDefault(); if(!e.target.reportValidity()) return; const fd=new FormData(e.target);
      try { const out=await apiFetch('/api/admin/clients',{method:'POST',body:{name:fd.get('name'),contact:fd.get('contact'),phone:fd.get('phone'),city:fd.get('city')}}); state.clients.unshift(out.client); closeModal(); toast('Cliente cadastrado',out.client.name); render(); }
      catch(err){ toast('Não foi possível cadastrar',err.message); }
    }
    if(e.target.id==='destination-form'){
      e.preventDefault(); if(!e.target.reportValidity()) return; const fd=new FormData(e.target), p=state.plaques.find(x=>x.code===e.target.dataset.code); if(!p) return;
      try { const endpoint=state.role==='admin'?'/api/admin/destination':'/api/client/destination'; const out=await apiFetch(endpoint,{method:'POST',body:{code:p.code,type:fd.get('type'),url:fd.get('destination')}}); Object.assign(p,out.plate); closeModal();toast('Destino atualizado','A plaquinha física continua a mesma.');render(); }
      catch(err){toast('Não foi possível alterar',err.message);}
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
  bootstrap();
})();
