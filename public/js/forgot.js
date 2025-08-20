import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabase = createClient(window.__ENV.SUPABASE_URL, window.__ENV.SUPABASE_ANON_KEY);
const $ = (s) => document.querySelector(s);
const msg = $("#msg");

function show(type, text){
  msg.className = `auth-msg ${type||""}`.trim();
  msg.textContent = text || "";
}

$("#forgot-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  show("", "");

  const email = $("#email").value.trim();
  const form = e.currentTarget;
  if (!form.checkValidity()) { form.reportValidity(); return; }

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
      show("ok", "Se houver uma conta para este e-mail, enviaremos um link para redefinir a senha.");
    }
    return;
  }
  show("ok", "Se houver uma conta para este e-mail, enviaremos um link para redefinir a senha.");
});
