-- =============================================================
-- CLUBE DO AUGE — Um desafio para cada semana, por turma
-- Execute no Supabase Dashboard → SQL Editor
--
-- Hoje o desafio é UM texto só, em turmas.desafio. Quando a Dra.
-- Isadora troca, o anterior some: não dá para saber qual foi o
-- desafio da Semana 1, da 2, da 3.
--
-- Esta tabela guarda um desafio por semana e por turma. Com isso a
-- Trajetória consegue mostrar, em cada semana, qual era o desafio
-- daquela semana — e o histórico para de se perder.
--
-- O texto que está hoje em turmas.desafio é copiado para a semana
-- em que cada turma está agora, para nada mudar na tela da aluna.
-- =============================================================

create table if not exists desafios_semana (
  turma_id text references turmas(id) on delete cascade not null,
  semana int not null check (semana between 1 and 12),
  texto text,
  primary key (turma_id, semana)
);

alter table desafios_semana enable row level security;

-- Toda aluna precisa ler o desafio da turma dela. Escrita só pela
-- função admin abaixo.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'desafios_semana'
      and policyname = 'desafios leitura'
  ) then
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute 'create policy "desafios leitura" on desafios_semana for select to authenticated using (true)';
    else
      execute 'create policy "desafios leitura" on desafios_semana for select using (true)';
    end if;
  end if;
end $$;

-- O desafio que está no ar hoje vira o desafio da semana atual de
-- cada turma. Turma sem data de início ou sem desafio fica de fora.
insert into desafios_semana (turma_id, semana, texto)
select t.id,
       least(12, greatest(1,
         (date_trunc('week', current_date)::date - date_trunc('week', t.inicio)::date) / 7 + 1
       )),
       t.desafio
  from turmas t
 where t.inicio is not null
   and nullif(t.desafio, '') is not null
on conflict (turma_id, semana) do nothing;

-- =============================================================
-- Escrita pelo Painel da Mentora
-- Mesmo padrão das outras admin: confere se quem chamou é admin na
-- primeira linha e levanta erro se não for.
-- =============================================================

create or replace function admin_salvar_desafio_semana(p_turma text, p_semana int, p_texto text)
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

  if p_semana < 1 or p_semana > 12 then
    raise exception 'Semana fora da Jornada: %', p_semana;
  end if;

  insert into desafios_semana (turma_id, semana, texto)
  values (p_turma, p_semana, nullif(btrim(p_texto), ''))
  on conflict (turma_id, semana) do update set texto = excluded.texto;
end $$;

revoke all on function admin_salvar_desafio_semana(text, int, text) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on function admin_salvar_desafio_semana(text, int, text) from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'grant execute on function admin_salvar_desafio_semana(text, int, text) to authenticated';
  end if;
end $$;
