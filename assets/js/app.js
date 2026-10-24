/* TAJO TAP Frontend + Backend V8
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
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M20 4 14 10"/></svg>',
    printer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M6 9V3h12v6"/><rect x="6" y="14" width="12" height="7" rx="1"/><path d="M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M18 12h.01"/></svg>'
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
    sellers: [],
    operators: [],
    adminSales: [],
    smartPages: [],
    batches: [],
    productionError: '',
    lastBatch: null,
    selectedPlateCodes: [],
    sellerData: { seller:null, metrics:{}, leads:[], sales:[], lots:[], messages:[] },
    operatorData: { operator:null, access:'', metrics:{}, clients:[], qrs:[], smartPages:[] },
    operations: { metrics:{}, decisions:[], details:{} },
    chatTimer: null,
    sidebarOpen: false,
    busy: false,
    activation: { step: 1, selected: 'google', code: '', value: '', rawValue: '', message: '', pin: '', plate: null, loading: false, loaded: false, error: '', accountMode: 'signup', fullName: '', companyName: '', phone: '', email: '', password: '', smartBusinessName: '', smartSlug: '', wifiSsid: '', wifiSecurity: 'WPA', wifiPassword: '', wifiHidden: false, wifiLabel: 'Wi-Fi do estabelecimento', wifiPayload: '', completed: false, sessionReady: false, confirmationRequired: false, access: null },
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
      error.reference = payload?.reference || null;
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
    const existingCodes = new Set(state.plaques.map((p) => p.code));
    state.selectedPlateCodes = (state.selectedPlateCodes || []).filter((code) => existingCodes.has(code));
  }

  async function loadClientData() {
    const result = await apiFetch('/api/client/plates');
    state.plaques = Array.isArray(result.plates) ? result.plates : [];
    state.clients = [];
  }

  async function loadSellerData() {
    const result = await apiFetch('/api/seller/hub');
    state.sellerData = { ...state.sellerData, ...result };
    state.plaques = []; state.clients = [];
  }

  async function loadOperatorData() {
    const result = await apiFetch('/api/operator/hub');
    state.operatorData = { ...state.operatorData, ...result };
    state.plaques = Array.isArray(result.qrs) ? result.qrs : [];
    state.clients = Array.isArray(result.clients) ? result.clients : [];
  }
  async function loadSmartPages() {
    try {
      const result = await apiFetch('/api/smart-pages');
      state.smartPages = Array.isArray(result.pages) ? result.pages : [];
    } catch (error) {
      console.warn('[smart-pages]', error);
      state.smartPages = [];
    }
  }
  async function loadSellersAdmin() {
    const result = await apiFetch('/api/admin/sellers');
    state.sellers = Array.isArray(result.sellers) ? result.sellers : [];
    state.adminSales = Array.isArray(result.sales) ? result.sales : [];
  }

  async function loadOperatorsAdmin() {
    const result = await apiFetch('/api/admin/operators');
    state.operators = Array.isArray(result.operators) ? result.operators : [];
  }
  async function loadProductionData() {
    try {
      const result = await apiFetch('/api/admin/batches');
      state.batches = Array.isArray(result.batches) ? result.batches : [];
      state.productionError = '';
    } catch (error) {
      state.batches = [];
      state.productionError = error.message || 'Não foi possível carregar os lotes.';
    }
  }
  async function loadOperations(){
    try { const result=await apiFetch('/api/admin/operations'); state.operations={metrics:result.metrics||{},decisions:result.decisions||[],details:result.details||{}}; }
    catch(error){ console.warn('[operations]',error); state.operations={metrics:{},decisions:[],details:{}}; }
  }
  async function refreshRoleData() {
    if (state.role === 'admin') return Promise.all([loadAdminData(), loadSellersAdmin(), loadOperatorsAdmin(), loadProductionData(), loadOperations(), loadSmartPages()]);
    if (state.role === 'client') return Promise.all([loadClientData(), loadSmartPages()]);
    if (state.role === 'seller') return Promise.all([loadSellerData(), loadSmartPages()]);
    if (state.role === 'operator') {
      if (state.operatorData.access && state.operatorData.access !== 'active') return Promise.resolve();
      return Promise.all([loadOperatorData(), loadSmartPages()]);
    }
  }

  async function bootstrap() {
    try {
      const session = await apiFetch('/api/auth/me');
      if (session.authenticated) {
        state.user = session.user || null;
        state.sessionRole = session.role || 'unassigned';
        if (session.role === 'admin' || session.role === 'client' || session.role === 'seller' || session.role === 'operator') {
          state.role = session.role;
          if (session.role === 'operator') state.operatorData = { ...state.operatorData, operator: session.operator || null, access: session.operatorAccess || '' };
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
    if (state.role === 'seller') return renderSellerApp(r);
    if (state.role === 'operator') return renderOperatorApp(r);
    if (r.name === 'portal') return go('dashboard');
    app.innerHTML = shell(renderPage(r), r.name);
    bindPageEnhancements(r);
    if(r.name==='team-chat') startChatPolling(); else stopChatPolling();
  }

  function renderLoading() {
    app.innerHTML = `<main class="auth-shell"><section class="auth-brand" aria-label="TAJO TAP BUSINESS"><img class="auth-brand-logo" src="assets/images/tajo-tap-logo.png" alt="TAJO TAP BUSINESS"><div class="auth-copy"><div class="auth-kicker">Conectando</div><h1>Preparando sua central.</h1><p>Validando sua sessão e sincronizando as plaquinhas com o backend TAJO TAP.</p></div></section><section class="auth-panel"><div class="auth-card"><div class="eyebrow">Aguarde</div><h2>Carregando dados...</h2><p>A conexão segura com o Supabase está sendo verificada.</p></div></section></main>`;
  }

  function renderLogin() {
    app.innerHTML = `
      <main class="auth-shell">
        <section class="auth-brand" aria-label="TAJO TAP BUSINESS">
          <img class="auth-brand-logo" src="assets/images/tajo-tap-logo.png" alt="TAJO TAP BUSINESS">
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
            <img class="auth-mobile-logo" src="assets/images/tajo-tap-logo.png" alt="TAJO TAP BUSINESS">
            <div class="eyebrow">Acesso seguro</div>
            <h2>Bem-vindo ao TAJO TAP BUSINESS</h2>
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
      ['production','printer','Produção'],
      ['scanner','scan','Escanear'],
      ['clients','clients','Clientes'],
      ['smart-pages','globe','Smart Pages'],
      ['analytics','analytics','Analytics'],
      ['sales','sales','Vendas'],
      ['sellers','clients','Vendedores'],
      ['operators','clients','Operadores BUSINESS'],
      ['team-chat','bell','Chat da equipe'],
      ['settings','settings','Configurações']
    ];
    const navHtml = nav.map(([path, icon, label]) => `<a class="nav-item ${active === path || (active === 'plaque' && path === 'plaques') ? 'active':''}" href="#/${path}">${ICONS[icon]}<span>${label}</span></a>`).join('');
    return `
      <div class="app-shell">
        <aside class="sidebar ${state.sidebarOpen ? 'open':''}" id="sidebar">
          <div class="sidebar-logo"><img src="assets/images/tajo-tap-logo.png" alt="TAJO TAP BUSINESS"></div>
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
            <a class="mobile-brand" href="#/dashboard"><img src="assets/images/tajo-tap-logo.png" alt="TAJO TAP BUSINESS"></a>
            <div class="topbar-title"><strong>Central TAJO TAP BUSINESS</strong><span>Controle seus pontos de contato</span></div>
            <div class="topbar-search input-with-icon">${ICONS.search}<input class="input" id="global-search" placeholder="Buscar placa, cliente ou código" aria-label="Busca global"></div>
            <div class="topbar-actions">
              <button class="btn btn-ghost" data-action="open-scanner">${ICONS.scan}<span class="scan-label">Escanear</span></button>
              <button class="btn btn-icon btn-ghost" data-action="theme" aria-label="Alternar tema">${state.theme === 'dark' ? ICONS.sun : ICONS.moon}</button>
              <button class="btn btn-icon btn-ghost" data-action="notifications" aria-label="Notificações">${ICONS.bell}</button>
            </div>
          </header>
          <main class="content">${content}<footer class="system-credit">Sistema desenvolvido por <strong>João Paulo Brandão</strong></footer></main>
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

  function brl(cents){ return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(cents||0)/100); }
  const PROD_LABELS={generated:'Gerada',sent_to_print:'Enviada para impressão',produced:'Produzida',in_stock:'Em estoque',sold:'Vendida',delivered:'Entregue',activated:'Ativada',cancelled:'Cancelada'};
  function productionLabel(stage){ return PROD_LABELS[stage]||stage||'Gerada'; }
  function productionBadge(stage){ const cls=stage==='activated'?'badge-success':stage==='in_stock'?'badge-success':['sold','delivered'].includes(stage)?'badge-warning':'badge-muted'; return `<span class="badge ${cls}">${esc(productionLabel(stage).toUpperCase())}</span>`; }

  function sellerShell(content, active){
    const nav=[['seller-dashboard','dashboard','Visão geral'],['seller-lots','printer','Meus lotes'],['seller-smart','globe','Smart Pages'],['seller-leads','target','Meus leads'],['seller-sales','sales','Minhas vendas'],['sales','sales','Playbook'],['team-chat','bell','Chat da equipe'],['seller-settings','settings','Minha conta']];
    const navHtml=nav.map(([path,icon,label])=>`<a class="nav-item ${active===path?'active':''}" href="#/${path}">${ICONS[icon]}<span>${label}</span></a>`).join('');
    return `<div class="app-shell seller-shell"><aside class="sidebar ${state.sidebarOpen?'open':''}"><div class="sidebar-logo"><img src="assets/images/tajo-tap-logo.png" alt="TAJO TAP BUSINESS"></div><div class="sidebar-context"><img class="context-mark" src="assets/images/tajo-tap-mark.png" alt=""><div class="context-copy"><strong>TAJO TAP</strong><span>Equipe comercial</span></div></div><nav class="nav-group"><div class="nav-label">Meu trabalho</div>${navHtml}</nav><div class="sidebar-spacer"></div><div class="sidebar-user"><div class="avatar">${esc(userInitials())}</div><div class="meta"><strong>${esc(state.sellerData.seller?.full_name||state.user?.name||'Vendedor')}</strong><span>Vendedor TAJO</span></div></div><button class="sidebar-logout" data-action="logout">${ICONS.logout}<span>Sair da conta</span></button></aside><div class="drawer-backdrop ${state.sidebarOpen?'show':''}" data-action="close-sidebar"></div><div class="app-main"><header class="topbar"><button class="btn btn-icon btn-ghost mobile-menu-btn" data-action="toggle-sidebar">${ICONS.menu}</button><a class="mobile-brand" href="#/seller-dashboard"><img src="assets/images/tajo-tap-logo.png" alt="TAJO TAP BUSINESS"></a><div class="topbar-title"><strong>Central Comercial</strong><span>Seus dados, suas vendas, sua evolução</span></div><div class="topbar-actions"><button class="btn btn-icon btn-ghost" data-action="theme">${state.theme==='dark'?ICONS.sun:ICONS.moon}</button></div></header><main class="content">${content}<footer class="system-credit">Sistema desenvolvido por <strong>João Paulo Brandão</strong></footer></main></div><nav class="mobile-bottom-nav"><a class="${active==='seller-dashboard'?'active':''}" href="#/seller-dashboard">${ICONS.dashboard}<span>Início</span></a><a class="${active==='seller-lots'?'active':''}" href="#/seller-lots">${ICONS.printer}<span>Lotes</span></a><a class="${active==='seller-leads'?'active':''}" href="#/seller-leads">${ICONS.target}<span>Leads</span></a><a class="${active==='seller-sales'?'active':''}" href="#/seller-sales">${ICONS.sales}<span>Vendas</span></a><a class="${active==='team-chat'?'active':''}" href="#/team-chat">${ICONS.bell}<span>Chat</span></a></nav></div>`;
  }

  function renderSellerApp(r){
    const allowed=new Set(['seller-dashboard','seller-lots','seller-smart','seller-leads','seller-sales','sales','team-chat','seller-settings']);
    if(!allowed.has(r.name)) return go('seller-dashboard');
    const content=r.name==='seller-dashboard'?sellerDashboardPage():r.name==='seller-lots'?sellerLotsPage():r.name==='seller-smart'?smartPagesPage('Vendedor'):r.name==='seller-leads'?sellerLeadsPage():r.name==='seller-sales'?sellerSalesPage():r.name==='sales'?salesPage():r.name==='team-chat'?teamChatPage():sellerSettingsPage();
    app.innerHTML=sellerShell(content,r.name); bindPageEnhancements(r); if(r.name==='team-chat') startChatPolling(); else stopChatPolling();
  }
  function sellerDashboardPage(){
    const m=state.sellerData.metrics||{}, rate=state.sellerData.seller?.commission_rate||0;
    const decisions=[
      {n:m.inventory||0,t:'Plaquinhas em estoque',x:'Unidades dos seus lotes disponíveis para venda.',r:'seller-lots'},
      {n:m.pending_sales||0,t:'Vendas aguardando aprovação',x:'A administração ainda precisa validar o pagamento.',r:'seller-sales'},
      {n:m.stale_leads||0,t:'Leads sem contato há 3+ dias',x:'Retome o follow-up antes de perder o timing.',r:'seller-leads'},
      {n:m.delivered||0,t:'Plaquinhas entregues',x:'Acompanhe quais clientes ainda precisam ativar.',r:'seller-lots'}
    ];
    return `${pageHead('Painel do vendedor','Seu estoque, suas vendas, suas decisões.','Você enxerga somente os lotes vinculados à sua conta, seus leads, suas vendas e suas comissões. Você não pode criar plaquinhas.',`<a class="btn btn-primary" href="#/seller-lots">${ICONS.printer} Meus lotes</a>`)}
      <section class="metric-grid">${metric('Meus lotes',m.lots||0,`${m.inventory||0} unidades em estoque`,'printer')}${metric('Vendas registradas',m.sales||0,`${m.pending_sales||0} aguardando aprovação`,'sales')}${metric('Vendas pagas',brl(m.revenue_cents),'Somente suas vendas','analytics')}${metric('Minha comissão',brl(m.commission_cents),`${rate}% configurado pela TAJO`,'star')}</section>
      <section class="ops-decision-grid seller-decision-grid">${decisions.map(d=>`<button class="card decision-card" data-route="${d.r}"><span class="decision-count">${d.n}</span><span><strong>${esc(d.t)}</strong><small>${esc(d.x)}</small></span>${ICONS.chevron}</button>`).join('')}</section>
      <section class="dashboard-grid"><div class="card card-pad"><div class="card-title"><div><h2>Pipeline recente</h2><p>Continue de onde parou.</p></div><a class="btn btn-sm btn-ghost" href="#/seller-leads">Ver leads</a></div>${(state.sellerData.leads||[]).slice(0,6).map(l=>`<div class="row-between seller-row"><div><strong>${esc(l.business_name)}</strong><div class="text-muted">${esc(l.city||l.niche||'Sem local informado')}</div></div><span class="badge">${esc(l.status)}</span></div>`).join('')||'<div class="empty-state">Nenhum lead cadastrado ainda.</div>'}</div><div class="card card-pad"><div class="card-title"><div><h2>Atalhos comerciais</h2><p>Venda a partir do estoque que a TAJO vinculou a você.</p></div></div><div class="quick-actions">${quick('Abrir meus lotes','Veja PIN, estoque e status de cada unidade.','printer','go-seller-lots')}${quick('Cadastrar lead','Registre a oportunidade antes de abordar.','target','new-seller-lead')}${quick('Registrar venda','Selecione uma unidade em estoque do seu lote.','sales','new-seller-sale')}${quick('Chat da equipe','Troque aprendizados com a equipe.','bell','go-team-chat')}</div></div></section>`;
  }

  function sellerLotsPage(){
    const lots=state.sellerData.lots||[];
    const cards=lots.map(l=>{
      const plates=l.plates||[], inv=plates.filter(p=>p.productionStatus==='in_stock').length, sold=plates.filter(p=>p.productionStatus==='sold').length, delivered=plates.filter(p=>p.productionStatus==='delivered').length, active=plates.filter(p=>p.productionStatus==='activated').length;
      const rows=plates.map(p=>{
        const smart=(state.smartPages||[]).find(x=>x.plateId===p.id);
        return `<tr><td><strong class="mono">${esc(p.code)}</strong><small>#${String(p.position||'').padStart(3,'0')}</small></td><td>${p.activationPin?`<span class="pin-inline"><strong class="mono">${esc(p.activationPin)}</strong><button class="icon-mini" data-action="copy" data-copy="${esc(p.activationPin)}">${ICONS.copy}</button></span>`:'—'}</td><td>${productionBadge(p.productionStatus)}</td><td><div class="row wrap">${p.activationPin?`<button class="btn btn-xs btn-ghost" data-action="copy" data-copy="${esc(`https://${CONFIG.goDomain}${CONFIG.activationPath}${p.code}
PIN: ${p.activationPin}`)}">Copiar ativação</button>`:''}<button class="btn btn-xs btn-ghost" data-action="seller-destination" data-code="${esc(p.code)}" data-smart="${esc(smart?.publicUrl||'')}">Destino</button>${smart?`<button class="btn btn-xs btn-ghost" data-action="edit-smart-page" data-id="${esc(smart.id)}">Smart Page</button>`:''}${p.productionStatus==='sold'?`<button class="btn btn-xs btn-primary" data-action="seller-deliver-plate" data-code="${esc(p.code)}">Marcar entregue</button>`:''}</div></td></tr>`;
      }).join('');
      return `<article class="card seller-lot-card"><div class="card-pad"><div class="row-between"><div><div class="eyebrow">${esc(l.code)}</div><h2>${esc(l.label)}</h2><p>${esc(l.model)} · ${l.widthCm} × ${l.heightCm} cm · ${l.quantity} unidades</p></div>${productionBadge(l.productionStatus)}</div><div class="lot-metrics"><span><b>${inv}</b>Em estoque</span><span><b>${sold}</b>Vendidas</span><span><b>${delivered}</b>Entregues</span><span><b>${active}</b>Ativadas</span></div><div class="activation-notice"><strong>Regra do vendedor:</strong> você pode usar somente as plaquinhas deste lote. Novas plaquinhas são criadas exclusivamente pela administração TAJO.</div></div><div class="responsive-table"><table><thead><tr><th>Plaquinha</th><th>PIN</th><th>Status físico</th><th>Ação</th></tr></thead><tbody>${rows||'<tr><td colspan="4">Nenhuma unidade neste lote.</td></tr>'}</tbody></table></div></article>`;
    }).join('');
    return `${pageHead('Distribuição','Meus lotes','Lotes comprados/vinculados à sua conta. Estoque, PINs e andamento das unidades ficam isolados dos demais vendedores.')}<section class="seller-lots-stack">${cards||'<div class="card card-pad"><h2>Nenhum lote vinculado</h2><p>A administração TAJO ainda não direcionou um lote para o seu e-mail de login.</p></div>'}</section>`;
  }

  function smartPageById(id){ return (state.smartPages||[]).find(p=>p.id===id)||null; }
  function smartPagesPage(context='Admin'){
    const pages=state.smartPages||[];
    const cards=pages.map(p=>`<article class="card smart-admin-card"><div class="smart-admin-cover" style="--smart:${esc(p.primaryColor||'#45E600')};background:${esc(p.backgroundColor||'#0B0D0E')}"><span>${ICONS.globe}</span><strong>${esc(p.businessName)}</strong><small>/bio/${esc(p.slug)}</small>${p.wifiMode&&p.wifiMode!=='off'?`<em class="smart-wifi-chip">${ICONS.wifi} ${p.wifiMode==='hybrid'?'Smart + Wi-Fi':'Wi-Fi Connect'}</em>`:''}</div><div class="card-pad"><div class="row-between"><div><div class="eyebrow">${p.isPublished?'PUBLICADA':'RASCUNHO'}</div><h3>${esc(p.businessName)}</h3></div><span class="badge ${p.isPublished?'badge-success':'badge-muted'}">${p.isPublished?'ONLINE':'OFF'}</span></div><div class="smart-stats"><span><b>${formatNumber(p.analytics?.views30d||0)}</b>Visualizações 30d</span><span><b>${formatNumber(p.analytics?.clicks30d||0)}</b>Cliques 30d</span></div><div class="row wrap"><button class="btn btn-primary btn-sm" data-action="edit-smart-page" data-id="${esc(p.id)}">${ICONS.edit} Editar</button><button class="btn btn-ghost btn-sm" data-action="copy" data-copy="${esc(p.publicUrl)}">${ICONS.copy} Copiar URL</button><a class="btn btn-ghost btn-sm" href="${esc(p.publicUrl)}" target="_blank" rel="noopener">Abrir ↗</a></div></div></article>`).join('');
    const intro=context==='Vendedor'?'Edite apenas as Smart Pages ligadas às suas plaquinhas e clientes. Outros vendedores não aparecem aqui.':context==='Operador'?'Crie e personalize bio-sites para os clientes da sua própria operação.':'Visualize e edite todas as Smart Pages da operação TAJO TAP.';
    const actions=context==='Operador'?`<button class="btn btn-primary" data-action="operator-new-smart">${ICONS.plus} Criar bio-site</button>`:'';
    const empty=context==='Operador'?'Crie um QR e depois vincule um bio-site profissional ao cliente.':'Ao registrar uma venda com e-mail do cliente, a Smart Page é criada automaticamente e vinculada à plaquinha.';
    return `${pageHead('TAJO Smart Page','Páginas inteligentes dos clientes',intro,actions)}<section class="smart-admin-grid">${cards||`<div class="card card-pad"><h2>Nenhuma Smart Page ainda</h2><p>${empty}</p></div>`}</section>`;
  }

  function linesFromServices(items){ return (items||[]).map(x=>typeof x==='string'?x:`${x.label||''}${x.description?` | ${x.description}`:''}`).join('\n'); }
  function linesFromLinks(items){ return (items||[]).map(x=>`${x.label||''}${x.url?` | ${x.url}`:''}${x.description?` | ${x.description}`:''}`).join('\n'); }
  function parseServices(value){ return String(value||'').split(/\n+/).map(x=>x.trim()).filter(Boolean).slice(0,12).map(line=>{const [label,...rest]=line.split('|');return {label:label.trim(),description:rest.join('|').trim()};}); }
  function parseLinks(value){ return String(value||'').split(/\n+/).map(x=>x.trim()).filter(Boolean).slice(0,12).map(line=>{const parts=line.split('|').map(x=>x.trim());const label=parts.shift()||'';const url=parts.shift()||'';const description=parts.join(' | ').trim();return {label,url,...(description?{description}:{})};}).filter(x=>x.label&&/^https:\/\//i.test(x.url)); }

  function smartPageModal(id){
    const p=smartPageById(id); if(!p)return toast('Smart Page não encontrada');
    const wifiMode=p.wifiMode||'off';
    showModal(`<div class="modal-head"><div><div class="eyebrow">TAJO SMART PAGE · V10.1</div><h2>${esc(p.businessName)}</h2><p class="text-muted">${esc(p.publicUrl)}</p></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><form id="smart-page-form" data-id="${esc(p.id)}"><div class="modal-body smart-editor-grid"><section class="stack"><div class="editor-section-title"><strong>Identidade</strong><span>O que o visitante vê primeiro.</span></div><div class="field"><label>Nome do negócio</label><input class="input" name="business_name" maxlength="120" required value="${esc(p.businessName)}"></div><div class="field"><label>Endereço público</label><div class="input-prefix"><span>/bio/</span><input class="input" name="slug" value="${esc(p.slug)}" pattern="[a-z0-9-]{3,63}" required></div></div><div class="field"><label>Subtítulo</label><input class="input" name="subtitle" maxlength="320" value="${esc(p.subtitle)}"></div><div class="field"><label>Descrição</label><textarea class="input" name="bio" rows="4" maxlength="1200">${esc(p.bio)}</textarea></div><div class="form-grid"><div class="field"><label>Logo (URL HTTPS)</label><input class="input" name="logo_url" value="${esc(p.logoUrl)}" placeholder="https://..."></div><div class="field"><label>Capa (URL HTTPS)</label><input class="input" name="cover_url" value="${esc(p.coverUrl)}" placeholder="https://..."></div></div><div class="form-grid smart-color-grid"><div class="field"><label>Cor principal</label><input class="input color-input" type="color" name="primary_color" value="${esc(p.primaryColor)}"></div><div class="field"><label>Fundo</label><input class="input color-input" type="color" name="background_color" value="${esc(p.backgroundColor)}"></div><div class="field"><label>Texto</label><input class="input color-input" type="color" name="text_color" value="${esc(p.textColor)}"></div></div><div class="field"><label>Estilo dos botões</label><select class="select" name="button_style"><option value="rounded" ${p.buttonStyle==='rounded'?'selected':''}>Moderno arredondado</option><option value="pill" ${p.buttonStyle==='pill'?'selected':''}>Pílula</option><option value="square" ${p.buttonStyle==='square'?'selected':''}>Quadrado</option></select></div><div class="editor-section-title"><strong>Wi-Fi Connect</strong><span>Conexão Wi-Fi assistida pelo celular, mantendo o QR principal dinâmico.</span></div><div class="field"><label>Modo Wi-Fi</label><select class="select" name="wifi_mode"><option value="off" ${wifiMode==='off'?'selected':''}>Desativado</option><option value="wifi" ${wifiMode==='wifi'?'selected':''}>Página focada em Wi-Fi</option><option value="hybrid" ${wifiMode==='hybrid'?'selected':''}>Smart Page + Wi-Fi (recomendado)</option></select></div><div class="form-grid"><div class="field"><label>Nome da rede (SSID)</label><input class="input" name="wifi_ssid" maxlength="32" value="${esc(p.wifiSsid||'')}"></div><div class="field"><label>Segurança</label><select class="select" name="wifi_security"><option value="WPA" ${p.wifiSecurity==='WPA'?'selected':''}>WPA / WPA2 / WPA3</option><option value="WEP" ${p.wifiSecurity==='WEP'?'selected':''}>WEP</option><option value="nopass" ${p.wifiSecurity==='nopass'?'selected':''}>Rede aberta</option></select></div></div><div class="form-grid"><div class="field"><label>Senha do Wi-Fi</label><input class="input" type="password" name="wifi_password" value="${esc(p.wifiPassword||'')}" autocomplete="new-password"><span class="field-help">A V10 cifra a senha antes de gravar no Supabase. Para redes WPA, use 8 a 63 caracteres.</span></div><div class="field"><label>Nome exibido</label><input class="input" name="wifi_label" maxlength="80" value="${esc(p.wifiLabel||'Wi-Fi do estabelecimento')}"></div></div><div class="form-grid"><label class="check-line"><input type="checkbox" name="wifi_hidden" ${p.wifiHidden?'checked':''}> Rede oculta</label><label class="check-line"><input type="checkbox" name="wifi_public_enabled" ${p.wifiPublicEnabled?'checked':''}> Mostrar Wi-Fi na página</label></div></section><section class="stack"><div class="editor-section-title"><strong>Links e contato</strong><span>Os principais atalhos do cliente.</span></div><div class="form-grid"><div class="field"><label>WhatsApp</label><input class="input" name="whatsapp" value="${esc(p.whatsapp)}"></div><div class="field"><label>Telefone</label><input class="input" name="phone" value="${esc(p.phone)}"></div><div class="field"><label>Instagram</label><input class="input" name="instagram" value="${esc(p.instagram)}"></div><div class="field"><label>TikTok</label><input class="input" name="tiktok" value="${esc(p.tiktok)}"></div><div class="field"><label>E-mail público</label><input class="input" type="email" name="public_email" value="${esc(p.publicEmail)}"></div><div class="field"><label>Site</label><input class="input" name="website_url" value="${esc(p.websiteUrl)}"></div><div class="field"><label>Localização</label><input class="input" name="maps_url" value="${esc(p.mapsUrl)}"></div><div class="field"><label>Avaliação Google</label><input class="input" name="google_review_url" value="${esc(p.googleReviewUrl)}"></div></div><div class="form-grid"><div class="field"><label>Chave Pix</label><input class="input" name="pix_key" value="${esc(p.pixKey)}"></div><div class="field"><label>Horário</label><input class="input" name="opening_hours" value="${esc(p.openingHours)}"></div></div><div class="field"><label>Endereço</label><input class="input" name="address" value="${esc(p.address)}"></div><div class="field"><label>Serviços — Nome | Descrição</label><textarea class="input" rows="5" name="services" placeholder="Revisão completa | Freios, suspensão e alinhamento">${esc(linesFromServices(p.services))}</textarea><span class="field-help">Os primeiros serviços viram chips no topo e a lista completa aparece mais abaixo na Smart Page.</span></div><div class="field"><label>Links extras — Rótulo | URL | Descrição</label><textarea class="input" rows="5" name="custom_links" placeholder="Ver catálogo | https://... | Conheça nossa coleção">${esc(linesFromLinks(p.customLinks))}</textarea><span class="field-help">Na V10, a descrição aparece abaixo do título do botão. Ex.: Ver catálogo | https://... | Conheça nossa coleção.</span></div><label class="check-line"><input type="checkbox" name="is_published" ${p.isPublished?'checked':''}> Página publicada</label>${state.role==='admin'?`<label class="check-line"><input type="checkbox" name="seller_edit_allowed" ${p.sellerEditAllowed?'checked':''}> Permitir que o vendedor responsável edite esta Smart Page</label>`:''}</section></div><div class="modal-footer smart-editor-footer"><a class="btn btn-ghost" href="${esc(p.publicUrl)}" target="_blank" rel="noopener">Pré-visualizar ↗</a><button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-primary">Salvar Smart Page</button></div></form>`,true);
    renderQRCodes();
  }

  function destinationEditorValue(type, url='') {
    const raw=String(url||'').trim();
    if(type==='instagram') return raw.replace(/^https?:\/\/(www\.)?instagram\.com\//i,'').replace(/^@+/,'').replace(/\/+$/,'');
    if(type==='whatsapp') {
      try { const u=new URL(raw); if(['wa.me','api.whatsapp.com','whatsapp.com','www.whatsapp.com'].includes(u.hostname.toLowerCase())) return u.pathname.replace(/\D/g,''); } catch {}
      return raw;
    }
    return raw;
  }

  function smartPageForPlateCode(code) {
    const adminPlate=(state.plaques||[]).find(x=>x.code===code);
    if(adminPlate?.id){ const found=(state.smartPages||[]).find(x=>x.plateId===adminPlate.id); if(found)return found; }
    const sellerPlate=(state.sellerData.lots||[]).flatMap(l=>l.plates||[]).find(x=>x.code===code);
    if(sellerPlate?.id){ const found=(state.smartPages||[]).find(x=>x.plateId===sellerPlate.id); if(found)return found; }
    return null;
  }

  function destinationEditFields(type,{currentType='',currentUrl='',smartUrl=''}={}) {
    const initial=currentType===type ? destinationEditorValue(type,currentUrl) : '';
    if(type==='smart') {
      const value=smartUrl || (currentType==='smart' ? currentUrl : '');
      if(!value) return `<div class="activation-notice"><strong>Nenhuma Smart Page vinculada.</strong> Crie ou vincule a Smart Page deste cliente antes de selecionar este destino.</div><input type="hidden" name="destination" value="">`;
      return `<div class="destination-option active"><div class="destination-icon">${ICONS.globe}</div><div class="destination-copy"><strong>TAJO Smart Page</strong><span>${esc(value)}</span></div></div><input type="hidden" name="destination" value="${esc(value)}"><span class="field-help">A Smart Page continua existindo mesmo quando você usa outro destino. Você pode voltar para ela quando quiser.</span>`;
    }
    if(type==='instagram') return `<div class="field"><label>Instagram</label><div class="input-prefix"><span>@</span><input class="input" name="destination" value="${esc(initial)}" placeholder="nomedoperfil" autocomplete="off" required></div><span class="field-help">Digite apenas o @ ou o nome do perfil. O TAJO TAP cria o link automaticamente.</span></div>`;
    if(type==='whatsapp') return `<div class="stack"><div class="field"><label>WhatsApp</label><input class="input" name="destination" inputmode="tel" value="${esc(initial)}" placeholder="(27) 99999-9999" required><span class="field-help">Pode informar apenas o número com DDD.</span></div><div class="field"><label>Mensagem inicial <span class="text-muted">(opcional)</span></label><textarea class="input" name="message" rows="2" placeholder="Olá! Vim pela TAJO TAP..."></textarea></div></div>`;
    if(type==='map') return `<div class="field"><label>Localização</label><input class="input" name="destination" value="${esc(initial)}" placeholder="Rua, número, cidade ou link do Google Maps" required><span class="field-help">Se informar um endereço, o sistema monta o link do Google Maps automaticamente.</span></div>`;
    if(type==='google') return `<div class="field"><label>Link de avaliação do Google</label><input class="input" type="url" name="destination" value="${esc(initial)}" placeholder="https://g.page/r/.../review" required><span class="field-help">Cole o link HTTPS de avaliação do estabelecimento.</span></div>`;
    return `<div class="field"><label>Link personalizado</label><input class="input" type="url" name="destination" value="${esc(initial)}" placeholder="https://" required><span class="field-help">Use um endereço HTTPS válido.</span></div>`;
  }

  function refreshDestinationFields(form,type){
    if(!form)return;
    const holder=$('[data-destination-fields]',form); if(!holder)return;
    const currentType=form.dataset.currentType||'';
    const currentUrl=form.dataset.currentUrl||'';
    const smartUrl=form.dataset.smartUrl||'';
    holder.innerHTML=destinationEditFields(type,{currentType,currentUrl,smartUrl});
  }

  function sellerDestinationModal(code, smartUrlValue=''){
    const smart=smartPageForPlateCode(code);
    const smartUrl=smart?.publicUrl||smartUrlValue||'';
    const currentType=smartUrl?'smart':'custom';
    const currentUrl=smartUrl;
    showModal(`<div class="modal-head"><div><div class="eyebrow">${esc(code)}</div><h2>Direcionamento da plaquinha</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><form id="seller-destination-form" data-code="${esc(code)}" data-current-type="${esc(currentType)}" data-current-url="${esc(currentUrl)}" data-smart-url="${esc(smartUrl)}"><div class="modal-body stack"><div class="activation-notice"><strong>O QR físico permanece o mesmo.</strong> Você pode trocar o destino quantas vezes precisar dentro das plaquinhas dos seus lotes.</div><div class="choice-grid destination-edit-grid">${[['smart','Smart Page'],['google','Google'],['whatsapp','WhatsApp'],['instagram','Instagram'],['map','Localização'],['custom','Outro link']].map(([id,n])=>`<button type="button" class="choice destination-modal-choice ${currentType===id?'active':''}" data-type="${id}">${destinationIcon(id)}<strong>${n}</strong><span>${id==='smart'?'Voltar para o biosite':'Alterar redirecionamento'}</span></button>`).join('')}</div><input type="hidden" name="type" value="${esc(currentType)}"><div class="stack" data-destination-fields>${destinationEditFields(currentType,{currentType,currentUrl,smartUrl})}</div></div><div class="modal-footer"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-primary">Salvar destino</button></div></form>`);
  }

  function sellerLeadsPage(){ const leads=state.sellerData.leads||[]; return `${pageHead('CRM individual','Meus leads','Somente você e a administração TAJO podem visualizar sua carteira.',`<button class="btn btn-primary" data-action="new-seller-lead">${ICONS.plus} Novo lead</button>`)}<div class="card table-card"><div class="responsive-table"><table><thead><tr><th>Negócio</th><th>Contato</th><th>Cidade</th><th>Status</th><th>Próximo contato</th></tr></thead><tbody>${leads.map(l=>`<tr><td><strong>${esc(l.business_name)}</strong><small>${esc(l.niche||'')}</small></td><td>${esc(l.contact_name||'—')}<small>${esc(l.phone||'')}</small></td><td>${esc(l.city||'—')}</td><td><select class="select seller-lead-status" data-id="${esc(l.id)}">${['novo','contatado','respondeu','negociacao','proposta','fechado','perdido'].map(x=>`<option ${l.status===x?'selected':''} value="${x}">${x}</option>`).join('')}</select></td><td>${l.next_contact_at?new Date(l.next_contact_at).toLocaleString('pt-BR'):'—'}</td></tr>`).join('')||'<tr><td colspan="5">Nenhum lead cadastrado.</td></tr>'}</tbody></table></div></div>`; }
  function sellerSalesPage(){ const sales=state.sellerData.sales||[]; return `${pageHead('Resultados individuais','Minhas vendas','Cada venda usa uma plaquinha do seu estoque e vincula o cliente pelo e-mail informado.',`<button class="btn btn-primary" data-action="new-seller-sale">${ICONS.plus} Registrar venda</button>`)}<div class="card table-card"><div class="responsive-table"><table><thead><tr><th>Cliente</th><th>E-mail / painel</th><th>Venda</th><th>Comissão</th><th>Status</th><th>Data</th></tr></thead><tbody>${sales.map(x=>`<tr><td><strong>${esc(x.customer_name)}</strong></td><td>${esc(x.customer_email||'—')}</td><td>${brl(x.amount_cents)}</td><td>${brl(x.commission_cents)} <small>${x.commission_rate}%</small></td><td><span class="badge">${esc(x.status)}</span></td><td>${new Date(x.sold_at).toLocaleDateString('pt-BR')}</td></tr>`).join('')||'<tr><td colspan="6">Nenhuma venda registrada.</td></tr>'}</tbody></table></div></div>`; }
  function sellerSettingsPage(){ return `${pageHead('Minha conta','Perfil comercial','Seus dados de acesso e sua regra de comissão.') }<div class="card card-pad settings-card"><div class="settings-row"><div><strong>${esc(state.sellerData.seller?.full_name||state.user?.name||'Vendedor')}</strong><span>${esc(state.user?.email||'')}</span></div><span class="badge badge-success">VENDEDOR ATIVO</span></div><div class="settings-row"><div><strong>Comissão configurada</strong><span>Definida pela administração TAJO</span></div><strong>${esc(state.sellerData.seller?.commission_rate||0)}%</strong></div><button class="btn btn-danger" data-action="logout">${ICONS.logout} Sair da conta</button></div>`; }

  function operatorShell(content, active){
    const nav=[['operator-dashboard','dashboard','Visão geral'],['operator-qrs','plate','QR Dinâmicos'],['operator-clients','clients','Clientes'],['operator-smart','globe','Bio-sites'],['sales','sales','Playbook de vendas'],['operator-settings','settings','Minha licença']];
    const navHtml=nav.map(([path,icon,label])=>`<a class="nav-item ${active===path?'active':''}" href="#/${path}">${ICONS[icon]}<span>${label}</span></a>`).join('');
    const op=state.operatorData.operator||{};
    return `<div class="app-shell operator-shell"><aside class="sidebar ${state.sidebarOpen?'open':''}"><div class="sidebar-logo"><img src="assets/images/tajo-tap-logo.png" alt="TAJO TAP BUSINESS"></div><div class="sidebar-context"><img class="context-mark" src="assets/images/tajo-tap-mark.png" alt=""><div class="context-copy"><strong>${esc(op.brand_name||'TAJO TAP BUSINESS')}</strong><span>Operação licenciada</span></div></div><nav class="nav-group"><div class="nav-label">Minha operação</div>${navHtml}</nav><div class="sidebar-spacer"></div><div class="sidebar-help"><strong>Modelo comercial</strong><p>Crie QR Codes, bio-sites e gerencie sua própria carteira de clientes.</p><a class="btn btn-soft btn-sm" href="#/sales">${ICONS.sales} Abrir playbook</a></div><div class="sidebar-user"><div class="avatar">${esc(userInitials())}</div><div class="meta"><strong>${esc(state.user?.name||op.brand_name||'Operador')}</strong><span>TAJO TAP BUSINESS</span></div></div><button class="sidebar-logout" data-action="logout">${ICONS.logout}<span>Sair da conta</span></button></aside><div class="drawer-backdrop ${state.sidebarOpen?'show':''}" data-action="close-sidebar"></div><div class="app-main"><header class="topbar"><button class="btn btn-icon btn-ghost mobile-menu-btn" data-action="toggle-sidebar">${ICONS.menu}</button><a class="mobile-brand" href="#/operator-dashboard"><img src="assets/images/tajo-tap-logo.png" alt="TAJO TAP BUSINESS"></a><div class="topbar-title"><strong>Minha Operação</strong><span>${esc(op.brand_name||'TAJO TAP BUSINESS')}</span></div><div class="topbar-actions"><button class="btn btn-icon btn-ghost" data-action="theme">${state.theme==='dark'?ICONS.sun:ICONS.moon}</button></div></header><main class="content">${content}<footer class="system-credit">Tecnologia TAJO TAP · Sistema desenvolvido por <strong>João Paulo Brandão</strong></footer></main></div><nav class="mobile-bottom-nav"><a class="${active==='operator-dashboard'?'active':''}" href="#/operator-dashboard">${ICONS.dashboard}<span>Início</span></a><a class="${active==='operator-qrs'?'active':''}" href="#/operator-qrs">${ICONS.plate}<span>QRs</span></a><a class="${active==='operator-clients'?'active':''}" href="#/operator-clients">${ICONS.clients}<span>Clientes</span></a><a class="${active==='operator-smart'?'active':''}" href="#/operator-smart">${ICONS.globe}<span>Bio-sites</span></a><a class="${active==='sales'?'active':''}" href="#/sales">${ICONS.sales}<span>Vendas</span></a></nav></div>`;
  }

  function renderOperatorApp(r){
    if(state.operatorData.access && state.operatorData.access!=='active'){
      app.innerHTML=operatorShell(operatorLicenseBlockedPage(), 'operator-settings');
      bindPageEnhancements(r);
      return;
    }
    const allowed=new Set(['operator-dashboard','operator-qrs','operator-clients','operator-smart','operator-settings','sales']);
    if(r.name==='dashboard'||!allowed.has(r.name)) return go('operator-dashboard');
    const content=r.name==='operator-dashboard'?operatorDashboardPage():r.name==='operator-qrs'?operatorQrsPage():r.name==='operator-clients'?operatorClientsPage():r.name==='operator-smart'?smartPagesPage('Operador'):r.name==='sales'?salesPage():operatorSettingsPage();
    app.innerHTML=operatorShell(content,r.name); bindPageEnhancements(r);
  }

  function operatorDashboardPage(){
    const m=state.operatorData.metrics||{}, op=state.operatorData.operator||{};
    const expires=op.license_ends_at?new Date(op.license_ends_at).toLocaleDateString('pt-BR'):'Sem vencimento definido';
    const qrLimit=Number(op.qr_limit||0), clientLimit=Number(op.client_limit||0), smartLimit=Number(op.smart_page_limit||0);
    return `${pageHead('TAJO TAP BUSINESS','Sua operação de QR Code Dinâmico','Aqui você gerencia a carteira que está construindo: clientes, QR Codes permanentes, destinos e bio-sites.',`<button class="btn btn-primary" data-action="operator-new-qr">${ICONS.plus} Criar QR Dinâmico</button>`)}
      <section class="metric-grid">${metric('QR Codes',`${m.qrs||0}/${qrLimit}`,`${Math.max(0,qrLimit-(m.qrs||0))} disponíveis`,'plate')}${metric('Clientes',`${m.clients||0}/${clientLimit}`,`${Math.max(0,clientLimit-(m.clients||0))} disponíveis`,'clients')}${metric('Bio-sites',`${m.smartPages||0}/${smartLimit}`,`${Math.max(0,smartLimit-(m.smartPages||0))} disponíveis`,'globe')}${metric('Acessos no mês',formatNumber(m.scansMonth||0),'Todos os seus QR Codes','analytics')}</section>
      <section class="dashboard-grid"><div class="card card-pad"><div class="card-title"><div><h2>Comece pelo fluxo simples</h2><p>Cliente → QR → destino → demonstração → venda.</p></div></div><div class="quick-actions">${quick('Cadastrar cliente','Organize a empresa antes de criar os acessos.','clients','operator-new-client')}${quick('Criar QR Dinâmico','Gere um código permanente e configure o primeiro destino.','plate','operator-new-qr')}${quick('Criar bio-site','Centralize WhatsApp, Instagram, Google e outros links.','globe','operator-new-smart')}${quick('Abrir playbook','Use scripts, objeções e estratégias de venda.','sales','go-operator-sales')}</div></div><div class="card card-pad"><div class="card-title"><div><h2>Licença operacional</h2><p>O software continua sendo TAJO TAP; sua licença permite usar a plataforma para atender sua carteira.</p></div><span class="badge badge-success">${esc(String(op.plan||'business').toUpperCase())}</span></div><div class="settings-row"><div><strong>Validade</strong><span>Período contratado</span></div><strong>${esc(expires)}</strong></div><div class="settings-row"><div><strong>Marca da operação</strong><span>Identificação interna</span></div><strong>${esc(op.brand_name||'—')}</strong></div></div></section>`;
  }

  function operatorQrsPage(){
    const rows=(state.plaques||[]).map(p=>{const smart=smartPageForPlateCode(p.code);return `<tr><td><strong class="mono">${esc(p.code)}</strong><small>${p.assetKind==='smart_plate'?'Plaquinha inteligente':'QR Dinâmico'}</small></td><td><strong>${esc(p.name)}</strong><small>${esc(p.client)}</small></td><td><span class="badge ${p.status==='active'?'badge-success':p.status==='paused'?'badge-warning':'badge-muted'}">${esc(String(p.status||'').toUpperCase())}</span></td><td><strong>${esc(p.destinationLabel||'—')}</strong><small>${esc(p.destination||'')}</small></td><td>${formatNumber(p.scansMonth||0)}</td><td><div class="row wrap"><button class="btn btn-xs btn-ghost" data-action="download-qr" data-code="${esc(p.code)}">${ICONS.download} QR</button><button class="btn btn-xs btn-ghost" data-action="edit-destination" data-code="${esc(p.code)}">${ICONS.edit} Destino</button>${smart?`<button class="btn btn-xs btn-ghost" data-action="edit-smart-page" data-id="${esc(smart.id)}">Bio-site</button>`:''}<button class="btn btn-xs btn-ghost" data-action="operator-toggle-qr" data-code="${esc(p.code)}" data-status="${esc(p.status)}">${p.status==='paused'?'Ativar':'Pausar'}</button></div></td></tr>`}).join('');
    return `${pageHead('Operação','QR Codes Dinâmicos','Cada QR é permanente. Você troca o destino no painel sem precisar gerar ou reimprimir o código.',`<button class="btn btn-primary" data-action="operator-new-qr">${ICONS.plus} Novo QR</button>`)}<div class="card table-card"><div class="responsive-table"><table><thead><tr><th>Código</th><th>Nome / cliente</th><th>Status</th><th>Destino atual</th><th>Acessos 30d</th><th>Ações</th></tr></thead><tbody>${rows||'<tr><td colspan="6">Nenhum QR criado ainda.</td></tr>'}</tbody></table></div></div>`;
  }

  function operatorClientsPage(){
    const rows=(state.clients||[]).map(c=>`<tr><td><strong>${esc(c.name)}</strong><small>${esc(c.contact||'')}</small></td><td>${esc(c.phone||'—')}<small>${esc(c.email||'')}</small></td><td>${esc(c.city||'—')}</td><td>${c.plates||0}</td><td>${formatNumber(c.scans||0)}</td><td><span class="badge ${c.status==='active'?'badge-success':'badge-muted'}">${esc(String(c.status||'').toUpperCase())}</span></td></tr>`).join('');
    return `${pageHead('Carteira','Meus clientes','Somente clientes criados dentro da sua operação aparecem aqui.',`<button class="btn btn-primary" data-action="operator-new-client">${ICONS.plus} Novo cliente</button>`)}<div class="card table-card"><div class="responsive-table"><table><thead><tr><th>Empresa</th><th>Contato</th><th>Cidade</th><th>QRs</th><th>Acessos</th><th>Status</th></tr></thead><tbody>${rows||'<tr><td colspan="6">Nenhum cliente cadastrado.</td></tr>'}</tbody></table></div></div>`;
  }

  function operatorLicenseBlockedPage(){
    const op=state.operatorData.operator||{};
    const access=state.operatorData.access||'suspended';
    const end=op.license_ends_at?new Date(op.license_ends_at).toLocaleDateString('pt-BR'):'—';
    const labels={expired:'LICENÇA EXPIRADA',scheduled:'ACESSO AGENDADO',suspended:'ACESSO SUSPENSO',missing:'ACESSO INDISPONÍVEL'};
    const message=access==='expired'?'O período contratado terminou. Renove sua licença operacional para voltar a criar e administrar clientes, QR Codes e bio-sites.':access==='scheduled'?'Sua licença já está cadastrada, mas a data de início ainda não chegou.':'Seu acesso operacional está temporariamente indisponível. Entre em contato com o suporte TAJO Digital.';
    return `${pageHead('TAJO TAP BUSINESS','Acesso operacional indisponível',message)}<section class="card card-pad settings-card"><div class="settings-row"><div><strong>${esc(op.brand_name||state.user?.name||'Operador')}</strong><span>${esc(state.user?.email||'')}</span></div><span class="badge badge-warning">${esc(labels[access]||'LICENÇA INATIVA')}</span></div><div class="settings-row"><div><strong>Plano</strong><span>Licença TAJO TAP BUSINESS</span></div><strong>${esc(String(op.plan||'business').toUpperCase())}</strong></div><div class="settings-row"><div><strong>Validade</strong><span>Fim do período contratado</span></div><strong>${esc(end)}</strong></div><div class="activation-notice"><strong>Seus dados permanecem preservados.</strong> A suspensão da licença não apaga automaticamente clientes, QR Codes ou bio-sites vinculados à sua operação.</div><button class="btn btn-danger" data-action="logout">${ICONS.logout} Sair da conta</button></section>`;
  }

  function operatorSettingsPage(){
    const op=state.operatorData.operator||{}; const end=op.license_ends_at?new Date(op.license_ends_at).toLocaleDateString('pt-BR'):'—';
    return `${pageHead('Conta BUSINESS','Minha licença','Informações do seu acesso operacional TAJO TAP.') }<div class="card card-pad settings-card"><div class="settings-row"><div><strong>${esc(op.brand_name||state.user?.name||'Operador')}</strong><span>${esc(state.user?.email||'')}</span></div><span class="badge ${state.operatorData.access==='active'?'badge-success':'badge-warning'}">${state.operatorData.access==='active'?'LICENÇA ATIVA':'LICENÇA INATIVA'}</span></div><div class="settings-row"><div><strong>Plano</strong><span>Definido pela TAJO</span></div><strong>${esc(String(op.plan||'business').toUpperCase())}</strong></div><div class="settings-row"><div><strong>Validade</strong><span>Renovação conforme contrato vigente</span></div><strong>${esc(end)}</strong></div><div class="settings-row"><div><strong>Limites</strong><span>QRs · clientes · bio-sites</span></div><strong>${op.qr_limit||0} · ${op.client_limit||0} · ${op.smart_page_limit||0}</strong></div><button class="btn btn-danger" data-action="logout">${ICONS.logout} Sair da conta</button></div>`;
  }

  function adminOperatorsPage(){
    const cards=(state.operators||[]).map(o=>{const expired=o.license_ends_at&&new Date(o.license_ends_at)<=new Date();return `<article class="card card-pad"><div class="row-between"><div><div class="eyebrow">${o.active&&!expired?'ATIVO':expired?'EXPIRADO':'SUSPENSO'}</div><h2>${esc(o.brand_name)}</h2><p>${esc(o.business_email||'')}</p></div><span class="badge">${esc(String(o.plan||'business').toUpperCase())}</span></div><div class="seller-admin-metrics"><div><span>Clientes</span><strong>${o.clients_count||0}/${o.client_limit||0}</strong></div><div><span>QRs</span><strong>${o.qrs_count||0}/${o.qr_limit||0}</strong></div><div><span>Bio-sites</span><strong>${o.smart_pages_count||0}/${o.smart_page_limit||0}</strong></div><div><span>Acessos</span><strong>${formatNumber(o.scans_total||0)}</strong></div></div><div class="row-between"><small>${o.license_ends_at?`Vence ${new Date(o.license_ends_at).toLocaleDateString('pt-BR')}`:'Sem vencimento'}</small><button class="btn btn-sm btn-ghost" data-action="toggle-operator" data-id="${esc(o.id)}" data-active="${o.active?'1':'0'}">${o.active?'Suspender':'Reativar'}</button></div></article>`}).join('');
    return `${pageHead('TAJO TAP BUSINESS','Operadores licenciados','Gerencie os alunos/licenciados que usam a plataforma para atender a própria carteira.',`<button class="btn btn-primary" data-action="new-operator">${ICONS.plus} Vincular operador</button>`)}<section class="seller-admin-grid">${cards||'<div class="card card-pad"><h2>Nenhum operador BUSINESS</h2><p>Crie a conta do comprador no Supabase Auth e vincule por e-mail.</p></div>'}</section>`;
  }

  function operatorClientModal(){
    showModal(`<div class="modal-head"><div><div class="eyebrow">Minha carteira</div><h2>Novo cliente</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><form id="operator-client-form"><div class="modal-body stack"><div class="field"><label>Empresa</label><input class="input" name="name" required></div><div class="form-grid"><div class="field"><label>Responsável</label><input class="input" name="contact"></div><div class="field"><label>WhatsApp</label><input class="input" name="phone"></div></div><div class="form-grid"><div class="field"><label>E-mail</label><input class="input" type="email" name="email"></div><div class="field"><label>Cidade</label><input class="input" name="city"></div></div></div><div class="modal-footer"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-primary">Cadastrar cliente</button></div></form>`);
  }

  function operatorQrModal(){
    if(!(state.clients||[]).length){toast('Cadastre um cliente primeiro','Todo QR da operação precisa ficar vinculado a uma empresa.');return operatorClientModal();}
    showModal(`<div class="modal-head"><div><div class="eyebrow">QR Dinâmico</div><h2>Criar novo acesso</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><form id="operator-qr-form" data-current-type="custom"><div class="modal-body stack"><div class="form-grid"><div class="field"><label>Cliente</label><select class="select" name="clientId" required>${state.clients.filter(c=>c.status==='active').map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></div><div class="field"><label>Nome interno</label><input class="input" name="name" placeholder="Ex.: QR balcão" required></div></div><div class="field"><label>Formato</label><select class="select" name="assetKind"><option value="dynamic_qr">QR Code Dinâmico</option><option value="smart_plate">Plaquinha inteligente</option></select></div><div class="choice-grid destination-edit-grid">${[['custom','Link'],['whatsapp','WhatsApp'],['instagram','Instagram'],['google','Google'],['map','Localização'],['smart','Bio-site']].map(([id,n])=>`<button type="button" class="choice operator-qr-choice ${id==='custom'?'active':''}" data-type="${id}">${destinationIcon(id)}<strong>${n}</strong></button>`).join('')}</div><input type="hidden" name="type" value="custom"><div class="stack" data-destination-fields>${destinationEditFields('custom')}</div></div><div class="modal-footer"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-primary">Criar QR permanente</button></div></form>`,true);
  }

  function operatorSmartModal(){
    const available=(state.plaques||[]).filter(p=>p.status!=='archived'&&!smartPageForPlateCode(p.code));
    if(!available.length)return toast('Nenhum QR disponível','Crie um QR primeiro ou todos os seus QR Codes já possuem bio-site.');
    showModal(`<div class="modal-head"><div><div class="eyebrow">Bio-site</div><h2>Criar Smart Page</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><form id="operator-smart-form"><div class="modal-body stack"><div class="field"><label>QR Code</label><select class="select" name="plateCode" required>${available.map(p=>`<option value="${esc(p.code)}">${esc(p.code)} · ${esc(p.client)} · ${esc(p.name)}</option>`).join('')}</select></div><div class="field"><label>Nome público do negócio</label><input class="input" name="businessName" required placeholder="Nome que aparecerá no bio-site"></div></div><div class="modal-footer"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-primary">Criar bio-site</button></div></form>`);
  }

  function adminOperatorModal(){
    showModal(`<div class="modal-head"><div><div class="eyebrow">TAJO TAP BUSINESS</div><h2>Vincular operador</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><form id="admin-operator-form"><div class="modal-body stack"><div class="activation-notice"><strong>Licença, não código-fonte.</strong> A conta recebe acesso operacional isolado para atender a própria carteira.</div><div class="form-grid"><div class="field"><label>E-mail da conta Auth</label><input class="input" type="email" name="email" required></div><div class="field"><label>Nome da operação</label><input class="input" name="brand_name" required></div></div><div class="form-grid"><div class="field"><label>Plano</label><select class="select" name="plan"><option value="founders">Fundadores</option><option value="business" selected>Business</option><option value="custom">Custom</option></select></div><div class="field"><label>Validade (dias)</label><input class="input" type="number" min="1" max="3650" name="license_days" value="365"></div></div><div class="form-grid"><div class="field"><label>Limite de QRs</label><input class="input" type="number" min="1" name="qr_limit" value="50"></div><div class="field"><label>Limite de clientes</label><input class="input" type="number" min="1" name="client_limit" value="100"></div><div class="field"><label>Limite de bio-sites</label><input class="input" type="number" min="0" name="smart_page_limit" value="50"></div></div></div><div class="modal-footer"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-primary">Liberar licença</button></div></form>`);
  }

  function adminSellersPage(){ return `${pageHead('Equipe comercial','Vendedores','Gerencie acesso, comissão e acompanhe resultados individuais sem misturar carteiras.',`<button class="btn btn-primary" data-action="new-seller">${ICONS.plus} Vincular vendedor</button>`)}<section class="seller-admin-grid">${(state.sellers||[]).map(s=>`<article class="card card-pad"><div class="row-between"><div><div class="eyebrow">${s.active?'ATIVO':'INATIVO'}</div><h2>${esc(s.full_name)}</h2><p>${esc(s.phone||'Sem telefone')}</p></div><span class="badge">${esc(s.commission_rate)}%</span></div><div class="seller-admin-metrics"><div><span>Leads</span><strong>${s.metrics?.leads||0}</strong></div><div><span>Vendas</span><strong>${s.metrics?.sales||0}</strong></div><div><span>Receita paga</span><strong>${brl(s.metrics?.revenue_cents)}</strong></div><div><span>Comissão</span><strong>${brl(s.metrics?.commission_cents)}</strong></div></div><button class="btn btn-sm btn-ghost" data-action="toggle-seller" data-id="${esc(s.id)}" data-active="${s.active?'1':'0'}">${s.active?'Desativar acesso':'Reativar acesso'}</button></article>`).join('')||'<div class="card card-pad"><h2>Nenhum vendedor vinculado</h2><p>Crie a conta no Supabase Auth e vincule por e-mail aqui.</p></div>'}</section><section class="card table-card" style="margin-top:18px"><div class="card-title card-pad"><div><h2>Vendas aguardando validação</h2><p>Comissão só entra nos resultados pagos após aprovação administrativa.</p></div></div><div class="responsive-table"><table><thead><tr><th>Cliente</th><th>Valor</th><th>Comissão</th><th>Status</th><th>Ação</th></tr></thead><tbody>${(state.adminSales||[]).filter(x=>x.status==='pending').map(x=>`<tr><td><strong>${esc(x.customer_name||'Cliente')}</strong><small>${esc(x.customer_email||'')}</small></td><td>${brl(x.amount_cents)}</td><td>${brl(x.commission_cents)}</td><td><span class="badge">Pendente</span></td><td><button class="btn btn-sm btn-primary" data-action="approve-sale" data-id="${esc(x.id)}">Aprovar pagamento</button></td></tr>`).join('')||'<tr><td colspan="5">Nenhuma venda pendente.</td></tr>'}</tbody></table></div></section>`; }
  function teamChatPage(){ const msgs=state.sellerData.messages||[]; return `${pageHead('Equipe TAJO','Chat dos vendedores','Canal interno compartilhado entre vendedores ativos e administradores. As mensagens ficam salvas no banco.') }<section class="card team-chat"><div class="chat-messages" id="chat-messages">${msgs.map(m=>`<div class="chat-message ${m.sender_user_id===state.user?.id?'mine':''}"><div class="chat-meta"><strong>${esc(m.sender_name)}</strong><span>${m.sender_role==='admin'?'Admin':'Vendedor'} · ${new Date(m.created_at).toLocaleString('pt-BR')}</span></div><p>${esc(m.body)}</p></div>`).join('')||'<div class="empty-state">Nenhuma mensagem ainda. Comece a conversa.</div>'}</div><form id="team-chat-form" class="chat-compose"><textarea class="input" name="body" maxlength="1200" rows="2" placeholder="Escreva para a equipe..." required></textarea><button class="btn btn-primary">Enviar ${ICONS.arrow}</button></form></section>`; }
  async function refreshChat(){ try{ const out=await apiFetch('/api/seller/chat'); state.sellerData.messages=out.messages||[]; if(route().name==='team-chat'){ const box=$('#chat-messages'); if(box){box.innerHTML=state.sellerData.messages.map(m=>`<div class="chat-message ${m.sender_user_id===state.user?.id?'mine':''}"><div class="chat-meta"><strong>${esc(m.sender_name)}</strong><span>${m.sender_role==='admin'?'Admin':'Vendedor'} · ${new Date(m.created_at).toLocaleString('pt-BR')}</span></div><p>${esc(m.body)}</p></div>`).join(''); box.scrollTop=box.scrollHeight;}} }catch{} }
  function startChatPolling(){ stopChatPolling(); refreshChat(); state.chatTimer=setInterval(refreshChat,3000); }
  function stopChatPolling(){ if(state.chatTimer){clearInterval(state.chatTimer);state.chatTimer=null;} }

  function renderPage(r) {
    if (r.name === 'dashboard') return dashboardPage();
    if (r.name === 'plaques') return plaquesPage();
    if (r.name === 'production') return productionPage();
    if (r.name === 'plaque') return plaqueDetail(r.param);
    if (r.name === 'scanner') return scannerPage();
    if (r.name === 'clients') return clientsPage();
    if (r.name === 'smart-pages') return smartPagesPage('Admin');
    if (r.name === 'analytics') return analyticsPage();
    if (r.name === 'sales') return salesPage();
    if (r.name === 'sellers') return adminSellersPage();
    if (r.name === 'operators') return adminOperatorsPage();
    if (r.name === 'team-chat') return teamChatPage();
    if (r.name === 'settings') return settingsPage();
    return notFoundPage();
  }

  function pageHead(eyebrow, title, text, actions='') {
    return `<div class="page-head"><div class="page-head-copy"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${text}</p></div>${actions ? `<div class="page-actions">${actions}</div>`:''}</div>`;
  }

  function dashboardPage() {
    const active=state.plaques.filter(p=>p.status==='active').length;
    const month=state.plaques.reduce((sum,p)=>sum+p.scansMonth,0);
    const op=state.operations||{metrics:{},decisions:[]}, m=op.metrics||{};
    const decisions=(op.decisions||[]).map(d=>`<button class="card decision-card decision-${esc(d.severity||'info')}" data-route="${esc(d.route||'dashboard')}"><span class="decision-count">${formatNumber(d.count||0)}</span><span class="decision-copy"><strong>${esc(d.title)}</strong><small>${esc(d.text)}</small></span>${ICONS.chevron}</button>`).join('');
    return `
      ${pageHead('Painel operacional','O sistema mostra o que precisa de atenção.','Em vez de apenas números, a TAJO TAP transforma estoque, vendas, ativações, PINs e atividade dos clientes em próximas ações.', `<button class="btn btn-ghost" data-action="open-scanner">${ICONS.scan} Escanear placa</button><a class="btn btn-primary" href="#/production">${ICONS.printer} Central de Produção</a>`)}
      <section class="metric-grid" aria-label="Indicadores operacionais">
        ${metric('Plaquinhas ativas',active,`${m.awaiting_activation||0} aguardando ativação`,'plate')}
        ${metric('Unidades em estoque',m.inventory_units||0,'Disponíveis fisicamente para venda','printer')}
        ${metric('Vendas pendentes',m.pending_sales||0,'Aguardando validação administrativa','sales')}
        ${metric('Acessos no mês',formatNumber(month),`${m.no_scan_30d||0} sem acesso há 30 dias`,'analytics')}
      </section>
      <section class="ops-board"><div class="ops-board-head"><div><div class="eyebrow">DECISÕES</div><h2>O que precisa ser feito agora</h2><p>Os cartões abaixo são calculados com dados reais do Supabase.</p></div><span class="chip">Atualizado agora</span></div><div class="ops-decision-grid">${decisions||'<div class="card card-pad">Nenhuma decisão operacional disponível.</div>'}</div></section>
      <section class="dashboard-grid">
        <div class="card card-pad"><div class="card-title"><div><h2>Fluxo recomendado</h2><p>Atalhos alinhados com produção e distribuição.</p></div></div><div class="quick-actions">${quick('Criar lote','Gere estoque em série e vincule a um vendedor.','printer','new-batch')}${quick('Gerenciar estoque','Atualize produção: impressão, produzida e estoque.','plate','go-production')}${quick('Validar vendas','Libere comissão somente após conferir pagamento.','sales','go-sellers')}${quick('Acompanhar clientes','Veja quem está sem uso ou aguardando ativação.','analytics','go-analytics')}</div></div>
        <div class="card card-pad"><div class="card-title"><div><h2>Atividade recente</h2><p>Últimas unidades sincronizadas.</p></div><span class="chip">Agora</span></div><div class="activity-list">${state.plaques.slice(0,5).map(p=>activity(p.status==='unconfigured'?'Plaquinha aguardando configuração':'Plaquinha ativa',`${p.code} · ${p.client}`,p.status==='unconfigured'?'plate':'link',p.createdAt?new Date(p.createdAt).toLocaleDateString('pt-BR'):'agora')).join('')||'<div class="empty-state"><strong>Nenhuma plaquinha cadastrada.</strong><span>Comece pela Central de Produção.</span></div>'}</div></div>
      </section>`;
  }

  function metric(label, value, trend, icon) {
    return `<article class="card metric"><div class="metric-icon">${ICONS[icon]}</div><div><span class="metric-value">${value}</span><span class="metric-label">${label}</span></div><span class="metric-trend text-success">${trend}</span></article>`;
  }
  function quick(title, text, icon, action) { return `<button class="quick-card" data-action="${action}" type="button"><span class="icon-box">${ICONS[icon]}</span><strong>${title}</strong><span>${text}</span></button>`; }
  function activity(title,text,icon,time) { return `<div class="activity"><div class="activity-icon">${ICONS[icon]}</div><div><strong>${title}</strong><span>${text}</span></div><time>${time}</time></div>`; }

  function plaquesPage() {
    const selected = new Set(state.selectedPlateCodes || []);
    const pinCell = (p) => {
      if (p.activationPin) return `<div class="pin-inline"><strong class="mono">${esc(p.activationPin)}</strong><button class="icon-mini" type="button" data-action="copy" data-copy="${esc(p.activationPin)}" title="Copiar PIN">${ICONS.copy}</button>${p.pinConsumedAt||p.configurationLocked?'<span class="pin-status-mini">usado</span>':''}</div>`;
      return `<button class="btn btn-xs btn-ghost" type="button" data-action="reset-pin" data-code="${esc(p.code)}">Gerar PIN</button>`;
    };
    const rows = state.plaques.map(p => `<tr data-code="${esc(p.code)}"><td class="select-cell"><label class="check-control" title="Selecionar ${esc(p.code)}"><input type="checkbox" data-plate-select="${esc(p.code)}" ${selected.has(p.code)?'checked':''}><span></span></label></td><td><div class="entity"><div class="entity-icon">${ICONS.plate}</div><div class="entity-copy"><strong>${esc(p.name)}</strong><span class="mono">${esc(p.code)}</span></div></div></td><td>${pinCell(p)}</td><td>${esc(p.client)}</td><td>${esc(p.destinationLabel)}</td><td>${formatNumber(p.scansMonth)}</td><td>${statusBadge(p.status)}</td><td><button class="btn btn-sm btn-ghost" data-route="plaque/${esc(p.code)}">Gerenciar ${ICONS.chevron}</button></td></tr>`).join('');
    const cards = state.plaques.map(p => `<article class="card mobile-card" data-code="${esc(p.code)}"><div class="mobile-card-head"><div class="row" style="gap:10px"><label class="check-control"><input type="checkbox" data-plate-select="${esc(p.code)}" ${selected.has(p.code)?'checked':''}><span></span></label><div class="entity"><div class="entity-icon">${ICONS.plate}</div><div class="entity-copy"><strong>${esc(p.name)}</strong><span class="mono">${esc(p.code)}</span></div></div></div>${statusBadge(p.status)}</div><div class="mobile-card-meta"><div><span>PIN</span><strong>${p.activationPin?`<span class="mono">${esc(p.activationPin)}</span>${p.pinConsumedAt||p.configurationLocked?' <small class="pin-status-mini">usado</small>':''}`:'Não disponível'}</strong></div><div><span>Cliente</span><strong>${esc(p.client)}</strong></div><div><span>Acessos / mês</span><strong>${formatNumber(p.scansMonth)}</strong></div><div><span>Destino</span><strong>${esc(p.destinationLabel)}</strong></div></div><div class="row wrap">${!p.activationPin && !p.configurationLocked && p.setupStatus!=='completed'?`<button class="btn btn-ghost" data-action="reset-pin" data-code="${esc(p.code)}">Gerar PIN</button>`:''}<button class="btn btn-ghost grow" data-route="plaque/${esc(p.code)}">Gerenciar plaquinha ${ICONS.arrow}</button></div></article>`).join('');
    const selectionCount = selected.size;
    return `
      ${pageHead('Operação','Plaquinhas','Crie, filtre e gerencie todos os pontos QR/NFC da TAJO TAP.', `<button class="btn btn-ghost" data-action="new-batch">${ICONS.printer} Criar lote</button><button class="btn btn-ghost" data-action="open-scanner">${ICONS.scan} Escanear</button><button class="btn btn-primary" data-action="new-plaque">${ICONS.plus} Nova plaquinha</button>`)}
      <div class="toolbar"><div class="grow input-with-icon">${ICONS.search}<input id="plaque-search" class="input" placeholder="Buscar por nome, cliente, código ou PIN"></div><select id="plaque-filter" class="select" style="width:auto"><option value="all">Todos os status</option><option value="active">Ativas</option><option value="unconfigured">Não configuradas</option><option value="paused">Pausadas</option></select></div>
      <div class="bulk-bar ${selectionCount?'is-visible':''}" id="plate-bulk-bar"><div><strong>${selectionCount} selecionada${selectionCount===1?'':'s'}</strong><span>Selecione unidades de teste e exclua em uma única operação.</span></div><div class="row wrap"><button class="btn btn-ghost" data-action="clear-plate-selection">Limpar seleção</button><button class="btn btn-danger" data-action="bulk-delete-plates" ${selectionCount?'':'disabled'}>${ICONS.trash} Excluir selecionadas</button></div></div>
      <div class="table-wrap"><table><thead><tr><th class="select-cell"><label class="check-control" title="Selecionar todas"><input id="select-all-plates" type="checkbox" ${state.plaques.length && selectionCount===state.plaques.length?'checked':''}><span></span></label></th><th>Plaquinha</th><th>PIN</th><th>Cliente</th><th>Destino</th><th>Acessos mês</th><th>Status</th><th></th></tr></thead><tbody id="plaque-tbody">${rows}</tbody></table></div>
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
          <section class="card plaque-hero"><div class="row-between"><span class="badge ${p.status==='active'?'badge-success':'badge-warning'}">${p.status==='active'?'ATIVA':'STATUS: '+esc(p.status.toUpperCase())}</span><img src="assets/images/tajo-tap-mark.png" alt="" style="width:54px;height:54px;object-fit:contain;background:#070a10;border:1px solid #263044;border-radius:13px;padding:3px"></div><div><div class="plaque-code">${esc(p.code)}</div><div class="plaque-link">${esc(qrUrl)}</div></div></section>
          <section class="card card-pad"><div class="card-title"><div><h2>Ativação do cliente</h2><p>${esc(setupLabel)}.</p></div><span class="badge ${p.configurationLocked?'badge-success':'badge-warning'}">${p.configurationLocked?'BLOQUEADA':'PENDENTE'}</span></div><div class="form-grid"><div class="field"><label>URL de ativação</label><input class="input mono" readonly value="${esc(activationUrl)}"></div><div class="field"><label>PIN da plaquinha</label><div class="pin-admin-field"><input class="input mono activation-pin-output" readonly value="${esc(p.activationPin || (p.pinConsumedAt || p.configurationLocked ? 'PIN utilizado' : 'PIN legado não recuperável'))}"><div class="row wrap">${p.activationPin?`<button class="btn btn-ghost" data-action="copy" data-copy="${esc(p.activationPin)}">${ICONS.copy} Copiar PIN</button>`:''}${!p.configurationLocked && p.setupStatus!=='completed'?`<button class="btn btn-ghost" data-action="reset-pin" data-code="${esc(p.code)}">${p.activationPin?'Gerar novo PIN':'Gerar PIN visível'}</button>`:''}</div></div><span class="field-help">Disponível apenas para administradores. Em plaquinhas antigas criadas antes da V4.2, gere um novo PIN uma única vez.</span></div></div><div class="form-grid"><div class="field"><label>Proprietário</label><input class="input" readonly value="${esc(p.ownerUserId ? 'Conta vinculada' : 'Ainda não vinculado')}"></div><div class="field"><label>Status do PIN</label><input class="input" readonly value="${esc(p.pinConsumedAt ? 'Utilizado' : p.pinLockedUntil ? 'Temporariamente bloqueado' : p.activationPin ? 'Pronto para envio' : 'Requer novo PIN')}"></div></div><div class="row wrap" style="margin-top:14px"><button class="btn btn-ghost" data-action="copy" data-copy="${esc(activationUrl)}">${ICONS.copy} Copiar ativação</button></div></section>
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
    return ({ google:ICONS.star, whatsapp:ICONS.whatsapp, instagram:ICONS.instagram, smart:ICONS.globe, wifi:ICONS.wifi, hybrid:ICONS.wifi, map:ICONS.map, custom:ICONS.link }[type] || ICONS.link);
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

  function productionPage() {
    const batches=state.batches||[], recent=state.lastBatch;
    const allPlates=batches.flatMap(b=>b.plates||[]);
    const totalCost=batches.reduce((a,b)=>a+Number(b.unitCostCents||0)*Number(b.quantity||0),0);
    const counts={generated:0,sent_to_print:0,produced:0,in_stock:0,sold:0,delivered:0,activated:0};
    allPlates.forEach(p=>{if(counts[p.productionStatus]!==undefined)counts[p.productionStatus]++;});
    const recentBlock=recent?`<section class="card card-pad production-current"><div class="card-title"><div><div class="eyebrow">Lote recém-criado</div><h2>${esc(recent.code)}</h2><p>${esc(recent.label)} · ${recent.quantity} unidades${recent.seller?` · ${esc(recent.seller.name)}`:''}</p></div>${productionBadge(recent.productionStatus||'generated')}</div><div class="activation-notice"><strong>Distribuição segura:</strong> ${recent.seller?`este lote está vinculado ao login ${esc(recent.seller.email)}. O vendedor verá somente estas unidades.`:'este lote está no estoque interno da TAJO e pode ser atribuído depois.'}</div><div class="row wrap" style="margin-top:16px"><button class="btn btn-primary" data-action="print-batch" data-id="${esc(recent.id)}">${ICONS.printer} Imprimir / Salvar PDF</button><button class="btn btn-ghost" data-action="download-batch-print" data-id="${esc(recent.id)}">${ICONS.download} Arquivo de impressão</button><button class="btn btn-ghost" data-action="download-batch-map" data-id="${esc(recent.id)}">${ICONS.download} Mapa interno</button></div></section>`:'';
    const rows=batches.map(batch=>{
      const s=batch.stageSummary||{}; const seller=batch.seller;
      return `<tr><td><strong>${esc(batch.code)}</strong><small>${esc(batch.label)}</small></td><td><strong>${esc(batch.model||'Padrão')}</strong><small>${batch.widthCm||10} × ${batch.heightCm||8} cm</small></td><td>${seller?`<strong>${esc(seller.name)}</strong><small>${esc(batch.assignedEmail||seller.email||'')}</small>`:'<span class="text-muted">Estoque TAJO</span>'}</td><td><select class="select batch-stage-select" data-id="${esc(batch.id)}">${['generated','sent_to_print','produced','in_stock'].map(x=>`<option value="${x}" ${batch.productionStatus===x?'selected':''}>${productionLabel(x)}</option>`).join('')}</select></td><td><div class="stage-mini"><span>${s.in_stock||0} estoque</span><span>${s.sold||0} vendidas</span><span>${s.delivered||0} entregues</span><span>${s.activated||0} ativadas</span></div></td><td>${brl((batch.unitCostCents||0)*(batch.quantity||0))}<small>${esc(batch.supplier||'Fornecedor não informado')}</small></td><td><div class="row wrap"><button class="btn btn-sm btn-ghost" data-action="view-batch-units" data-id="${esc(batch.id)}">Ver unidades</button><button class="btn btn-sm btn-ghost" data-action="assign-batch-seller" data-id="${esc(batch.id)}">${seller?'Trocar responsável':'Vincular vendedor'}</button><button class="btn btn-sm btn-ghost" data-action="print-batch" data-id="${esc(batch.id)}">${ICONS.printer} Imprimir</button></div></td></tr>`;
    }).join('');
    return `${pageHead('Central de Produção','Produção, estoque e distribuição em um só lugar.','Acompanhe cada unidade da geração até a ativação. Cada lote pode ser direcionado a um vendedor específico pelo e-mail de login.',`<button class="btn btn-primary" data-action="new-batch">${ICONS.plus} Criar novo lote</button>`)}
      ${state.productionError?`<div class="activation-notice" style="margin-bottom:18px"><strong>Atualização necessária:</strong> ${esc(state.productionError)}</div>`:''}
      <section class="metric-grid production-metrics">${metric('Geradas',counts.generated,'Aguardando envio para impressão','plate')}${metric('Produzidas',counts.produced,'Peças físicas finalizadas','printer')}${metric('Em estoque',counts.in_stock,'Disponíveis para venda','dashboard')}${metric('Custo registrado',brl(totalCost),'Soma dos lotes cadastrados','analytics')}</section>
      <section class="production-flow card card-pad"><div class="card-title"><div><h2>Linha de produção</h2><p>Status físico usado em todas as unidades.</p></div><span class="chip">V5</span></div><div class="production-flow-track">${['generated','sent_to_print','produced','in_stock','sold','delivered','activated'].map((x,i)=>`<div><span>${i+1}</span><strong>${productionLabel(x)}</strong><small>${formatNumber(counts[x]||0)} unidade(s)</small></div>`).join('')}</div></section>
      ${recentBlock}
      <section class="production-guide"><article class="card card-pad"><div class="eyebrow">LOTE</div><h3>Metadados completos</h3><p>Quantidade, data, modelo, tamanho, custo unitário, fornecedor, responsável e arquivo de impressão.</p></article><article class="card card-pad"><div class="eyebrow">DISTRIBUIÇÃO</div><h3>Vinculado por login</h3><p>O e-mail encontra a conta do vendedor, mas a permissão real fica vinculada ao UUID do Supabase Auth.</p></article><article class="card card-pad"><div class="eyebrow">PERMISSÃO</div><h3>Vendedor não cria unidades</h3><p>Ele visualiza exclusivamente os lotes comprados/vinculados pela administração TAJO.</p></article></section>
      <section class="card table-card" style="margin-top:18px"><div class="card-title card-pad"><div><h2>Lotes de produção</h2><p>Atualize o estágio e acompanhe estoque, distribuição e custo.</p></div></div><div class="responsive-table"><table><thead><tr><th>Lote</th><th>Modelo</th><th>Responsável</th><th>Etapa</th><th>Unidades</th><th>Custo</th><th>Ações</th></tr></thead><tbody>${rows||'<tr><td colspan="7">Nenhum lote criado ainda.</td></tr>'}</tbody></table></div></section>`;
  }

  function batchById(id) {
    if (state.lastBatch?.id === id) return state.lastBatch;
    return (state.batches || []).find(batch => batch.id === id) || null;
  }

  function qrSvgMarkup(text) {
    if (!window.TajoQRCodeCore || !text) return '';
    const QR = window.TajoQRCodeCore, levels = window.TajoQRErrorCorrectLevel;
    const qr = new QR(-1, levels.H); qr.addData(text); qr.make();
    const count = qr.getModuleCount();
    const quiet = 4, size = count + quiet * 2;
    let path = '';
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (qr.isDark(row, col)) path += `M${col+quiet} ${row+quiet}h1v1h-1z`;
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" aria-label="QR Code"><rect width="100%" height="100%" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
  }

  function batchItems(batch) {
    if (!batch) return [];
    if (Array.isArray(batch.items)) return batch.items;
    return (batch.plates || []).map(p => ({ ...p, position: p.position || p.batch_position }));
  }

  function buildBatchPrintHtml(batch) {
    const items=batchItems(batch), width=Number(batch.widthCm||10), height=Number(batch.heightCm||8);
    const cards=items.map(item=>{ const qrUrl=`https://${CONFIG.goDomain}${CONFIG.platePath}${item.code}`; return `<article class="plaque"><div class="brand">TAJO <b>TAP</b></div><div class="headline">AVALIE AQUI</div><div class="qr">${qrSvgMarkup(qrUrl)}</div><div class="foot"><span>Escaneie o QR Code</span><span>◖))) Aproxime via NFC</span></div><strong class="code">${esc(item.code)}</strong></article>`; }).join('');
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(batch.code)} · TAJO TAP</title><style>@page{size:A4 landscape;margin:7mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;margin:0}.head{display:flex;justify-content:space-between;gap:10mm;align-items:end;margin-bottom:7mm;border-bottom:1px solid #ddd;padding-bottom:4mm}.head h1{margin:0 0 1.5mm;font-size:16pt}.head p{margin:0;color:#555;font-size:8pt}.meta{text-align:right;font-size:8pt;color:#555}.grid{display:grid;grid-template-columns:repeat(2,max-content);justify-content:center;gap:6mm}.plaque{width:${width}cm;height:${height}cm;break-inside:avoid;background:#0b0d0c;color:#fff;border-radius:5mm;padding:4mm 5mm;text-align:center;display:flex;flex-direction:column;align-items:center;position:relative;overflow:hidden;border:.4mm solid #222}.brand{font-weight:900;font-size:13pt;letter-spacing:.02em}.brand b{color:#54d90d}.headline{font-weight:900;font-size:18pt;line-height:1;margin:2mm 0}.qr{width:42mm;height:42mm;background:#fff;padding:1.8mm;border-radius:2mm}.qr svg{width:100%;height:100%;display:block}.foot{width:100%;display:flex;justify-content:space-between;gap:3mm;margin-top:2mm;font-size:6.5pt;color:#d9dfda}.code{position:absolute;right:3mm;bottom:2.5mm;font-family:monospace;font-size:6.5pt;color:#8f9a91}@media print{.plaque{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body><header class="head"><div><h1>TAJO TAP · ${esc(batch.code)}</h1><p>${esc(batch.label)} · ${items.length} unidades · QR permanente /q/TT-XXXXXX</p></div><div class="meta">${esc(batch.model||'Padrão TAJO TAP')}<br>${width} × ${height} cm<br>${esc(batch.supplier||'Fornecedor não informado')}</div></header><main class="grid">${cards}</main></body></html>`;
  }

  function printBatch(batch) {
    if (!batch) return toast('Lote não encontrado','Atualize a página e tente novamente.');
    const win = window.open('', '_blank');
    if (!win) return toast('Pop-up bloqueado','Permita pop-ups para gerar a folha de impressão.');
    win.document.open(); win.document.write(buildBatchPrintHtml(batch)); win.document.close();
    setTimeout(() => { try { win.focus(); win.print(); } catch {} }, 400);
  }

  function downloadTextFile(filename, content, type='text/plain;charset=utf-8') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadBatchPrint(batch) {
    if (!batch) return toast('Lote não encontrado','Atualize a página e tente novamente.');
    downloadTextFile(`${batch.code}-QR-IMPRESSAO.html`, buildBatchPrintHtml(batch), 'text/html;charset=utf-8');
  }

  function downloadBatchMap(batch) {
    if (!batch || !Array.isArray(batch.items) || !batch.items.some(i => i.activationCode)) {
      return toast('PINs indisponíveis','Por segurança, os PINs só podem ser exportados na sessão em que o lote foi criado.');
    }
    const header = ['posicao','codigo','pin_ativacao','qr_url','nfc_url','url_ativacao'];
    const lines = batch.items.map(item => [
      item.position,
      item.code,
      item.activationCode,
      `https://${CONFIG.goDomain}${CONFIG.platePath}${item.code}`,
      `https://${CONFIG.goDomain}${CONFIG.nfcPath}${item.code}`,
      `https://${CONFIG.goDomain}${CONFIG.activationPath || '/atv/'}${item.code}`
    ].map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(','));
    downloadTextFile(`${batch.code}-MAPA-INTERNO.csv`, [header.join(','), ...lines].join('\n'), 'text/csv;charset=utf-8');
  }

  function showNewBatchModal() {
    const sellerOptions=(state.sellers||[]).filter(s=>s.active).map(s=>`<option value="${esc(s.user_id||'')}">${esc(s.full_name)}</option>`).join('');
    showModal(`<div class="modal-head"><div><div class="eyebrow">Central de Produção V5</div><h2>Criar lote de plaquinhas</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><form id="new-batch-form"><div class="modal-body stack"><div class="activation-notice"><strong>Distribuição por lote:</strong> informe o e-mail de login do vendedor que comprou/receberá este lote. Se deixar vazio, o lote permanece no estoque interno da TAJO.</div><div class="form-grid"><div class="field"><label>Nome do lote</label><input class="input" name="label" maxlength="120" value="Produção TAJO TAP" required></div><div class="field"><label>Quantidade</label><input class="input" name="quantity" type="number" min="1" max="100" value="10" required><span class="field-help">De 1 a 100 unidades por lote.</span></div></div><div class="field"><label>E-mail do vendedor responsável</label><input class="input" type="email" name="sellerEmail" placeholder="vendedor@empresa.com.br"><span class="field-help">A conta precisa existir no Supabase Auth e estar vinculada como vendedor ativo.</span></div><div class="form-grid"><div class="field"><label>Modelo</label><input class="input" name="model" value="Padrão TAJO TAP" maxlength="80"></div><div class="field"><label>Fornecedor</label><input class="input" name="supplier" placeholder="Nome da gráfica / fabricante" maxlength="160"></div></div><div class="form-grid"><div class="field"><label>Largura (cm)</label><input class="input" name="widthCm" type="number" min="1" max="100" step="0.1" value="10" required></div><div class="field"><label>Altura (cm)</label><input class="input" name="heightCm" type="number" min="1" max="100" step="0.1" value="8" required></div></div><div class="field"><label>Custo unitário de produção (R$)</label><input class="input" name="unitCost" inputmode="decimal" placeholder="0,00"><span class="field-help">Usado apenas na gestão interna de produção.</span></div><div class="field"><label>Observações de produção</label><textarea class="input" name="notes" rows="3" maxlength="1000" placeholder="Acabamento, acrílico, impressão, prazo..."></textarea></div><div class="card card-pad" style="box-shadow:none;background:var(--surface-2)"><strong>Arquivo de impressão</strong><p class="text-muted">O sistema gera um arquivo por lote com layout 10 × 8 cm por padrão, QR exclusivo e identidade TAJO TAP. O QR físico permanece definitivo.</p></div></div><div class="modal-footer"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-primary" type="submit">Gerar lote ${ICONS.arrow}</button></div></form>`, true);
  }

  function showCreatedBatch(batch) {
    state.lastBatch=batch; const first=batch.items?.[0];
    showModal(`<div class="modal-head"><div><div class="eyebrow">Lote criado</div><h2>${esc(batch.code)}</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><div class="modal-body stack"><div class="destination-option active"><div class="destination-icon">${ICONS.check}</div><div class="destination-copy"><strong>${batch.quantity} plaquinhas geradas</strong><span>${esc(batch.model||'Padrão TAJO TAP')} · ${batch.widthCm||10} × ${batch.heightCm||8} cm</span></div></div><div class="activation-notice"><strong>Responsável:</strong> ${batch.seller?`${esc(batch.seller.name)} · ${esc(batch.seller.email)}`:'Estoque interno TAJO'}. O vendedor não recebe permissão para criar novas plaquinhas.</div>${first?`<div class="form-grid"><div class="field"><label>Primeira unidade</label><input class="input mono" readonly value="${esc(first.code)}"></div><div class="field"><label>Primeiro PIN</label><input class="input mono" readonly value="${esc(first.activationCode)}"></div></div>`:''}</div><div class="modal-footer"><button class="btn btn-ghost" data-action="download-batch-map" data-id="${esc(batch.id)}">${ICONS.download} Mapa interno</button><button class="btn btn-ghost" data-action="download-batch-print" data-id="${esc(batch.id)}">${ICONS.download} Arquivo impressão</button><button class="btn btn-primary" data-action="print-batch" data-id="${esc(batch.id)}">${ICONS.printer} Salvar PDF / Imprimir</button></div>`);
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
        <section class="card card-pad"><div class="card-title"><div><h2>Identidade</h2><p>A marca oficial já está aplicada em todo o sistema.</p></div></div><div class="row" style="padding:20px;background:#fff;border-radius:16px;border:1px solid #e5e8e4"><img src="assets/images/tajo-tap-logo.png" style="width:min(360px,92%);max-height:240px;object-fit:contain" alt="TAJO TAP BUSINESS"></div><div class="form-grid" style="margin-top:18px"><div class="field"><label>Domínio principal</label><input class="input" readonly value="${esc(CONFIG.primaryDomain)}"></div><div class="field"><label>Sistema TAJO TAP</label><input class="input" readonly value="${esc(CONFIG.goDomain)}"></div></div></section>
        <div class="stack"><section class="card card-pad"><div class="card-title"><div><h2>Experiência</h2><p>Preferências locais do frontend.</p></div></div><div class="destination-option"><div class="destination-icon">${state.theme==='dark'?ICONS.moon:ICONS.sun}</div><div class="destination-copy" style="flex:1"><strong>Tema ${state.theme==='dark'?'escuro':'claro'}</strong><span>Você pode alternar a qualquer momento.</span></div><button class="btn btn-sm btn-ghost" data-action="theme">Alternar</button></div><div class="destination-option" style="margin-top:12px"><div class="destination-icon">${ICONS.lock}</div><div class="destination-copy"><strong>Backend conectado</strong><span>Vercel Functions + Supabase Auth + PostgreSQL + motor de redirecionamento.</span></div></div></section>
        <section class="card card-pad"><div class="card-title"><div><h2>Sessão</h2><p>Conta atualmente autenticada no sistema.</p></div></div><div class="account-session"><div class="avatar">${esc(userInitials())}</div><div><strong>${esc(state.user?.name || 'Administrador')}</strong><span>${esc(state.user?.email || 'Conta TAJO TAP')}</span></div></div><button class="btn btn-dark" style="width:100%;margin-top:16px" data-action="logout">${ICONS.logout} Sair da conta</button></section></div>
      </div>`;
  }

  function notFoundPage() { return `${pageHead('Erro 404','Página não encontrada.','O endereço solicitado não existe neste frontend.', `<button class="btn btn-primary" data-route="dashboard">Voltar ao painel</button>`)}`; }

  function renderPortal() {
    const owned = state.plaques;
    const pages = state.smartPages || [];
    app.innerHTML = `
      <div class="activate-shell portal-shell-v6" style="display:block;padding:0;background:var(--bg);color:var(--ink)">
        <header class="topbar" style="position:sticky"><a href="#/portal"><img src="assets/images/tajo-tap-logo.png" style="width:160px;max-height:80px;object-fit:contain;background:#070a10;border:1px solid #263044;border-radius:11px;padding:4px 6px" alt="TAJO TAP BUSINESS"></a><div class="topbar-title portal-title"><strong>Meu TAJO TAP</strong><span>Plaquinhas + Smart Page</span></div><div style="margin-left:auto" class="row"><button class="btn btn-ghost" data-action="theme">${state.theme==='dark'?ICONS.sun:ICONS.moon}</button><button class="btn btn-dark" data-action="portal-exit">Sair</button></div></header>
        <main class="content">
          ${pageHead('Área do cliente','Sua presença digital em um só lugar.','Edite a Smart Page do seu negócio e controle para onde suas plaquinhas direcionam os clientes.', '')}
          <section class="client-smart-hero"><div><div class="eyebrow">TAJO SMART PAGE</div><h2>Seu biosite comercial, editável pelo próprio painel.</h2><p>WhatsApp, Instagram, localização, avaliações, Pix, Wi-Fi, serviços e outros links ficam centralizados em uma página moderna.</p></div><div class="smart-orbit">${ICONS.globe}</div></section>
          <section class="client-section"><div class="card-title"><div><h2>Minhas Smart Pages</h2><p>Alterações aparecem no endereço público sem trocar o QR da plaquinha.</p></div></div><div class="smart-admin-grid">${pages.map(p=>`<article class="card smart-admin-card"><div class="smart-admin-cover" style="--smart:${esc(p.primaryColor||'#45E600')};background:${esc(p.backgroundColor||'#0B0D0E')}"><span>${ICONS.globe}</span><strong>${esc(p.businessName)}</strong><small>/bio/${esc(p.slug)}</small>${p.wifiMode&&p.wifiMode!=='off'?`<em class="smart-wifi-chip">${ICONS.wifi} ${p.wifiMode==='hybrid'?'Smart + Wi-Fi':'Wi-Fi Connect'}</em>`:''}</div><div class="card-pad"><div class="smart-stats"><span><b>${formatNumber(p.analytics?.views30d||0)}</b>Visualizações 30d</span><span><b>${formatNumber(p.analytics?.clicks30d||0)}</b>Cliques 30d</span></div><div class="row wrap"><button class="btn btn-primary" data-action="edit-smart-page" data-id="${esc(p.id)}">${ICONS.edit} Editar página</button><button class="btn btn-ghost" data-action="copy" data-copy="${esc(p.publicUrl)}">${ICONS.copy} Copiar URL</button><a class="btn btn-ghost" href="${esc(p.publicUrl)}" target="_blank" rel="noopener">Abrir ↗</a></div></div></article>`).join('')||'<div class="card card-pad"><h3>Sua Smart Page aparecerá aqui.</h3><p>Se sua plaquinha foi comprada com Smart Page, conclua a ativação usando o e-mail informado no momento da compra.</p></div>'}</div></section>
          <section class="client-section"><div class="card-title"><div><h2>Minhas plaquinhas</h2><p>O QR e o NFC físicos continuam iguais; você pode mudar o destino digital.</p></div></div><div class="portal-grid">${owned.map(p=>`<article class="card portal-plaque"><div class="row-between"><div class="entity"><div class="entity-icon">${ICONS.plate}</div><div class="entity-copy"><strong>${esc(p.name)}</strong><span class="mono">${esc(p.code)}</span></div></div>${statusBadge(p.status)}</div><div class="destination-option active" style="margin-top:18px"><div class="destination-icon">${destinationIcon(p.destinationType)}</div><div class="destination-copy"><strong>${esc(p.destinationLabel)}</strong><span>${p.destination?esc(p.destination):'Destino atual'}</span></div></div><div class="row wrap" style="margin-top:18px"><button class="btn btn-primary" data-action="edit-destination" data-code="${esc(p.code)}">Alterar destino</button><span class="chip">${formatNumber(p.scansMonth)} acessos/mês</span></div></article>`).join('')}</div></section>
        <footer class="system-credit">Sistema desenvolvido por <strong>João Paulo Brandão</strong></footer></main>
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
      smartBusinessName: '',
      smartSlug: '',
      wifiSsid: '',
      wifiSecurity: 'WPA',
      wifiPassword: '',
      wifiHidden: false,
      wifiLabel: 'Wi-Fi do estabelecimento',
      wifiPayload: '',
      confirmationRequired: false,
      access: null
    };
  }

  async function loadActivationPlate(code) {
    state.activation.loading = true;
    state.activation.error = '';
    render();
    try {
      const out = await apiFetch(`/api/public/activate?code=${encodeURIComponent(code)}`);
      state.activation.plate = out.plate || null;
      state.activation.access = out.access || null;
      if (out.plate?.smartPage?.url) {
        state.activation.selected = ['wifi','hybrid'].includes(out.plate.smartPage.wifiMode) ? out.plate.smartPage.wifiMode : 'smart';
        state.activation.value = out.plate.smartPage.url;
        state.activation.rawValue = '';
        state.activation.smartBusinessName = out.plate.smartPage.businessName || state.activation.companyName || '';
        state.activation.smartSlug = out.plate.smartPage.slug || String(out.plate.smartPage.url).split('/bio/')[1] || '';
      }
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
    return `<main class="activate-shell"><section class="activate-card"><header class="activate-head"><img class="activate-logo" src="assets/images/tajo-tap-logo.png" alt="TAJO TAP BUSINESS"><span class="badge badge-${badgeType}">${badge}</span></header><div class="activate-body">${content}</div></section></main>`;
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
      app.innerHTML = activationShell(`<div class="activation-success-icon">${ICONS.check}</div><div class="eyebrow" style="color:var(--brand)">${esc(cleanCode)}</div><h1>Sua TAJO TAP está ativa.</h1><p>O QR Code físico principal já está direcionando para o destino escolhido. A configuração pública desta plaquinha foi encerrada.</p><div class="activation-summary"><div><span>Destino</span><strong>${esc(destinationName(state.activation.selected))}</strong></div><div><span>Configuração</span><strong>Concluída e bloqueada</strong></div></div>${state.activation.confirmationRequired?'<div class="activation-notice">Enviamos a confirmação de cadastro conforme a configuração de autenticação do projeto. Após confirmar o e-mail, entre normalmente no painel.</div>':''}<div class="row activation-actions"><a class="btn btn-ghost" href="${esc(destination)}" target="_blank" rel="noopener noreferrer">Testar destino</a><button class="btn btn-primary" data-action="activation-finish">${loginText} ${ICONS.arrow}</button></div>`, 'ATIVA', 'success');
      if (state.activation.wifiPayload) queueMicrotask(renderQRCodes);
      return;
    }

    app.innerHTML = activationShell(`<div class="activation-topline"><div><div class="eyebrow" style="color:var(--brand)">Ativação única</div><strong class="mono">${esc(cleanCode)}</strong></div><span class="activation-step-label">Etapa ${state.activation.step}/4</span></div>${activationProgress(state.activation.step)}${activationStep(plate, state.activation.step)}`);
  }

  function activationStep(plate, step) {
    if (step === 1) {
      return `<div class="activation-hero"><div class="activation-plate-mark">${ICONS.wifi}</div><h1>Ative sua plaquinha.</h1><p>Você vai vincular esta TAJO TAP à sua conta e escolher para onde seus clientes serão direcionados.</p></div><div class="activation-feature-list"><div>${ICONS.check}<span><strong>QR Code permanente</strong><small>O impresso no acrílico não precisa ser trocado.</small></span></div><div>${ICONS.check}<span><strong>Configuração inicial única</strong><small>Depois da confirmação, este link público será bloqueado.</small></span></div><div>${ICONS.check}<span><strong>Controle pelo painel</strong><small>Futuras alterações são feitas com login.</small></span></div></div><button class="btn btn-primary" style="width:100%;margin-top:24px" data-action="activation-next">Começar ativação ${ICONS.arrow}</button>`;
    }

    if (step === 2) {
      const purchaseAccess = state.activation.access?.restricted
        ? `<div class="activation-notice"><strong>Compra vinculada por e-mail.</strong> Esta plaquinha foi reservada para <span class="mono">${esc(state.activation.access.emailMasked || 'o e-mail informado na compra')}</span>. Entre ou crie a conta usando exatamente esse e-mail.</div>`
        : '';
      if (state.user) {
        if (state.activation.access?.restricted && state.activation.access?.sessionMatchesPurchaseEmail === false) {
          return `<h1>Use a conta informada na compra.</h1>${purchaseAccess}<div class="activation-account-warning"><div><strong>Conta conectada agora</strong><span>${esc(state.user.email || '')}</span></div></div><p>Para proteger a plaquinha, não vamos transferi-la para outro e-mail automaticamente.</p><div class="row activation-actions"><button class="btn btn-ghost" data-action="activation-back">Voltar</button><button class="btn btn-primary" style="flex:1" data-action="activation-switch-account">Trocar de conta ${ICONS.arrow}</button></div>`;
        }
        return `<h1>Identifique seu negócio.</h1><p>Sua conta já está autenticada como <strong>${esc(state.user.email || state.user.name || 'usuário')}</strong>. Agora informe o estabelecimento que usará esta plaquinha.</p>${purchaseAccess}<div class="activation-account-ok">${ICONS.check}<div><strong>Conta conectada</strong><span>${esc(state.user.email || '')}</span></div></div><div class="form-grid"><div class="field"><label for="activation-company">Estabelecimento</label><input id="activation-company" class="input" value="${esc(state.activation.companyName)}" autocomplete="organization" placeholder="Ex.: Restaurante Central" required></div><div class="field"><label for="activation-phone">WhatsApp</label><input id="activation-phone" class="input" value="${esc(state.activation.phone)}" inputmode="tel" autocomplete="tel" placeholder="(27) 99999-9999"></div></div><div class="row activation-actions"><button class="btn btn-ghost" data-action="activation-back">Voltar</button><button class="btn btn-primary" style="flex:1" data-action="activation-next">Continuar ${ICONS.arrow}</button></div>`;
      }

      const tabs = `<div class="activation-tabs"><button class="${state.activation.accountMode==='signup'?'active':''}" data-action="activation-account-mode" data-mode="signup">Criar minha conta</button><button class="${state.activation.accountMode==='existing'?'active':''}" data-action="activation-account-mode" data-mode="existing">Já tenho uma conta</button></div>`;
      if (state.activation.accountMode === 'existing') {
        return `<h1>Entre na sua conta.</h1><p>Use seu acesso TAJO TAP. Depois do login, esta plaquinha será vinculada ao seu negócio.</p>${purchaseAccess}${tabs}<form id="activation-existing-login-form" class="stack"><div class="form-grid"><div class="field"><label>E-mail</label><input class="input" name="email" type="email" autocomplete="email" data-activation-key="email" value="${esc(state.activation.email)}" required></div><div class="field"><label>Senha</label><input class="input" name="password" type="password" autocomplete="current-password" minlength="8" required></div></div><div class="form-grid"><div class="field"><label>Estabelecimento</label><input class="input" name="company" autocomplete="organization" data-activation-key="companyName" value="${esc(state.activation.companyName)}" required></div><div class="field"><label>WhatsApp</label><input class="input" name="phone" inputmode="tel" autocomplete="tel" data-activation-key="phone" value="${esc(state.activation.phone)}"></div></div><div class="row activation-actions"><button type="button" class="btn btn-ghost" data-action="activation-back">Voltar</button><button class="btn btn-primary" style="flex:1" type="submit">Entrar e continuar ${ICONS.arrow}</button></div></form>`;
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
      ['smart','TAJO Smart Page','Use o biosite inteligente incluído na sua plaquinha.'],
      ['hybrid','Smart Page + Wi-Fi','Biosite completo + conexão Wi-Fi assistida no celular.'],
      ['wifi','Wi-Fi Connect','Página focada em Wi-Fi de conexão.'],
      ['map','Localização','Abra uma rota ou endereço no mapa.'],
      ['custom','Outro link','Use qualquer endereço HTTPS.']
    ];
    return items.map(([id,name,desc])=>`<button class="choice ${state.activation.selected===id?'active':''}" data-action="activation-choice" data-choice="${id}">${destinationIcon(id)}<strong>${name}</strong><span>${desc}</span></button>`).join('');
  }

  function slugifySmartName(value) {
    return String(value || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '').slice(0, 48) || 'meu-negocio';
  }

  function destinationField(type) {
    const raw = esc(state.activation.rawValue || '');
    if (type === 'whatsapp') return `<div class="stack"><div class="field"><label>WhatsApp de destino</label><input id="activation-value" class="input" inputmode="tel" value="${raw}" placeholder="(27) 99999-9999"></div><div class="field"><label>Mensagem inicial <span class="text-muted">(opcional)</span></label><textarea id="activation-message" class="textarea" placeholder="Olá! Vim pela plaquinha...">${esc(state.activation.message || '')}</textarea></div></div>`;
    if (type === 'google') return `<div class="field"><label>Link de avaliação do Google</label><input id="activation-value" class="input" type="url" value="${raw}" placeholder="https://g.page/r/.../review"><span class="field-help">Cole o link HTTPS de avaliação do estabelecimento.</span></div>`;
    if (type === 'instagram') return `<div class="field"><label>Instagram da empresa</label><div class="input-prefix"><span>@</span><input id="activation-value" class="input" type="text" value="${raw.replace(/^@/,'')}" placeholder="nomedoperfil" autocomplete="off"></div><span class="field-help">Digite somente o @ ou o nome do perfil. O TAJO TAP monta o link automaticamente.</span></div>`;
    if (type === 'map') return `<div class="field"><label>Localização</label><input id="activation-value" class="input" type="text" value="${raw}" placeholder="Rua, número, cidade ou link do Google Maps"><span class="field-help">Você pode informar o endereço do negócio ou colar um link HTTPS do mapa.</span></div>`;
    if (['smart','wifi','hybrid'].includes(type)) {
      const business = esc(state.activation.smartBusinessName || state.activation.companyName || '');
      const slug = esc(state.activation.smartSlug || slugifySmartName(state.activation.companyName));
      const existing = state.activation.plate?.smartPage?.url || '';
      const smartFields = `<div class="smart-activation-box"><div class="activation-notice"><strong>${type==='smart'?'Smart Page incluída.':type==='hybrid'?'Modo híbrido recomendado.':'Wi-Fi Connect.'}</strong> ${type==='smart'?'A TAJO TAP cria e vincula o biosite automaticamente.':type==='hybrid'?'O QR principal abre a Smart Page e o visitante pode iniciar a conexão Wi-Fi em um toque.':'O QR principal abre uma página focada em Wi-Fi com conexão assistida pelo celular.'}</div><div class="form-grid"><div class="field"><label>Nome público do negócio</label><input id="activation-smart-name" class="input" value="${business}" maxlength="120" placeholder="Ex.: Bendito Pet"></div><div class="field"><label>Endereço da Smart Page</label><div class="input-prefix"><span>/bio/</span><input id="activation-smart-slug" class="input mono" value="${slug}" maxlength="63" pattern="[a-z0-9-]{3,63}" placeholder="benditopet"></div><span class="field-help" id="activation-smart-slug-help">${existing ? `Página já vinculada: ${esc(existing)}` : 'Ao sair do campo, o sistema verifica se este endereço está disponível.'}</span></div></div><div class="destination-option active"><div class="destination-icon">${ICONS.globe}</div><div class="destination-copy"><strong>Seu endereço público</strong><span>go.tajodigital.com.br/bio/<b id="activation-smart-preview">${slug}</b></span></div></div></div>`;
      if(type==='smart') return smartFields;
      return `${smartFields}<div class="wifi-config-box"><div class="editor-section-title"><strong>${type==='hybrid'?'Smart Page + Wi-Fi':'Wi-Fi Connect'}</strong><span>O mesmo QR dinâmico continua abrindo a página. Se a senha mudar, basta atualizar no painel.</span></div><div class="form-grid"><div class="field"><label>Nome da rede (SSID)</label><input id="activation-wifi-ssid" class="input" value="${esc(state.activation.wifiSsid||'')}" maxlength="32" placeholder="Ex.: RestauranteCentral_Clientes"></div><div class="field"><label>Segurança</label><select id="activation-wifi-security" class="select"><option value="WPA" ${state.activation.wifiSecurity==='WPA'?'selected':''}>WPA / WPA2 / WPA3</option><option value="WEP" ${state.activation.wifiSecurity==='WEP'?'selected':''}>WEP</option><option value="nopass" ${state.activation.wifiSecurity==='nopass'?'selected':''}>Rede aberta</option></select></div></div><div class="form-grid"><div class="field"><label>Senha</label><input id="activation-wifi-password" class="input" type="password" value="${esc(state.activation.wifiPassword||'')}" autocomplete="new-password" placeholder="Senha da rede"></div><div class="field"><label>Nome exibido</label><input id="activation-wifi-label" class="input" value="${esc(state.activation.wifiLabel||'Wi-Fi do estabelecimento')}" maxlength="80"></div></div><label class="check-line"><input id="activation-wifi-hidden" type="checkbox" ${state.activation.wifiHidden?'checked':''}> Esta é uma rede oculta</label><div class="activation-notice"><strong>Conexão assistida:</strong> na Smart Page, o visitante toca em <b>Conectar ao Wi-Fi</b>. Em Android compatível, o sistema tenta abrir as configurações de Wi-Fi e prepara a senha; no iPhone, a senha é copiada e o usuário confirma a rede em Ajustes. Prefira uma rede de visitantes separada da rede administrativa do negócio.</div></div>`;
    }
    return `<div class="field"><label>${destinationName(type)}</label><input id="activation-value" class="input" type="url" value="${raw}" placeholder="https://"><span class="field-help">Informe um endereço HTTPS válido.</span></div>`;
  }

  function destinationName(type) {
    return ({ google:'Avaliações Google', whatsapp:'WhatsApp', instagram:'Instagram', smart:'TAJO Smart Page', wifi:'Wi-Fi Connect', hybrid:'Smart Page + Wi-Fi', map:'Localização', custom:'Link personalizado' }[type] || 'Destino');
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
    if (state.activation.selected === 'instagram') {
      const handle = raw.replace(/^@+/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/+$/, '');
      if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) throw new Error('Informe um perfil válido do Instagram.');
      state.activation.rawValue = handle;
      return `https://instagram.com/${handle}`;
    }
    if (state.activation.selected === 'map') {
      if (!raw) throw new Error('Informe o endereço ou link da localização.');
      try {
        const u = new URL(raw);
        if (u.protocol !== 'https:' || !u.hostname || u.username || u.password) throw new Error();
        return u.toString();
      } catch {
        if (raw.length < 5) throw new Error('Informe um endereço válido.');
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(raw)}`;
      }
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
    state.activation.message = String($('#activation-message')?.value || state.activation.message || '').trim();
    if (!/^\d{6}$/.test(state.activation.pin)) throw new Error('Informe os seis números do PIN de ativação.');

    if (['smart','wifi','hybrid'].includes(state.activation.selected)) {
      state.activation.smartBusinessName = String($('#activation-smart-name')?.value || state.activation.smartBusinessName || state.activation.companyName || '').trim();
      state.activation.smartSlug = slugifySmartName($('#activation-smart-slug')?.value || state.activation.smartSlug || state.activation.smartBusinessName);
      if (state.activation.smartBusinessName.length < 2) throw new Error('Informe o nome público da Smart Page.');
      if (!/^[a-z0-9][a-z0-9-]{2,62}$/.test(state.activation.smartSlug)) throw new Error('Escolha um endereço válido para a Smart Page.');
      state.activation.rawValue = '';
      state.activation.value = state.activation.plate?.smartPage?.url || `https://${CONFIG.goDomain}/bio/${state.activation.smartSlug}`;
      if (state.activation.selected === 'wifi' || state.activation.selected === 'hybrid') {
        state.activation.wifiSsid = String($('#activation-wifi-ssid')?.value || state.activation.wifiSsid || '').trim();
        state.activation.wifiSecurity = String($('#activation-wifi-security')?.value || state.activation.wifiSecurity || 'WPA');
        state.activation.wifiPassword = String($('#activation-wifi-password')?.value || state.activation.wifiPassword || '');
        state.activation.wifiHidden = Boolean($('#activation-wifi-hidden')?.checked);
        state.activation.wifiLabel = String($('#activation-wifi-label')?.value || state.activation.wifiLabel || 'Wi-Fi do estabelecimento').trim();
        if (!state.activation.wifiSsid) throw new Error('Informe o nome da rede Wi-Fi.');
        if (state.activation.wifiSecurity === 'WPA' && !((state.activation.wifiPassword.length >= 8 && state.activation.wifiPassword.length <= 63) || /^[0-9a-fA-F]{64}$/.test(state.activation.wifiPassword))) throw new Error('Para WPA/WPA2/WPA3, use senha de 8 a 63 caracteres.');
        if (state.activation.wifiSecurity === 'WEP' && !([5,13].includes(state.activation.wifiPassword.length) || /^[0-9a-fA-F]{10}$/.test(state.activation.wifiPassword) || /^[0-9a-fA-F]{26}$/.test(state.activation.wifiPassword))) throw new Error('A senha WEP deve ter 5 ou 13 caracteres (ou 10/26 dígitos hexadecimais).');
      }
      return;
    }

    state.activation.rawValue = String($('#activation-value')?.value || state.activation.rawValue || '').trim();
    state.activation.value = normalizeActivationDestination(state.activation.rawValue, state.activation.message);
  }

  function showCreatedPlate(plate, activationCode) {
    const qrUrl = `https://${CONFIG.goDomain}${CONFIG.platePath}${plate.code}`;
    const nfcUrl = `https://${CONFIG.goDomain}${CONFIG.nfcPath || '/n/'}${plate.code}`;
    const activationUrl = `https://${CONFIG.goDomain}${CONFIG.activationPath || '/atv/'}${plate.code}`;
    showModal(`<div class="modal-head"><div><div class="eyebrow">Plaquinha criada</div><h2>${esc(plate.code)}</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><div class="modal-body stack"><div class="destination-option active"><div class="destination-icon">${ICONS.check}</div><div class="destination-copy"><strong>Pronta para produção</strong><span>O QR e o NFC são permanentes. Enquanto estiver pendente, ambos conduzem o cliente para a ativação.</span></div></div><div class="form-grid"><div class="field"><label>Link do QR Code</label><input class="input mono" readonly value="${esc(qrUrl)}"></div><div class="field"><label>Link do NFC</label><input class="input mono" readonly value="${esc(nfcUrl)}"></div></div><div class="form-grid"><div class="field"><label>Página de ativação</label><input class="input mono" readonly value="${esc(activationUrl)}"></div><div class="field"><label>PIN de ativação</label><input class="input mono activation-pin-output" readonly value="${esc(activationCode||'—')}"><span class="field-help">Entregue este PIN junto com a plaquinha. Ele também ficará disponível para administradores no cadastro da unidade.</span></div></div><div class="qr-frame" style="width:220px;margin:auto"><canvas class="qr-canvas" data-qr="${esc(qrUrl)}" width="440" height="440"></canvas></div><div class="activation-notice"><strong>Fluxo:</strong> QR/NFC → <span class="mono">/atv/${esc(plate.code)}</span> enquanto pendente → destino final depois da ativação.</div></div><div class="modal-footer"><button class="btn btn-ghost" data-action="copy" data-copy="${esc(activationUrl)}">${ICONS.copy} Copiar ativação</button><button class="btn btn-ghost" data-action="copy" data-copy="${esc(nfcUrl)}">${ICONS.wifi} Copiar NFC</button><button class="btn btn-primary" data-action="close-modal">Concluir</button></div>`);
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
    const current=p.destinationType||'custom';
    const currentUrl=p.destination||'';
    const smart=smartPageForPlateCode(code);
    const smartUrl=smart?.publicUrl || (current==='smart'?currentUrl:'');
    showModal(`<div class="modal-head"><div><div class="eyebrow">${esc(code)}</div><h2>Alterar destino</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><form id="destination-form" data-code="${esc(code)}" data-current-type="${esc(current)}" data-current-url="${esc(currentUrl)}" data-smart-url="${esc(smartUrl)}"><div class="modal-body stack"><div class="activation-notice"><strong>Destino dinâmico.</strong> O QR Code e o NFC físicos permanecem os mesmos. A Smart Page não é apagada quando você usa Instagram, WhatsApp ou outro link.</div><div class="choice-grid destination-edit-grid">${[['google','Avaliações Google'],['whatsapp','WhatsApp'],['instagram','Instagram'],['smart','Smart Page'],['map','Localização'],['custom','Outro link']].map(([id,n])=>`<button type="button" class="choice destination-modal-choice ${current===id?'active':''}" data-type="${id}">${destinationIcon(id)}<strong>${n}</strong><span>${id==='smart'?'Página inteligente TAJO':'Redirecionamento dinâmico'}</span></button>`).join('')}</div><input type="hidden" name="type" value="${esc(current)}"><div class="stack" data-destination-fields>${destinationEditFields(current,{currentType:current,currentUrl,smartUrl})}</div></div><div class="modal-footer"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-primary">Salvar alteração</button></div></form>`);
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


  function resetPinModal(code) {
    const p = state.plaques.find(x=>x.code===code); if(!p) return;
    const hasPin = Boolean(p.activationPin);
    showModal(`<div class="modal-head"><div><div class="eyebrow">PIN de ativação</div><h2>${hasPin?'Gerar novo PIN':'Gerar PIN visível'} · ${esc(p.code)}</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><div class="modal-body stack"><div class="activation-notice"><strong>${hasPin?'O PIN atual deixará de funcionar.':'Esta plaquinha é de uma versão anterior.'}</strong> ${hasPin?'Use esta opção somente se precisar substituir o código entregue ao cliente.':'Como os PINs antigos eram salvos somente como hash, não é possível recuperar o número original. O sistema vai gerar um novo código de 6 dígitos e invalidar o anterior.'}</div>${hasPin?`<div class="field"><label>PIN atual</label><input class="input mono activation-pin-output" readonly value="${esc(p.activationPin)}"></div>`:''}</div><div class="modal-footer"><button class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-primary" data-action="confirm-reset-pin" data-code="${esc(p.code)}">${ICONS.lock} ${hasPin?'Substituir PIN':'Gerar novo PIN'}</button></div>`);
  }

  function bulkDeleteModal() {
    const selected = (state.selectedPlateCodes || []).filter(code => state.plaques.some(p => p.code === code));
    if (!selected.length) { toast('Selecione plaquinhas','Marque pelo menos uma unidade para excluir.'); return; }
    const phrase = `EXCLUIR ${selected.length}`;
    showModal(`<div class="modal-head"><div><div class="eyebrow">Exclusão em massa</div><h2>Excluir ${selected.length} plaquinha${selected.length===1?'':'s'}?</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><div class="modal-body stack"><div class="danger-alert">${ICONS.trash}<div><strong>Esta operação é irreversível.</strong><p>Use principalmente para limpar unidades criadas em testes. Destinos, PINs, scans e vínculos dependentes serão removidos junto com cada plaquinha.</p></div></div><div class="bulk-code-list">${selected.slice(0,18).map(code=>`<span class="mono">${esc(code)}</span>`).join('')}${selected.length>18?`<span>+ ${selected.length-18} outras</span>`:''}</div><div class="field"><label>Digite <span class="mono">${esc(phrase)}</span> para confirmar</label><input id="bulk-delete-confirm" class="input mono" autocomplete="off" placeholder="${esc(phrase)}"></div></div><div class="modal-footer"><button class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-danger" data-action="confirm-bulk-delete" data-count="${selected.length}">${ICONS.trash} Excluir ${selected.length}</button></div>`);
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
    if(action==='logout'||action==='portal-exit'){ try{await apiFetch('/api/auth/logout',{method:'POST'});}catch{} state.role=null;state.sessionRole=null;state.user=null;state.plaques=[];state.clients=[];state.smartPages=[];state.selectedPlateCodes=[];state.operatorData={operator:null,access:'',metrics:{},clients:[],qrs:[],smartPages:[]};go('login'); }
    if(action==='toggle-sidebar'){state.sidebarOpen=!state.sidebarOpen;render();}
    if(action==='close-sidebar'){state.sidebarOpen=false;render();}
    if(action==='theme'){setTheme(state.theme==='dark'?'light':'dark');render();}
    if(action==='notifications') toast('Tudo em dia','Nenhuma notificação crítica no momento.');
    if(action==='new-plaque') newPlaqueModal();
    if(action==='new-client') newClientModal();
    if(action==='operator-new-client' && state.role==='operator') operatorClientModal();
    if(action==='operator-new-qr' && state.role==='operator') operatorQrModal();
    if(action==='operator-new-smart' && state.role==='operator') operatorSmartModal();
    if(action==='new-operator' && state.role==='admin') adminOperatorModal();
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
    if(action==='go-team-chat') go('team-chat');
    if(action==='go-seller-lots') go('seller-lots');
    if(action==='go-production') go('production');
    if(action==='go-sellers') go('sellers');
    if(action==='go-operator-sales') go('sales');
    if(action==='edit-smart-page') smartPageModal(actionEl.dataset.id);
    if(action==='seller-destination' && state.role==='seller') sellerDestinationModal(actionEl.dataset.code, actionEl.dataset.smart||'');
    if(action==='new-seller-lead') showModal(`<div class="modal-head"><div><div class="eyebrow">CRM</div><h2>Novo lead</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><form id="seller-lead-form"><div class="modal-body stack"><div class="field"><label>Negócio</label><input class="input" name="business_name" required></div><div class="form-grid"><div class="field"><label>Contato</label><input class="input" name="contact_name"></div><div class="field"><label>WhatsApp</label><input class="input" name="phone"></div></div><div class="form-grid"><div class="field"><label>Cidade</label><input class="input" name="city"></div><div class="field"><label>Nicho</label><input class="input" name="niche"></div></div><div class="field"><label>Instagram</label><input class="input" name="instagram"></div><div class="field"><label>Observações</label><textarea class="input" name="notes" rows="3"></textarea></div></div><div class="modal-footer"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-primary">Salvar lead</button></div></form>`);
    if(action==='new-batch') showNewBatchModal();
    if(action==='print-batch') printBatch(batchById(actionEl.dataset.id));
    if(action==='download-batch-print') downloadBatchPrint(batchById(actionEl.dataset.id));
    if(action==='download-batch-map') downloadBatchMap(batchById(actionEl.dataset.id));
    if(action==='view-batch-units' && state.role==='admin'){
      const batch=batchById(actionEl.dataset.id); if(!batch)return;
      const rows=(batch.plates||[]).map(p=>`<tr><td><strong class="mono">${esc(p.code)}</strong><small>#${String(p.position||'').padStart(3,'0')}</small></td><td>${p.activationCode?`<span class="pin-inline"><strong class="mono">${esc(p.activationCode)}</strong><button class="icon-mini" data-action="copy" data-copy="${esc(p.activationCode)}">${ICONS.copy}</button></span>`:'—'}</td><td><select class="select unit-stage-select" data-batch="${esc(batch.id)}" data-code="${esc(p.code)}">${['generated','sent_to_print','produced','in_stock','sold','delivered','activated'].map(x=>`<option value="${x}" ${p.productionStatus===x?'selected':''}>${productionLabel(x)}</option>`).join('')}</select></td></tr>`).join('');
      showModal(`<div class="modal-head"><div><div class="eyebrow">${esc(batch.code)}</div><h2>Unidades do lote</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><div class="modal-body"><div class="activation-notice"><strong>Status individual:</strong> use esta tela para acompanhar ou corrigir a etapa física de cada unidade. Ativação real continua sendo registrada automaticamente.</div><div class="responsive-table" style="margin-top:14px"><table><thead><tr><th>Plaquinha</th><th>PIN</th><th>Etapa</th></tr></thead><tbody>${rows||'<tr><td colspan="3">Nenhuma unidade.</td></tr>'}</tbody></table></div></div><div class="modal-footer"><button class="btn btn-ghost" data-action="close-modal">Fechar</button></div>`,true);
    }
    if(action==='assign-batch-seller' && state.role==='admin'){
      const batch=batchById(actionEl.dataset.id); if(!batch)return;
      showModal(`<div class="modal-head"><div><div class="eyebrow">Distribuição</div><h2>Responsável pelo lote</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><form id="assign-batch-form" data-id="${esc(batch.id)}"><div class="modal-body stack"><div class="activation-notice">Informe o e-mail exato usado no login do vendedor. Deixe vazio para devolver o lote ao estoque interno TAJO.</div><div class="field"><label>E-mail do vendedor</label><input class="input" type="email" name="sellerEmail" value="${esc(batch.assignedEmail||'')}" placeholder="vendedor@empresa.com.br"></div></div><div class="modal-footer"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-primary">Salvar responsável</button></div></form>`);
    }
    if(action==='operator-toggle-qr' && state.role==='operator'){
      const current=String(actionEl.dataset.status||''); const next=current==='paused'?'active':'paused';
      try{await apiFetch('/api/operator/hub',{method:'PATCH',body:{kind:'status',code:actionEl.dataset.code,status:next}});await loadOperatorData();toast('Status atualizado',next==='active'?'QR reativado.':'QR pausado temporariamente.');render();}catch(err){toast('Não foi possível atualizar',err.message);}
    }
    if(action==='toggle-operator' && state.role==='admin'){
      try{await apiFetch('/api/admin/operators',{method:'PATCH',body:{id:actionEl.dataset.id,active:actionEl.dataset.active!=='1'}});await loadOperatorsAdmin();toast('Operador atualizado');render();}catch(err){toast('Não foi possível atualizar',err.message);}
    }
    if(action==='seller-deliver-plate' && state.role==='seller'){
      try{await apiFetch('/api/seller/hub',{method:'PATCH',body:{kind:'plate-delivered',code:actionEl.dataset.code}});await loadSellerData();toast('Entrega registrada',`${actionEl.dataset.code} agora está aguardando ativação do cliente.`);render();}catch(err){toast('Não foi possível atualizar',err.message);}
    }
    if(action==='new-seller-sale'){
      const available=(state.sellerData.lots||[]).flatMap(l=>(l.plates||[]).filter(p=>p.productionStatus==='in_stock').map(p=>({p,l})));
      const opts=available.map(({p,l})=>`<option value="${esc(p.code)}">${esc(p.code)} · ${esc(l.label)}</option>`).join('');
      if(!available.length){ toast('Sem unidades em estoque','Você só pode registrar vendas usando plaquinhas em estoque de um lote vinculado à sua conta.'); }
      else showModal(`<div class="modal-head"><div><div class="eyebrow">Resultado</div><h2>Registrar venda</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><form id="seller-sale-form"><div class="modal-body stack"><div class="field"><label>Plaquinha do meu lote</label><select class="select" name="plate_code" required>${opts}</select><span class="field-help">Somente unidades em estoque e vinculadas a você aparecem aqui.</span></div><div class="form-grid"><div class="field"><label>Cliente / estabelecimento</label><input class="input" name="customer_name" required></div><div class="field"><label>E-mail do cliente</label><input class="input" type="email" name="customer_email" placeholder="cliente@empresa.com.br" required><span class="field-help">Este e-mail será usado para liberar o painel do cliente.</span></div></div><div class="field"><label>Valor da venda (R$)</label><input class="input" name="amount" inputmode="decimal" placeholder="499,90" required></div><div class="field"><label>Observação</label><textarea class="input" name="notes" rows="3"></textarea></div><div class="activation-notice"><strong>Smart Page incluída.</strong> Ao registrar a venda, o sistema cria automaticamente o biosite do cliente, vincula a plaquinha e reserva o acesso para o e-mail informado. A venda continua pendente até aprovação da administração.</div></div><div class="modal-footer"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-primary">Registrar venda + Smart Page</button></div></form>`);
    }
    if(action==='new-seller') showModal(`<div class="modal-head"><div><div class="eyebrow">Equipe</div><h2>Vincular vendedor</h2></div><button class="btn btn-icon btn-ghost" data-action="close-modal">${ICONS.close}</button></div><form id="admin-seller-form"><div class="modal-body stack"><div class="activation-notice">A conta precisa existir primeiro em Supabase Auth → Users. Depois vincule pelo mesmo e-mail.</div><div class="field"><label>Nome</label><input class="input" name="full_name" required></div><div class="field"><label>E-mail da conta</label><input class="input" type="email" name="email" required></div><div class="form-grid"><div class="field"><label>WhatsApp</label><input class="input" name="phone"></div><div class="field"><label>Comissão (%)</label><input class="input" type="number" min="0" max="100" step="0.01" name="commission_rate" value="30" required></div></div></div><div class="modal-footer"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-primary">Vincular vendedor</button></div></form>`);
    if(action==='approve-sale' && state.role==='admin'){try{await apiFetch('/api/admin/sellers',{method:'PATCH',body:{kind:'sale-status',sale_id:actionEl.dataset.id,status:'paid'}});await loadSellersAdmin();toast('Venda aprovada','A comissão agora entra nos resultados pagos.');render();}catch(err){toast('Não foi possível aprovar',err.message);}}
    if(action==='toggle-seller' && state.role==='admin'){ try{await apiFetch('/api/admin/sellers',{method:'PATCH',body:{id:actionEl.dataset.id,active:actionEl.dataset.active!=='1'}});await loadSellersAdmin();toast('Vendedor atualizado');render();}catch(err){toast('Não foi possível atualizar',err.message);} }
    if(action==='copy-sales-script'){ const item=PLAYBOOK.scripts.find(x=>x.id===actionEl.dataset.scriptId); if(item) copyText(item.text); }
    if(action==='copy-objection'){ const item=PLAYBOOK.objections.find(x=>x.id===actionEl.dataset.objectionId); if(item) copyText(item.answer); }
    if(action==='sales-routine'){ copyText((PLAYBOOK.routine||[]).map((x,i)=>`${i+1}. ${x}`).join('\n')); }
    if(action==='reset-pin' && state.role==='admin') resetPinModal(actionEl.dataset.code);
    if(action==='confirm-reset-pin' && state.role==='admin'){
      const code=actionEl.dataset.code; if(state.busy) return; state.busy=true; actionEl.disabled=true;
      try { const out=await apiFetch(`/api/admin/plate?code=${encodeURIComponent(code)}`,{method:'PATCH',body:{action:'reset-pin'}}); const p=state.plaques.find(x=>x.code===code); if(p) Object.assign(p,out.plate); closeModal(); toast('Novo PIN gerado',`${code} · PIN ${out.activationCode}`); render(); }
      catch(err){ toast('Não foi possível gerar o PIN',err.message); actionEl.disabled=false; } finally { state.busy=false; }
    }
    if(action==='clear-plate-selection' && state.role==='admin'){ state.selectedPlateCodes=[]; render(); }
    if(action==='bulk-delete-plates' && state.role==='admin') bulkDeleteModal();
    if(action==='confirm-bulk-delete' && state.role==='admin'){
      const selected=(state.selectedPlateCodes||[]).filter(code=>state.plaques.some(p=>p.code===code));
      const expected=`EXCLUIR ${selected.length}`; const typed=String($('#bulk-delete-confirm')?.value||'').trim().toUpperCase();
      if(!selected.length){ closeModal(); toast('Nada selecionado'); return; }
      if(typed!==expected){ toast('Confirmação incorreta',`Digite ${expected} exatamente.`); return; }
      if(state.busy) return; state.busy=true; actionEl.disabled=true;
      try {
        const deletedCodes=[];
        for(let i=0;i<selected.length;i+=100){
          const chunk=selected.slice(i,i+100);
          const out=await apiFetch('/api/admin/plates/bulk-delete',{method:'POST',body:{codes:chunk}});
          deletedCodes.push(...(out.deleted||chunk));
        }
        const deleted=new Set(deletedCodes); state.plaques=state.plaques.filter(p=>!deleted.has(p.code)); state.selectedPlateCodes=[]; closeModal(); toast('Plaquinhas excluídas',`${deleted.size} unidade(s) removida(s).`); render();
      }
      catch(err){ toast('Não foi possível excluir em massa',err.message); actionEl.disabled=false; } finally { state.busy=false; }
    }
    if(action==='delete-plate' && state.role==='admin') deletePlateModal(actionEl.dataset.code);
    if(action==='confirm-delete-plate' && state.role==='admin'){
      const code=actionEl.dataset.code; const confirmCode=String($('#delete-plate-confirm')?.value||'').trim().toUpperCase();
      if(confirmCode!==code){ toast('Confirmação incorreta',`Digite ${code} exatamente para excluir.`); return; }
      if(state.busy) return; state.busy=true; actionEl.disabled=true;
      try { await apiFetch(`/api/admin/plate?code=${encodeURIComponent(code)}`,{method:'DELETE',body:{confirmCode}}); state.plaques=state.plaques.filter(x=>x.code!==code); closeModal(); toast('Plaquinha excluída',`${code} foi removida do sistema.`); go('plaques'); }
      catch(err){ toast('Não foi possível excluir',err.message); actionEl.disabled=false; } finally { state.busy=false; }
    }
    if(action==='activation-home'){ go(state.role==='admin'?'dashboard':state.role==='seller'?'seller-dashboard':state.role==='operator'?'operator-dashboard':state.role==='client'?'portal':'login'); }
    if(action==='activation-retry'){ state.activation.loaded=false;state.activation.error='';state.activation.plate=null;render(); }
    if(action==='activation-account-mode'){ state.activation.accountMode=actionEl.dataset.mode==='existing'?'existing':'signup';render(); }
    if(action==='activation-choice'){
      state.activation.pin=String($('#activation-pin')?.value||state.activation.pin||'').replace(/\D/g,'').slice(0,6);
      state.activation.selected=actionEl.dataset.choice;
      state.activation.rawValue='';
      state.activation.value='';
      state.activation.message='';
      if(['smart','wifi','hybrid'].includes(state.activation.selected)){
        state.activation.smartBusinessName = state.activation.smartBusinessName || state.activation.companyName || '';
        state.activation.smartSlug = state.activation.smartSlug || slugifySmartName(state.activation.smartBusinessName);
      }
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
          url:['smart','wifi','hybrid'].includes(state.activation.selected) ? null : state.activation.value,
          smartBusinessName:state.activation.smartBusinessName || state.activation.companyName,
          smartSlug:state.activation.smartSlug,
          wifiSsid:state.activation.wifiSsid,
          wifiSecurity:state.activation.wifiSecurity,
          wifiPassword:state.activation.wifiPassword,
          wifiHidden:state.activation.wifiHidden,
          wifiLabel:state.activation.wifiLabel
        }});
        if(out.destinationUrl) state.activation.value=out.destinationUrl;
        if(out.smartPage?.businessName) state.activation.smartBusinessName=out.smartPage.businessName;
        if(out.smartPage?.slug) state.activation.smartSlug=out.smartPage.slug;
        if(out.wifi?.payload) state.activation.wifiPayload=out.wifi.payload;
        state.activation.completed=true;
        state.activation.sessionReady=Boolean(out.sessionReady);
        state.activation.confirmationRequired=Boolean(out.emailConfirmationRequired);
        // Sucesso da ativação não depende do refresh posterior do painel.
        toast('Plaquinha ativada','O QR Code já está direcionando para o destino escolhido.');
        render();
        if(out.sessionReady){
          try {
            const session=await apiFetch('/api/auth/me');
            state.user=session.user||state.user;
            state.sessionRole=session.role||state.sessionRole;
            if(session.role==='admin'||session.role==='client'||session.role==='seller'||session.role==='operator'){
              state.role=session.role;
              await refreshRoleData();
            }
          } catch(refreshError) {
            console.warn('[activation/post-success-refresh]', refreshError);
            toast('Ativação concluída','A plaquinha foi ativada. Se o painel não atualizar, recarregue a página.');
          }
        }
      } catch(err) {
        if(err.code==='ACCOUNT_EXISTS'){ state.activation.accountMode='existing';state.activation.step=2; }
        if(['PIN_INVALID','PIN_LOCKED','PIN_EXPIRED','PIN_USED'].includes(err.code)){ state.activation.step=3; }
        if(err.code==='EMAIL_MISMATCH'){ state.activation.step=2; await loadActivationPlate(state.activation.code); }
        toast('Não foi possível ativar',`${err.message}${err.reference ? ` · Ref. ${err.reference}` : ''}`);
        render();
      } finally { state.busy=false; }
    }
    if(action==='activation-switch-account'){
      try{await apiFetch('/api/auth/logout',{method:'POST'});}catch{}
      state.role=null;state.sessionRole=null;state.user=null;
      state.activation.accountMode='existing';
      state.activation.email='';
      await loadActivationPlate(state.activation.code);
      state.activation.step=2;
      render();
    }
    if(action==='activation-finish'){ go(state.role==='admin'?'dashboard':state.role==='seller'?'seller-dashboard':state.role==='operator'?'operator-dashboard':state.role==='client'?'portal':'login'); }
  });

  document.addEventListener('submit', async (e) => {
    if(e.target.id==='login-form') { e.preventDefault(); if(!e.target.reportValidity()) return; const fd=new FormData(e.target); try{ const out=await apiFetch('/api/auth/login',{method:'POST',body:{email:fd.get('email'),password:fd.get('password')}}); state.role=out.role;state.sessionRole=out.role;state.user=out.user||null;if(out.role==='operator')state.operatorData={...state.operatorData,operator:out.operator||null,access:out.operatorAccess||''};await refreshRoleData(); const after=sessionStorage.getItem('tajoTapAfterLogin');sessionStorage.removeItem('tajoTapAfterLogin'); if(after) go(after); else go(state.role==='admin'?'dashboard':state.role==='seller'?'seller-dashboard':state.role==='operator'?'operator-dashboard':'portal'); }catch(err){toast('Não foi possível entrar',err.message);} }
    if(e.target.id==='activation-existing-login-form'){
      e.preventDefault(); if(!e.target.reportValidity()) return; const fd=new FormData(e.target);
      state.activation.email=String(fd.get('email')||'').trim().toLowerCase();
      state.activation.companyName=String(fd.get('company')||'').trim();
      state.activation.phone=String(fd.get('phone')||'').trim();
      if(state.activation.companyName.length<2){toast('Revise os dados','Informe o nome do estabelecimento.');return;}
      try {
        const out=await apiFetch('/api/public/activation-login',{method:'POST',body:{email:state.activation.email,password:fd.get('password')}});
        state.user=out.user||null;state.sessionRole=out.role||'unassigned';
        if(out.role==='admin'||out.role==='client'||out.role==='seller'||out.role==='operator'){state.role=out.role;await refreshRoleData();}
        await loadActivationPlate(state.activation.code);
        if(state.activation.access?.restricted && state.activation.access?.sessionMatchesPurchaseEmail === false){
          toast('E-mail diferente da compra',`Esta plaquinha foi reservada para ${state.activation.access.emailMasked||'outro e-mail'}. Troque de conta para continuar.`);render();return;
        }
        toast('Conta conectada','Agora você pode continuar a ativação.');render();
      } catch(err){toast('Não foi possível entrar',err.message);}
    }
    if(e.target.id==='manual-scan-form'){e.preventDefault();handleScannedValue(new FormData(e.target).get('code'));}
    if(e.target.id==='new-plaque-form'){
      e.preventDefault(); if(!e.target.reportValidity()) return; const fd=new FormData(e.target);
      try { const out=await apiFetch('/api/admin/plates',{method:'POST',body:{name:fd.get('name'),clientId:fd.get('client')||null,code:fd.get('code')}}); state.plaques.unshift(out.plate); showCreatedPlate(out.plate,out.activationCode); toast('Plaquinha criada',out.plate.code); }
      catch(err){ toast('Não foi possível criar',err.message); }
    }
    if(e.target.id==='new-batch-form'){
      e.preventDefault(); if(!e.target.reportValidity()) return; const fd=new FormData(e.target);
      const button=e.target.querySelector('button[type="submit"]'); if(button) button.disabled=true;
      try {
        const rawCost=String(fd.get('unitCost')||'0').trim(); const unitCost=Number(rawCost.includes(',')?rawCost.replace(/\./g,'').replace(',','.'):rawCost);
        const out=await apiFetch('/api/admin/batches',{method:'POST',body:{label:fd.get('label'),quantity:Number(fd.get('quantity')),sellerEmail:fd.get('sellerEmail'),model:fd.get('model'),supplier:fd.get('supplier'),widthCm:Number(fd.get('widthCm')),heightCm:Number(fd.get('heightCm')),unitCost:Number.isFinite(unitCost)?unitCost:0,notes:fd.get('notes')}});
        state.lastBatch=out.batch;
        await Promise.all([loadAdminData(),loadProductionData(),loadOperations()]);
        showCreatedBatch(out.batch);
        toast('Lote criado',`${out.batch.quantity} plaquinhas geradas com QR permanente.`);
      } catch(err){ toast('Não foi possível criar o lote',err.message); if(button) button.disabled=false; }
    }
    if(e.target.id==='assign-batch-form'){
      e.preventDefault(); if(!e.target.reportValidity())return; const fd=new FormData(e.target);
      try{await apiFetch('/api/admin/batches',{method:'PATCH',body:{kind:'assign-seller',id:e.target.dataset.id,sellerEmail:fd.get('sellerEmail')}});await Promise.all([loadProductionData(),loadAdminData(),loadOperations()]);closeModal();toast('Responsável atualizado');render();}catch(err){toast('Não foi possível vincular o lote',err.message);}
    }
    if(e.target.id==='new-client-form'){
      e.preventDefault(); if(!e.target.reportValidity()) return; const fd=new FormData(e.target);
      try { const out=await apiFetch('/api/admin/clients',{method:'POST',body:{name:fd.get('name'),contact:fd.get('contact'),phone:fd.get('phone'),city:fd.get('city')}}); state.clients.unshift(out.client); closeModal(); toast('Cliente cadastrado',out.client.name); render(); }
      catch(err){ toast('Não foi possível cadastrar',err.message); }
    }
    if(e.target.id==='operator-client-form'){
      e.preventDefault(); if(!e.target.reportValidity()) return; const fd=new FormData(e.target);
      try{await apiFetch('/api/operator/hub',{method:'POST',body:{kind:'client',name:fd.get('name'),contact:fd.get('contact'),phone:fd.get('phone'),email:fd.get('email'),city:fd.get('city')}});await loadOperatorData();closeModal();toast('Cliente cadastrado','Sua carteira foi atualizada.');render();}catch(err){toast('Não foi possível cadastrar',err.message);}
    }
    if(e.target.id==='operator-qr-form'){
      e.preventDefault(); if(!e.target.reportValidity()) return; const fd=new FormData(e.target);
      try{const out=await apiFetch('/api/operator/hub',{method:'POST',body:{kind:'qr',clientId:fd.get('clientId'),name:fd.get('name'),assetKind:fd.get('assetKind'),type:fd.get('type'),value:fd.get('destination'),message:fd.get('message')}});await Promise.all([loadOperatorData(),loadSmartPages()]);closeModal();toast('QR Dinâmico criado',out.plate?.code||'Pronto para uso.');render();}catch(err){toast('Não foi possível criar o QR',err.message);}
    }
    if(e.target.id==='operator-smart-form'){
      e.preventDefault(); if(!e.target.reportValidity()) return; const fd=new FormData(e.target); const code=String(fd.get('plateCode')||''); const plate=state.plaques.find(p=>p.code===code);
      try{const out=await apiFetch('/api/smart-pages',{method:'POST',body:{plateCode:code,clientId:plate?.clientId||'',businessName:fd.get('businessName')}});await apiFetch('/api/operator/hub',{method:'PATCH',body:{kind:'destination',code,type:'smart'}});await Promise.all([loadOperatorData(),loadSmartPages()]);closeModal();toast('Bio-site criado',out.page?.publicUrl||'O QR já aponta para a nova página.');render();}catch(err){toast('Não foi possível criar o bio-site',err.message);}
    }
    if(e.target.id==='admin-operator-form'){
      e.preventDefault(); if(!e.target.reportValidity()) return; const fd=new FormData(e.target);
      try{await apiFetch('/api/admin/operators',{method:'POST',body:{email:fd.get('email'),brand_name:fd.get('brand_name'),plan:fd.get('plan'),license_days:fd.get('license_days'),qr_limit:fd.get('qr_limit'),client_limit:fd.get('client_limit'),smart_page_limit:fd.get('smart_page_limit')}});await loadOperatorsAdmin();closeModal();toast('Operador BUSINESS liberado');render();}catch(err){toast('Não foi possível liberar',err.message);}
    }
    if(e.target.id==='seller-lead-form'){e.preventDefault();if(!e.target.reportValidity())return;const fd=new FormData(e.target);try{await apiFetch('/api/seller/hub',{method:'POST',body:{kind:'lead',business_name:fd.get('business_name'),contact_name:fd.get('contact_name'),phone:fd.get('phone'),city:fd.get('city'),niche:fd.get('niche'),instagram:fd.get('instagram'),notes:fd.get('notes')}});await loadSellerData();closeModal();toast('Lead salvo');render();}catch(err){toast('Não foi possível salvar',err.message);} }
    if(e.target.id==='seller-sale-form'){e.preventDefault();if(!e.target.reportValidity())return;const fd=new FormData(e.target);const amount=Number(String(fd.get('amount')||'').replace(/\./g,'').replace(',','.'));try{const out=await apiFetch('/api/seller/hub',{method:'POST',body:{kind:'sale',plate_code:fd.get('plate_code'),customer_name:fd.get('customer_name'),customer_email:fd.get('customer_email'),amount,notes:fd.get('notes')}});await Promise.all([loadSellerData(),loadSmartPages()]);closeModal();toast('Venda registrada',out.smartPage?.url?'Smart Page criada e vinculada ao e-mail do cliente.':'A plaquinha saiu do estoque e aguarda aprovação.');render();}catch(err){toast('Não foi possível registrar',err.message);} }
    if(e.target.id==='admin-seller-form'){e.preventDefault();if(!e.target.reportValidity())return;const fd=new FormData(e.target);try{await apiFetch('/api/admin/sellers',{method:'POST',body:{full_name:fd.get('full_name'),email:fd.get('email'),phone:fd.get('phone'),commission_rate:fd.get('commission_rate')}});await loadSellersAdmin();closeModal();toast('Vendedor vinculado');render();}catch(err){toast('Não foi possível vincular',err.message);} }
    if(e.target.id==='team-chat-form'){e.preventDefault();if(!e.target.reportValidity())return;const fd=new FormData(e.target);try{await apiFetch('/api/seller/chat',{method:'POST',body:{body:fd.get('body')}});e.target.reset();await refreshChat();}catch(err){toast('Não foi possível enviar',err.message);} }
    if(e.target.id==='smart-page-form'){
      e.preventDefault(); if(!e.target.reportValidity())return; const fd=new FormData(e.target);
      const payload={id:e.target.dataset.id,business_name:fd.get('business_name'),slug:fd.get('slug'),subtitle:fd.get('subtitle'),bio:fd.get('bio'),logo_url:fd.get('logo_url'),cover_url:fd.get('cover_url'),primary_color:fd.get('primary_color'),background_color:fd.get('background_color'),text_color:fd.get('text_color'),button_style:fd.get('button_style'),whatsapp:fd.get('whatsapp'),phone:fd.get('phone'),public_email:fd.get('public_email'),instagram:fd.get('instagram'),tiktok:fd.get('tiktok'),website_url:fd.get('website_url'),maps_url:fd.get('maps_url'),google_review_url:fd.get('google_review_url'),pix_key:fd.get('pix_key'),address:fd.get('address'),opening_hours:fd.get('opening_hours'),services:parseServices(fd.get('services')),custom_links:parseLinks(fd.get('custom_links')),is_published:fd.get('is_published')==='on',wifiMode:fd.get('wifi_mode'),wifiSsid:fd.get('wifi_ssid'),wifiSecurity:fd.get('wifi_security'),wifiPassword:fd.get('wifi_password'),wifiHidden:fd.get('wifi_hidden')==='on',wifiPublicEnabled:fd.get('wifi_public_enabled')==='on',wifiDirectQrEnabled:false,wifiLabel:fd.get('wifi_label')};
      if(state.role==='admin')payload.seller_edit_allowed=fd.get('seller_edit_allowed')==='on';
      try{const out=await apiFetch('/api/smart-pages',{method:'PATCH',body:payload});const idx=state.smartPages.findIndex(x=>x.id===payload.id);if(idx>=0)state.smartPages[idx]={...state.smartPages[idx],...out.page};closeModal();toast('Smart Page atualizada','As mudanças já estão disponíveis no endereço público.');render();}catch(err){toast('Não foi possível salvar',err.message);}
    }
    if(e.target.id==='seller-destination-form'){
      e.preventDefault(); if(!e.target.reportValidity())return; const fd=new FormData(e.target);
      try{
        await apiFetch('/api/seller/hub',{method:'PATCH',body:{kind:'destination',code:e.target.dataset.code,type:fd.get('type'),value:fd.get('destination'),message:fd.get('message')}});
        await Promise.all([loadSellerData(),loadSmartPages()]);
        closeModal();toast('Destino atualizado','O QR físico continua o mesmo e você pode trocar novamente quando precisar.');render();
      }catch(err){toast('Não foi possível alterar',err.message);}
    }
    if(e.target.id==='destination-form'){
      e.preventDefault(); if(!e.target.reportValidity()) return; const fd=new FormData(e.target), p=state.plaques.find(x=>x.code===e.target.dataset.code); if(!p) return;
      try {
        const endpoint=state.role==='admin'?'/api/admin/destination':state.role==='operator'?'/api/operator/hub':'/api/client/destination';
        const method=state.role==='operator'?'PATCH':'POST';
        const body=state.role==='operator'?{kind:'destination',code:p.code,type:fd.get('type'),value:fd.get('destination'),message:fd.get('message')}:{code:p.code,type:fd.get('type'),value:fd.get('destination'),message:fd.get('message')};
        await apiFetch(endpoint,{method,body});
        await refreshRoleData();
        closeModal();toast('Destino atualizado','A Smart Page foi preservada e o QR físico continua o mesmo.');render();
      }
      catch(err){toast('Não foi possível alterar',err.message);}
    }
  });

  document.addEventListener('input',(e)=>{
    const activationFieldMap={
      'activation-name':'fullName',
      'activation-company':'companyName',
      'activation-email':'email',
      'activation-phone':'phone',
      'activation-password':'password',
      'activation-pin':'pin'
    };
    if(activationFieldMap[e.target.id]){
      const key=activationFieldMap[e.target.id];
      let value=String(e.target.value||'');
      if(key==='email') value=value.trim().toLowerCase();
      if(key==='pin') value=value.replace(/\D/g,'').slice(0,6);
      state.activation[key]=value;
      if(key==='pin' && e.target.value!==value) e.target.value=value;
    }
    if(e.target.dataset?.activationKey){
      const key=e.target.dataset.activationKey;
      let value=String(e.target.value||'');
      if(key==='email') value=value.trim().toLowerCase();
      state.activation[key]=value;
    }
    if(e.target.id==='activation-smart-slug'){
      const clean=String(e.target.value||'')
        .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
        .toLowerCase().replace(/[^a-z0-9-]+/g,'-')
        .replace(/^-+|-+$/g,'').slice(0,63);
      if(e.target.value!==clean)e.target.value=clean;
      state.activation.smartSlug=clean;
      const preview=$('#activation-smart-preview'); if(preview) preview.textContent=clean||'meu-negocio';
      return;
    }
    if(e.target.id==='activation-smart-name'){
      state.activation.smartBusinessName=String(e.target.value||'').slice(0,120);
      return;
    }
  });

  document.addEventListener('change',async(e)=>{
    if(e.target.id==='activation-smart-slug'){
      const slug=String(e.target.value||'').trim();
      const help=$('#activation-smart-slug-help');
      if(!slug){ if(help) help.textContent='Informe um endereço para a Smart Page.'; return; }
      try{
        if(help) help.textContent='Verificando disponibilidade...';
        const out=await apiFetch(`/api/public/activate?code=${encodeURIComponent(state.activation.code)}&checkSlug=${encodeURIComponent(slug)}`);
        const finalSlug=out.available?out.slug:out.suggestedSlug;
        state.activation.smartSlug=finalSlug;
        e.target.value=finalSlug;
        const preview=$('#activation-smart-preview'); if(preview) preview.textContent=finalSlug;
        if(help) help.textContent=out.available?'✓ Endereço disponível.':`Este endereço já estava em uso. Sugestão aplicada: /bio/${finalSlug}`;
      }catch(err){
        if(help) help.textContent='Não foi possível verificar agora. A disponibilidade será confirmada ao ativar.';
      }
      return;
    }

    if(e.target.matches('[data-plate-select]')){
      const code=String(e.target.dataset.plateSelect||''); const selected=new Set(state.selectedPlateCodes||[]);
      if(e.target.checked) selected.add(code); else selected.delete(code);
      state.selectedPlateCodes=[...selected]; render(); return;
    }
    if(e.target.id==='select-all-plates'){
      state.selectedPlateCodes=e.target.checked ? state.plaques.map(p=>p.code) : [];
      render(); return;
    }
    if(e.target.classList.contains('unit-stage-select') && state.role==='admin'){
      try{await apiFetch('/api/admin/batches',{method:'PATCH',body:{kind:'plate-stage',id:e.target.dataset.batch,code:e.target.dataset.code,stage:e.target.value}});await Promise.all([loadProductionData(),loadOperations()]);toast('Unidade atualizada',`${e.target.dataset.code} · ${productionLabel(e.target.value)}`);}catch(err){toast('Não foi possível atualizar a unidade',err.message);}return;
    }
    if(e.target.classList.contains('batch-stage-select') && state.role==='admin'){
      const previous=(state.batches||[]).find(b=>b.id===e.target.dataset.id)?.productionStatus;
      try{await apiFetch('/api/admin/batches',{method:'PATCH',body:{kind:'stage',id:e.target.dataset.id,stage:e.target.value}});await Promise.all([loadProductionData(),loadOperations()]);toast('Etapa de produção atualizada',productionLabel(e.target.value));render();}catch(err){e.target.value=previous||'generated';toast('Não foi possível atualizar o lote',err.message);}return;
    }
    if(e.target.classList.contains('seller-lead-status')){try{await apiFetch('/api/seller/hub',{method:'PATCH',body:{kind:'lead',id:e.target.dataset.id,status:e.target.value}});await loadSellerData();toast('Lead atualizado');}catch(err){toast('Não foi possível atualizar',err.message);}return;}
    if(e.target.id==='qr-image-input' && e.target.files?.[0]) scanImage(e.target.files[0]);
  });

  document.addEventListener('click',(e)=>{
    const choice=e.target.closest('.destination-modal-choice, .operator-qr-choice'); if(!choice) return;
    const form=choice.closest('#destination-form, #seller-destination-form, #operator-qr-form'); if(!form)return;
    $$('.destination-modal-choice, .operator-qr-choice',form).forEach(x=>x.classList.remove('active'));
    choice.classList.add('active');
    const f=$('[name="type"]',form); if(f) f.value=choice.dataset.type;
    refreshDestinationFields(form,choice.dataset.type);
  });

  window.addEventListener('hashchange',render);
  window.addEventListener('beforeunload',stopScanner);
  bootstrap();
})();
