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

  const copyText = async (value) => {
    if (!value) return false;
    try { await navigator.clipboard.writeText(value); return true; }
    catch {
      try {
        const area = document.createElement('textarea');
        area.value = value; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.opacity = '0';
        document.body.appendChild(area); area.select();
        const ok = document.execCommand('copy'); area.remove(); return ok;
      } catch { return false; }
    }
  };

  const connectWifi = async (button) => {
    const ssid = button.dataset.wifiSsid || '';
    const password = button.dataset.wifiPassword || '';
    const security = (button.dataset.wifiSecurity || 'WPA').toLowerCase();
    const androidIntent = button.matches('[data-android-wifi-intent]');
    const ua = navigator.userAgent || '';
    const ios = /iPhone|iPad|iPod/i.test(ua);

    if (security !== 'nopass' && password) {
      // Do not await here on Android: the intent must remain directly tied to the user's tap.
      if (androidIntent) copyText(password).catch(() => false);
      else await copyText(password);
    }

    if (androidIntent) {
      show(security === 'nopass' ? `Selecione a rede ${ssid}` : `Senha copiada · selecione ${ssid}`);
      return { allowDefault: true };
    }
    if (ios) {
      show(security === 'nopass' ? `Ajustes › Wi-Fi › ${ssid}` : `Senha copiada · Ajustes › Wi-Fi › ${ssid}`);
      return { allowDefault: false };
    }
    show(security === 'nopass' ? `Selecione a rede ${ssid}` : `Senha copiada · conecte-se à rede ${ssid}`);
    return { allowDefault: false };
  };

  document.addEventListener('click', async (event) => {
    const copy = event.target.closest('[data-copy]');
    if (copy) {
      event.preventDefault();
      const value = copy.dataset.copy || '';
      const ok = await copyText(value);
      show(ok ? 'Copiado' : 'Não foi possível copiar');
      return;
    }
    const connect = event.target.closest('[data-connect-wifi]');
    if (connect) {
      const result = await connectWifi(connect);
      if (!result?.allowDefault) event.preventDefault();
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
