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
  document.addEventListener('click', async (event) => {
    const copy = event.target.closest('[data-copy]');
    if (copy) {
      event.preventDefault();
      const value = copy.dataset.copy || '';
      try { await navigator.clipboard.writeText(value); show('Copiado'); }
      catch { show('Não foi possível copiar'); }
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
