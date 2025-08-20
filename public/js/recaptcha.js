export async function getRecaptchaToken(siteKey, action) {
  if (!siteKey) throw new Error("Missing RECAPTCHA_SITE_KEY");
  if (!window.grecaptcha) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      s.async = true; s.defer = true;
      s.onload = resolve; s.onerror = () => reject(new Error("reCAPTCHA failed to load"));
      document.head.appendChild(s);
    });
  }
  return await grecaptcha.execute(siteKey, { action });
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
