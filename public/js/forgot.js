import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getRecaptchaToken, verifyRecaptcha } from "./recaptcha.js";

const supabase = createClient(window.__ENV.SUPABASE_URL, window.__ENV.SUPABASE_ANON_KEY);
const $ = (s) => document.querySelector(s);
const msg = $("#msg");
const SITE_KEY = window.__ENV.RECAPTCHA_SITE_KEY;

function show(type, text){
  msg.className = `auth-msg ${type||""}`.trim();
  msg.textContent = text || "";
}
function showHTML(type, html){
  msg.className = `auth-msg ${type||""}`.trim();
  msg.innerHTML = html || "";
}

$("#forgot-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  show("", "");

  const email = $("#email").value.trim();
  const form = e.currentTarget;
  if (!form.checkValidity()) { form.reportValidity(); return; }

  // reCAPTCHA v3 → action "forgot"
  try {
    const token = await getRecaptchaToken(SITE_KEY, "forgot");
    await verifyRecaptcha(token, "forgot");
  } catch {
    show("error", "Validação de segurança falhou. Recarregue a página e tente novamente.");
    return;
  }

  // Envia o e-mail com link; redireciona para /reset-password.html
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${location.origin}/reset-password.html`
  });

  // Evitar enumeração de e-mails: retornamos mensagem genérica
  if (error) {
    // Só mostra detalhado se for erro de rede/sintaxe
    if (/network/i.test(error.message)) {
      show("error", "Falha de rede. Tente novamente.");
    } else {
      showHTML("ok", `Se houver uma conta para este e-mail, enviaremos um link para redefinir a senha. <a href="/login.html" class="auth-link">Clique aqui para voltar</a>`);
    }
    return;
  }
  showHTML("ok", `Se houver uma conta para este e-mail, enviaremos um link para redefinir a senha. <a href="/login.html" class="auth-link">Clique aqui para voltar</a>`);
});
