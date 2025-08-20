// Carregamento robusto + cacheado + ready()
let _recaptchaLoadPromise = null;

export function ensureRecaptcha(siteKey) {
  if (!siteKey) return Promise.reject(new Error("Missing RECAPTCHA_SITE_KEY"));
  if (_recaptchaLoadPromise) return _recaptchaLoadPromise;

  _recaptchaLoadPromise = new Promise((resolve, reject) => {
    if (window.grecaptcha?.execute) {
      // já carregado
      window.grecaptcha.ready(resolve);
      return;
    }
    const s = document.createElement("script");
    s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    s.async = true;
    s.defer = true;
    s.onload = () => {
      if (!window.grecaptcha) return reject(new Error("grecaptcha not found"));
      window.grecaptcha.ready(resolve);
    };
    s.onerror = () => reject(new Error("reCAPTCHA failed to load"));
    document.head.appendChild(s);
  });

  return _recaptchaLoadPromise;
}

export async function getRecaptchaToken(siteKey, action) {
  await ensureRecaptcha(siteKey); // garante carregado + ready()
  return await window.grecaptcha.execute(siteKey, { action });
}

export async function verifyRecaptcha(token, action) {
  const res = await fetch("/api/recaptcha-verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, action })
  });
  const data = await res.json();
  if (!data.ok) throw new Error("recaptcha_fail");
  return data;
}
