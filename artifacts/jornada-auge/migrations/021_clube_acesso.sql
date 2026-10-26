-- =============================================================
-- CLUBE DO AUGE — acesso ao Clube por data (etapa 1)
-- Execute no Supabase Dashboard → SQL Editor. Pode rodar mais de uma vez.
--
-- O Clube vale enquanto profiles.clube_ate for hoje ou depois. Quem mexe
-- nessa data: a mentora (Painel) e, na etapa 3, o Asaas pelo servidor.
-- A aluna NÃO consegue mudar a própria data: o gatilho no fim desta
-- migração devolve o valor antigo se ela tentar pela API. O mesmo vale
-- para plano e turma — antes disso, a política "own profile" deixava a
-- aluna alterar o próprio plano.
--
-- Rede de segurança (regra 12): quem já tem plano 'comunidade' ganha
-- 3 meses de Clube, para ninguém ficar sem acesso no dia em que isto
-- for publicado.
-- =============================================================

alter table profiles add column if not exists clube_ate date;
alter table profiles add column if not exists clube_origem text;   -- manual · cortesia · bonus_jornada · asaas · migracao
alter table profiles add column if not exists clube_status text;   -- ativa · teste · atrasada · cancelada · encerrada
alter table profiles add column if not exists asaas_customer_id text;
alter table profiles add column if not exists asaas_subscription_id text;

update profiles
   set clube_ate = current_date + interval '3 months',
       clube_origem = 'migracao',
       clube_status = 'ativa'
 where plano = 'comunidade' and clube_ate is null;

-- ── A mentora define até quando o Clube vale ─────────────────────────────
create or replace function admin_set_clube(p_user_id uuid, p_ate date, p_origem text default 'cortesia')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and plano = 'admin') then
    raise exception 'apenas a mentora';
  end if;
  update profiles
     set clube_ate = p_ate,
         clube_origem = coalesce(p_origem, clube_origem),
         clube_status = case when p_ate is not null and p_ate >= current_date then 'ativa' else 'encerrada' end
   where id = p_user_id;
end;
$$;

-- ── O Painel lê a situação do Clube de todas as alunas ───────────────────
create or replace function admin_get_clube()
returns table (id uuid, clube_ate date, clube_origem text, clube_status text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from profiles p where p.id = auth.uid() and p.plano = 'admin') then
    raise exception 'apenas a mentora';
  end if;
  return query select p.id, p.clube_ate, p.clube_origem, p.clube_status from profiles p;
end;
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on function admin_set_clube(uuid, date, text) from public, anon;
    revoke all on function admin_get_clube() from public, anon;
    grant execute on function admin_set_clube(uuid, date, text) to authenticated;
    grant execute on function admin_get_clube() to authenticated;
  end if;
end $$;

-- ── A aluna não altera plano, turma nem o próprio Clube ──────────────────
-- Vale só para quem chega pela API como aluna (papéis anon/authenticated).
-- As funções da mentora (security definer) e o servidor (service_role)
-- passam direto, e a mentora também (pela conta admin).
create or replace function guarda_campos_profile()
returns trigger
language plpgsql
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  -- quem chama é a mentora (mesmo por uma função que não seja security definer)
  if exists (select 1 from profiles where id = auth.uid() and plano = 'admin') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.plano := 'pendente';
    new.turma_id := null;
    new.clube_ate := null;
    new.clube_origem := null;
    new.clube_status := null;
    new.asaas_customer_id := null;
    new.asaas_subscription_id := null;
    return new;
  end if;
  begin
    new.plano := old.plano;
    new.turma_id := old.turma_id;
    new.clube_ate := old.clube_ate;
    new.clube_origem := old.clube_origem;
    new.clube_status := old.clube_status;
    new.asaas_customer_id := old.asaas_customer_id;
    new.asaas_subscription_id := old.asaas_subscription_id;
  end;
  return new;
end;
$$;

drop trigger if exists guarda_campos_profile on profiles;
create trigger guarda_campos_profile
  before insert or update on profiles
  for each row execute function guarda_campos_profile();
