// public/js/nav.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(window.__ENV.SUPABASE_URL, window.__ENV.SUPABASE_ANON_KEY);
const root = document.getElementById("site-nav");

const MENU_ICON = "/assets/menu.svg";
const LOGO = "/assets/logo.svg";
const PLACEHOLDER = `${location.origin}/assets/avatar.svg`;

const $ = (s, el=document)=>el.querySelector(s);
const $$ = (s, el=document)=>Array.from(el.querySelectorAll(s));

function cacheKey(uid){ return `grc_profile_${uid}`; }

async function getProfile(uid) {
  const key = cacheKey(uid);
  const cached = sessionStorage.getItem(key);
  if (cached) {
    try { return JSON.parse(cached); } catch {}
  }
  const { data } = await supabase
    .from("users")
    .select("avatar_url, display_name")
    .eq("id", uid)
    .single();
  if (data) sessionStorage.setItem(key, JSON.stringify(data));
  return data || { avatar_url: PLACEHOLDER };
}

function closeOnOutsideClick(container, closeFn){
  function handler(ev){
    if (!container.contains(ev.target)) {
      closeFn(); document.removeEventListener("click", handler);
    }
  }
  setTimeout(()=>document.addEventListener("click", handler), 0);
}

function renderSkeleton(isLogged){
  root.innerHTML = `
    <header class="grc-nav" role="banner">
      <nav class="grc-nav-inner" aria-label="Navegação principal">
        <div class="grc-left">
          <img src="${MENU_ICON}" alt="Menu" class="grc-menu" id="menu-btn" decoding="async" style="display:none;">
          <img src="${LOGO}" alt="GaragemRC" class="grc-logo" decoding="async">
        </div>
        <div class="grc-right">
          ${isLogged ? `
            <div class="grc-profile" id="grc-profile">
              <img src="${PLACEHOLDER}" alt="Seu avatar" class="grc-avatar"
                   id="grc-avatar" role="button" tabindex="0"
                   aria-haspopup="menu" aria-expanded="false" decoding="async">
              <div class="grc-popover" id="grc-profile-menu" role="menu" aria-hidden="true">
                <button id="grc-logout" role="menuitem">Sair</button>
              </div>
            </div>` : `
            <a href="/login.html" class="grc-enter">Entrar</a>`
          }
        </div>
      </nav>
    </header>
  `;
  const menuBtn = $("#menu-btn", root);
  if (menuBtn) menuBtn.addEventListener("click", () => console.log("menu click"));
}

function wireProfileMenu(){
  const profile = $("#grc-profile", root);
  if (!profile) return;
  const avatar = $("#grc-avatar", profile);
  const pop = $("#grc-profile-menu", profile);
  const logoutBtn = $("#grc-logout", profile);

  function open() {
    pop.classList.add("open");
    pop.setAttribute("aria-hidden","false");
    avatar.setAttribute("aria-expanded","true");
    closeOnOutsideClick(profile, close);
  }
  function close() {
    pop.classList.remove("open");
    pop.setAttribute("aria-hidden","true");
    avatar.setAttribute("aria-expanded","false");
  }
  function toggle(){ pop.classList.contains("open") ? close() : open(); }

  avatar.addEventListener("click", toggle);
  avatar.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    if (e.key === "Escape") close();
  });

  logoutBtn.addEventListener("click", async () => {
    // limpa cache do perfil
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) sessionStorage.removeItem(cacheKey(session.user.id));

    await supabase.auth.signOut();
    window.location.replace("/");
  });
}

async function render(session) {
  renderSkeleton(!!session?.user);

  if (session?.user) {
    const img = $("#grc-avatar", root);
    const profile = await getProfile(session.user.id);
    if (img && profile?.avatar_url) {
      img.src = profile.avatar_url;
      img.title = profile.display_name || "Você está logado";
    }
    wireProfileMenu();
  }
}

// inicial
const { data: { session } } = await supabase.auth.getSession();
let currentSession = session;
await render(currentSession);

// reage a auth
supabase.auth.onAuthStateChange((event, newSession) => {
  if (event === "SIGNED_OUT" && currentSession?.user?.id) {
    sessionStorage.removeItem(cacheKey(currentSession.user.id));
  }
  currentSession = newSession;
  render(newSession);
});
