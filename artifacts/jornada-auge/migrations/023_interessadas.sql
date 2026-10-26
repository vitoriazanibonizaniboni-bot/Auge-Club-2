-- =============================================================
-- CLUBE DO AUGE — dispensar pedido de acesso (guardar como interessada)
-- Execute no Supabase Dashboard → SQL Editor. Pode rodar mais de uma vez.
--
-- A Dra. Isadora divulgou o app no Instagram e chegaram pedidos de quem
-- não está na Jornada. Hoje o app é só das alunas da Jornada, mas essas
-- mulheres são possíveis assinantes do Clube. Em vez de apagar:
--  - "Dispensar" tira a conta de "Aguardando liberação" e marca a data
--    em profiles.dispensada_em; o plano continua 'pendente'
--  - o Painel mostra essas contas em "Interessadas", para liberar depois
--  - no app, ela vê um aviso: o app é das alunas da Jornada; quem tiver
--    interesse fala pelo WhatsApp
-- Coluna nova em vez de um plano novo, para não esbarrar em alguma regra
-- que limite os valores de plano.
-- =============================================================

alter table profiles add column if not exists dispensada_em timestamptz;

-- A aluna não muda a própria marca (mesmo gatilho da 021/022, com a coluna nova)
create or replace function guarda_campos_profile()
returns trigger
language plpgsql
as $$
begin
  -- conta nova: sempre pendente, venha de onde vier (o servidor escapa)
  if tg_op = 'INSERT' then
    if current_user = 'service_role' then
      return new;
    end if;
    new.plano := 'pendente';
    new.turma_id := null;
    new.clube_ate := null;
    new.clube_origem := null;
    new.clube_status := null;
    new.asaas_customer_id := null;
    new.asaas_subscription_id := null;
    new.dispensada_em := null;
    return new;
  end if;

  -- alteração: só a aluna (anon/authenticated) é barrada
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if exists (select 1 from profiles where id = auth.uid() and plano = 'admin') then
    return new;
  end if;
  if new.plano is distinct from 'pendente' then
    new.plano := old.plano;          -- pode rebaixar para pendente, nunca subir
  end if;
  new.turma_id := old.turma_id;
  new.clube_ate := old.clube_ate;
  new.clube_origem := old.clube_origem;
  new.clube_status := old.clube_status;
  new.asaas_customer_id := old.asaas_customer_id;
  new.asaas_subscription_id := old.asaas_subscription_id;
  new.dispensada_em := old.dispensada_em;
  return new;
end;
$$;

drop trigger if exists guarda_campos_profile on profiles;
create trigger guarda_campos_profile
  before insert or update on profiles
  for each row execute function guarda_campos_profile();

-- ── Dispensar / voltar para a lista ─────────────────────────────────────
create or replace function admin_dispensar(p_user_id uuid, p_dispensar boolean default true)
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
     set dispensada_em = case when p_dispensar then now() else null end
   where id = p_user_id and plano = 'pendente';
end;
$$;

-- ── Lista das interessadas (dispensadas e ainda pendentes) ───────────────
create or replace function admin_get_interessadas()
returns table (id uuid, nome text, email text, dispensada_em timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from profiles p where p.id = auth.uid() and p.plano = 'admin') then
    raise exception 'apenas a mentora';
  end if;
  return query
    select p.id, p.nome, p.email, p.dispensada_em
      from profiles p
     where p.plano = 'pendente' and p.dispensada_em is not null
     order by p.dispensada_em desc;
end;
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on function admin_dispensar(uuid, boolean) from public, anon;
    revoke all on function admin_get_interessadas() from public, anon;
    grant execute on function admin_dispensar(uuid, boolean) to authenticated;
    grant execute on function admin_get_interessadas() to authenticated;
  end if;
end $$;
