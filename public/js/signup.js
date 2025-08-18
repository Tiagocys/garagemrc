import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(window.__ENV.SUPABASE_URL, window.__ENV.SUPABASE_ANON_KEY);
const $ = (sel) => document.querySelector(sel);
const msg = $("#msg");

function show(type, text) {
  msg.className = `msg ${type}`;
  msg.textContent = text;
}

$("#signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  show("", "");

  const email = $("#email").value.trim();
  const display_name = $("#display_name").value.trim();
  const password = $("#password").value;
  const defaultAvatar = `${location.origin}/assets/avatar.svg`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name },
      data: { display_name, avatar_url: defaultAvatar },
      emailRedirectTo: `${location.origin}/oauth-redirect.html`
    }
  });

  if (error) {
    show("error", error.message || "Erro ao criar conta.");
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
