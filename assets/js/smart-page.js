(() => {
  'use strict';
  const toast = document.getElementById('smart-toast');
  const show = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(window.__tajoSmartToast);
    window.__tajoSmartToast = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(16px)';
    }, 1800);
  };

  const drawQR = (canvas, text) => {
    if (!canvas || !text || !window.TajoQRCodeCore) return;
    const QR = window.TajoQRCodeCore;
    const levels = window.TajoQRErrorCorrectLevel;
    const qr = new QR(-1, levels.H);
    qr.addData(text); qr.make();
    const count = qr.getModuleCount();
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const quiet = 4;
    const cell = size / (count + quiet * 2);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#050706';
    for (let r = 0; r < count; r += 1) {
      for (let c = 0; c < count; c += 1) {
        if (!qr.isDark(r, c)) continue;
        const x = Math.round((c + quiet) * cell);
        const y = Math.round((r + quiet) * cell);
        const x2 = Math.round((c + quiet + 1) * cell);
        const y2 = Math.round((r + quiet + 1) * cell);
        ctx.fillRect(x, y, x2 - x, y2 - y);
      }
    }
  };

  document.querySelectorAll('.wifi-qr-canvas').forEach((canvas) => drawQR(canvas, canvas.dataset.wifiPayload || ''));

  document.addEventListener('click', async (event) => {
    const copy = event.target.closest('[data-copy]');
    if (copy) {
      event.preventDefault();
      const value = copy.dataset.copy || '';
      try { await navigator.clipboard.writeText(value); show('Copiado'); }
      catch { show('Não foi possível copiar'); }
      return;
    }
    const toggle = event.target.closest('[data-toggle-wifi-qr]');
    if (toggle) {
      event.preventDefault();
      const card = toggle.closest('.wifi-card');
      const wrap = card?.querySelector('.wifi-qr-wrap');
      if (wrap) {
        wrap.classList.toggle('is-visible');
        toggle.textContent = wrap.classList.contains('is-visible') ? 'Ocultar QR Wi-Fi' : 'Mostrar QR Wi-Fi';
      }
      return;
    }
    const share = event.target.closest('[data-share]');
    if (share) {
      event.preventDefault();
      const data = { title: share.dataset.share || document.title, url: location.href };
      try {
        if (navigator.share) await navigator.share(data);
        else { await navigator.clipboard.writeText(location.href); show('Link copiado'); }
      } catch (_) {}
    }
  });
})();
