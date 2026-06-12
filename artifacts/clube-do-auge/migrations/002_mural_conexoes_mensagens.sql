-- =============================================================
-- CLUBE DO AUGE — Etapas 2, 5 e 6 (Mural, Mensagens, Match)
-- Execute no Supabase Dashboard → SQL Editor
--
-- IMPORTANTE: este SQL substitui os que foram passados antes.
-- Correções em relação à versão anterior:
--   1. Os posts do Mural ficam na tabela `feed` (não `posts` —
--      "posts" é apenas o bucket de storage das fotos). O FK de
--      comentarios agora aponta para feed(id).
--   2. comentarios ganha a coluna autor_nome: a RLS de profiles
--      ("own profile") impede ler o nome de outras alunas via
--      join, então o nome é gravado junto com o comentário —
--      mesmo padrão já usado na tabela feed (autor_nome).
--   3. A tabela conexoes antiga (user1_id/user2_id) é recriada
--      no modelo solicitação → aceite, e as funções RPC são
--      atualizadas (security definer contorna a RLS de profiles).
-- =============================================================

-- -------------------------------------------------------------
-- ETAPA 2 — Comentários persistentes do Mural
-- -------------------------------------------------------------
drop table if exists comentarios;

create table comentarios (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references feed(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  autor_nome text,
  texto text not null,
  created_at timestamptz default now()
);

alter table comentarios enable row level security;

create policy "Comentários visíveis para autenticadas"
  on comentarios for select to authenticated using (true);

create policy "Usuária comenta como ela mesma"
  on comentarios for insert to authenticated
  with check (auth.uid() = user_id);

-- -------------------------------------------------------------
-- ETAPA 5 — Mensagens não lidas
-- -------------------------------------------------------------
alter table mensagens add column if not exists lida boolean default false;

-- A destinatária precisa poder marcar como lida
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'mensagens'
      and policyname = 'Destinatária marca como lida'
  ) then
    execute 'create policy "Destinatária marca como lida"
      on mensagens for update to authenticated
      using (auth.uid() = para_user_id)
      with check (auth.uid() = para_user_id)';
  end if;
end $$;

-- -------------------------------------------------------------
-- ETAPA 6 — Match no Radar de Amigas (solicitação → aceite)
-- -------------------------------------------------------------
drop function if exists get_conexoes_profiles(uuid);
drop table if exists conexoes;

create table conexoes (
  id uuid default gen_random_uuid() primary key,
  solicitante_id uuid references auth.users(id) not null,
  destinataria_id uuid references auth.users(id) not null,
  status text default 'pendente' check (status in ('pendente','aceita','recusada')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (solicitante_id, destinataria_id)
);

alter table conexoes enable row level security;

create policy "Vê conexões próprias"
  on conexoes for select to authenticated
  using (auth.uid() = solicitante_id or auth.uid() = destinataria_id);

create policy "Solicita como ela mesma"
  on conexoes for insert to authenticated
  with check (auth.uid() = solicitante_id);

create policy "Destinatária responde"
  on conexoes for update to authenticated
  using (auth.uid() = destinataria_id);

-- Perfis das conexões ACEITAS (em qualquer direção)
create or replace function get_conexoes_profiles(uid uuid)
returns setof profiles
language sql security definer set search_path = public as $$
  select p.* from profiles p
  where p.id in (
    select case
      when c.solicitante_id = uid then c.destinataria_id
      else c.solicitante_id
    end
    from conexoes c
    where c.status = 'aceita'
      and (c.solicitante_id = uid or c.destinataria_id = uid)
  );
$$;

-- Perfis das solicitantes PENDENTES para a destinatária uid
create or replace function get_solicitacoes_profiles(uid uuid)
returns setof profiles
language sql security definer set search_path = public as $$
  select p.* from profiles p
  where p.id in (
    select c.solicitante_id
    from conexoes c
    where c.destinataria_id = uid and c.status = 'pendente'
  );
$$;
