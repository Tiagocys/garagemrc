import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(window.__ENV.SUPABASE_URL, window.__ENV.SUPABASE_ANON_KEY);
const $ = (s) => document.querySelector(s);
const msg = $("#msg");

function show(type, text){
  msg.className = `auth-msg ${type||""}`.trim();
  msg.textContent = text || "";
}

// Se já estiver logado, manda pra home
const { data: { session } } = await supabase.auth.getSession();
if (session) window.location.replace("/");

$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  show("", "");

  const email = $("#email").value.trim();
  const password = $("#password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // mensagens amigáveis comuns
    const m = (error.message||"").toLowerCase();
    if (m.includes("email not confirmed") || m.includes("confirm")) {
      show("error", "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.");
    } else if (m.includes("invalid login") || m.includes("invalid credentials")) {
      show("error", "E-mail ou senha inválidos.");
    } else {
      show("error", error.message || "Erro ao entrar.");
    }
    return;
  }
  show("ok", "Login realizado! Redirecionando…");
  setTimeout(()=>window.location.replace("/"), 300);
});

$("#google-btn").addEventListener("click", async () => {
  show("", "");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${location.origin}/oauth-redirect.html`,
      queryParams: { prompt: "consent", access_type: "offline" }
    }
  });
  if (error) show("error", error.message || "Erro no Google OAuth.");
});
