-- Tipo de status (já pronto para futura suspensão/remoção)
create type user_status as enum ('active','disabled');

-- Tabela pública de perfis
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null check (char_length(display_name) between 2 and 50),
  avatar_url text,
  status user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.users enable row level security;

-- Política: qualquer usuário autenticado pode ler (mantemos e-mail, mas você pode ocultar depois se preferir)
create policy "users_select_authenticated"
on public.users for select
to authenticated
using (true);

-- Política: cada usuário só edita seu próprio perfil
create policy "users_update_own"
on public.users for update
to authenticated
using (auth.uid() = id);

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- Trigger para inserir em public.users quando auth.users receber um novo usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
  v_avatar text;
begin
  v_display_name := coalesce(
    new.raw_user_meta_data->>'display_name',  -- do formulário
    new.raw_user_meta_data->>'given_name',    -- Google
    new.raw_user_meta_data->>'name',          -- Google
    new.raw_user_meta_data->>'full_name',
    split_part(coalesce(new.email,''), '@', 1) -- fallback: antes do @
  );

  v_avatar := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    null
  );

  insert into public.users (id, email, display_name, avatar_url)
  values (new.id, new.email, v_display_name, v_avatar);

  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
