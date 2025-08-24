import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { translateSupabaseError } from "./supabase-errors.js";
import { ensureRecaptcha, getRecaptchaToken, verifyRecaptcha } from "./recaptcha.js?v=3"; // cache-bust


const supabase = createClient(window.__ENV.SUPABASE_URL, window.__ENV.SUPABASE_ANON_KEY);
const $ = (sel) => document.querySelector(sel);
const msg = $("#msg");
const SITE_KEY = window.__ENV.RECAPTCHA_SITE_KEY;
// pré-carrega o reCAPTCHA assim que a página/JS carregar
ensureRecaptcha(SITE_KEY).catch(() => {});

function show(type, text) {
  msg.className = `auth-msg ${type}`;
  msg.textContent = text;
}

$("#signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  show("", "");

  const email = $("#email").value.trim();
  const display_name = $("#display_name").value.trim();
  const password = $("#password").value;
  const defaultAvatar = `${location.origin}/assets/avatar.svg`;
  const btn = e.submitter; btn?.setAttribute("disabled","true");
  // Validação HTML5
  const form = e.currentTarget;
  if (!form.checkValidity()) { form.reportValidity(); return; }

  // reCAPTCHA v3 → action "signup"
  try {
    const token = await getRecaptchaToken(SITE_KEY, "signup");
    await verifyRecaptcha(token, "signup");
  } catch {
    show("error", "Validação de segurança falhou. Recarregue a página e tente novamente.");
    return;
  } finally {
    btn?.removeAttribute("disabled");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name, avatar_url: defaultAvatar },
      emailRedirectTo: `${location.origin}/oauth-redirect.html`
    }
  });

  if (error) {
    if (error) { show("error", (translateSupabaseError?.(error)) || error.message || "Erro ao criar conta."); return; }
    return;
  }

  // Se confirmação por e-mail estiver DESLIGADA, já teremos sessão.
  // Se estiver LIGADA, orientamos o usuário a verificar a caixa de entrada.
  const { data: s } = await supabase.auth.getSession();
  if (s?.session) {
    show("ok", "Conta criada! Redirecionando…");
    setTimeout(() => (window.location.href = "/"), 600);
  } else {
    show("ok", "Enviamos um e-mail de confirmação. Verifique sua caixa de entrada.");
  }
});

$("#google-btn").addEventListener("click", async () => {
  show("", "");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${location.origin}/oauth-redirect.html`,
      // Força consentimento na primeira vez e garante refresh_token
      queryParams: { prompt: "consent", access_type: "offline" }
    }
  });
  if (error) show("error", error.message || "Erro no Google OAuth.");
});
