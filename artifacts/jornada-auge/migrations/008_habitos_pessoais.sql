-- =============================================================
-- CLUBE DO AUGE — Meus hábitos (hábitos criados pela aluna)
-- Execute no Supabase Dashboard → SQL Editor
--
-- Os 3 hábitos angulares (movimento, sono, tempo) continuam fixos
-- no código. Esta tabela guarda só os hábitos que a própria aluna
-- cria na tela Hoje, em "Meus hábitos".
--
-- As marcações NÃO precisam de tabela nova: continuam indo para
-- "registros", porque a coluna "habito" é texto e aceita o id
-- deste hábito do mesmo jeito que aceita 'movimento'.
-- =============================================================

create table if not exists habitos_pessoais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  nome text not null,
  icone text,
  meta int,                                  -- vezes por semana; null = sem meta
  ordem int default 0,
  ativo boolean default true,
  created_at timestamptz default now()
);

create index if not exists habitos_pessoais_user_idx
  on habitos_pessoais (user_id, ativo, ordem);

alter table habitos_pessoais enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'habitos_pessoais'
      and policyname = 'own habitos_pessoais'
  ) then
    execute 'create policy "own habitos_pessoais" on habitos_pessoais for all using (auth.uid()=user_id)';
  end if;
end $$;
