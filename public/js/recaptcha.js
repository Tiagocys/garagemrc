// /public/js/recaptcha.js
let _recaptchaLoadPromise = null;

function waitForReady(resolve) {
  // espera até grecaptcha existir e ter .ready
  if (window.grecaptcha && typeof window.grecaptcha.ready === "function") {
    window.grecaptcha.ready(resolve);
  } else {
    setTimeout(() => waitForReady(resolve), 30);
  }
}

export function ensureRecaptcha(siteKey) {
  if (!siteKey) return Promise.reject(new Error("Missing RECAPTCHA_SITE_KEY"));
  if (_recaptchaLoadPromise) return _recaptchaLoadPromise;

  _recaptchaLoadPromise = new Promise((resolve, reject) => {
    if (window.grecaptcha?.execute) {
      // já carregado
      window.grecaptcha.ready(resolve);
      return;
    }
    // evita duplicar script
    if (!document.getElementById("grc-recaptcha")) {
      const s = document.createElement("script");
      s.id = "grc-recaptcha";
      s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      s.async = true; s.defer = true;
      s.onerror = () => reject(new Error("reCAPTCHA failed to load"));
      document.head.appendChild(s);
    }
    // em vez de checar no onload, aguardamos até .ready existir
    waitForReady(resolve);
  });

  return _recaptchaLoadPromise;
}

export async function getRecaptchaToken(siteKey, action) {
  await ensureRecaptcha(siteKey);               // garante script + ready()
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
