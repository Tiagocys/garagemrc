import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { translateSupabaseError } from "./supabase-errors.js";
const supabase = createClient(window.__ENV.SUPABASE_URL, window.__ENV.SUPABASE_ANON_KEY);

const $ = (s, el=document)=>el.querySelector(s);
const hint = $("#hint");
const form = $("#reset-form");
const msg = $("#msg");

function showMsg(type, text){
  msg.className = `auth-msg ${type||""}`.trim();
  msg.textContent = text || "";
}

function showHTML(type, html){
  msg.className = `auth-msg ${type||""}`.trim();
  msg.innerHTML = html || "";
}

/**
 * Alguns navegadores/Supabase carregam os tokens no fragmento (#access_token...).
 * Estratégia:
 * 1) Registramos o onAuthStateChange (captura PASSWORD_RECOVERY).
 * 2) Chamamos getSession() para garantir que tokens sejam processados.
 * 3) Também checamos a URL por 'type=recovery' / 'access_token' como fallback.
 */

let ready = false;

function maybeEnableForm(session) {
  if (ready) return;
  const hash = new URLSearchParams(location.hash.slice(1));
  const qs = new URLSearchParams(location.search);
  const isRecovery = (qs.get("type")==="recovery") || (hash.get("type")==="recovery");
  const hasAccessToken = hash.has("access_token");

  if (isRecovery || hasAccessToken || session?.user) {
    ready = true;
    hint.textContent = "Digite sua nova senha.";
    form.style.display = "";
  }
}

supabase.auth.onAuthStateChange((event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    maybeEnableForm(session);
  }
});

// Tenta processar tokens e obter sessão
const { data: { session } } = await supabase.auth.getSession();
maybeEnableForm(session);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMsg("", "");

  const p1 = $("#password").value;
  const p2 = $("#password2").value;

  if (p1.length < 6) {
    showMsg("error", "A senha deve ter pelo menos 6 caracteres.");
    return;
  }
  if (p1 !== p2) {
    showMsg("error", "As senhas não coincidem.");
    return;
  }

  // Atualiza a senha do usuário autenticado pelo link de recuperação
  const { data, error } = await supabase.auth.updateUser({ password: p1 });
  if (error) {
    const raw = String(error.message||"").toLowerCase();
    if (/invalid.*token|token.*expired|link.*expired|link.*invalid/.test(raw)) {
      showHTML("error", `Link inválido ou expirado. Solicite um novo link. <a href="/forgot.html" class="auth-link">Clique aqui para voltar</a>`);
    } else {
      showMsg("error", translateSupabaseError(error));
    }
    return;
  }

  showMsg("ok", "Senha alterada com sucesso! Redirecionando…");
  setTimeout(() => window.location.replace("/"), 600);
});

// Se nada habilitou o form (link inválido/expirado)
setTimeout(() => {
  if (!ready) {
    hint.innerHTML = `Link inválido ou expirado. Solicite um novo link. <a href="/forgot.html" class="auth-link">Clique aqui para voltar</a>`;
    form.style.display = "none";
  }
}, 1200);
