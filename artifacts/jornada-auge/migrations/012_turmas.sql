-- =============================================================
-- CLUBE DO AUGE — Turmas (até 3 turmas rodando ao mesmo tempo)
-- Execute no Supabase Dashboard → SQL Editor
--
-- Hoje existe UMA data de início para todo mundo, em
-- config.jornada_inicio. É dela que sai a semana da aluna, o
-- desbloqueio do Sono na S5 e do Tempo para Si na S9.
--
-- Com mais de uma turma, cada turma precisa da sua própria data.
-- Esta migração cria a tabela das turmas e o campo turma_id no
-- perfil da aluna. Ninguém fica sem app: quem estiver sem turma
-- continua caindo na data antiga do config.
--
-- As alunas de hoje entram na Turma 1, que já nasce com a data
-- que está no config (03/08/2026).
-- =============================================================

create table if not exists turmas (
  id text primary key,          -- 't1', 't2', 't3'
  nome text not null,
  inicio date,                  -- segunda-feira da Semana 1 desta turma
  ativa boolean default true,
  ordem int default 0
);

-- Cada turma tem o seu proprio encontro: data, duracao, link do Meet
-- e desafio da semana. Antes isso era um valor so, igual para todas.
alter table turmas add column if not exists mentoria_data text;
alter table turmas add column if not exists mentoria_duracao text;
alter table turmas add column if not exists zoom text;
alter table turmas add column if not exists desafio text;

insert into turmas (id, nome, inicio, ordem) values
  ('t1', 'Turma 1', (select nullif(valor, '')::date from config where id = 'jornada_inicio'), 1),
  ('t2', 'Turma 2', null, 2),
  ('t3', 'Turma 3', null, 3)
on conflict (id) do nothing;

alter table profiles add column if not exists turma_id text references turmas(id);

-- A Turma 1 herda o encontro que hoje está no config, para nada mudar
-- para quem já está usando o app.
update turmas t
   set mentoria_data = coalesce(t.mentoria_data, (select valor from config where id = 'mentoria_data')),
       mentoria_duracao = coalesce(t.mentoria_duracao, (select valor from config where id = 'mentoria_duracao')),
       zoom = coalesce(t.zoom, (select valor from config where id = 'mentoria_zoom')),
       desafio = coalesce(t.desafio, (select valor from config where id = 'desafio_texto'))
 where t.id = 't1';

-- As alunas que já estão usando o app viram Turma 1.
update profiles
   set turma_id = 't1'
 where turma_id is null
   and plano in ('jornada', 'comunidade');

-- Toda aluna precisa ler a data de início da própria turma.
-- É leitura apenas; quem escreve são as funções admin abaixo.
alter table turmas enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'turmas'
      and policyname = 'turmas leitura'
  ) then
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute 'create policy "turmas leitura" on turmas for select to authenticated using (true)';
    else
      execute 'create policy "turmas leitura" on turmas for select using (true)';
    end if;
  end if;
end $$;

-- =============================================================
-- Funções do Painel da Mentora
-- Mesmo padrão das outras *_admin: rodam com permissão elevada,
-- mas só depois de confirmar que quem chamou é admin. Quem não
-- for recebe erro, não silêncio.
-- =============================================================

-- Põe (ou tira) a aluna de uma turma.
create or replace function admin_set_turma(p_user_id uuid, p_turma text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.plano = 'admin'
  ) then
    raise exception 'Acesso restrito ao Painel da Mentora';
  end if;

  update profiles set turma_id = nullif(p_turma, '') where id = p_user_id;
end $$;

-- Salva os dados de uma turma: nome, início e o encontro dela.
drop function if exists admin_salvar_turma(text, text, date);

create or replace function admin_salvar_turma(
  p_id text,
  p_nome text,
  p_inicio date,
  p_mentoria_data text default null,
  p_mentoria_duracao text default null,
  p_zoom text default null,
  p_desafio text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.plano = 'admin'
  ) then
    raise exception 'Acesso restrito ao Painel da Mentora';
  end if;

  update turmas
     set nome = coalesce(nullif(p_nome, ''), nome),
         inicio = p_inicio,
         mentoria_data = p_mentoria_data,
         mentoria_duracao = p_mentoria_duracao,
         zoom = p_zoom,
         desafio = p_desafio
   where id = p_id;
end $$;

revoke all on function admin_set_turma(uuid, text) from public;
revoke all on function admin_salvar_turma(text, text, date, text, text, text, text) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on function admin_set_turma(uuid, text) from anon';
    execute 'revoke all on function admin_salvar_turma(text, text, date, text, text, text, text) from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'grant execute on function admin_set_turma(uuid, text) to authenticated';
    execute 'grant execute on function admin_salvar_turma(text, text, date, text, text, text, text) to authenticated';
  end if;
end $$;
