-- =============================================================
-- CLUBE DO AUGE — conta nova sempre começa "pendente"
-- Execute no Supabase Dashboard → SQL Editor. Pode rodar mais de uma vez.
--
-- O que aconteceu (26/10): uma conta nova de teste entrou direto no app,
-- já liberada, em vez de "Aguardando liberação". A linha da conta em
-- profiles nasce ANTES de o app gravar "pendente" (o banco cria a linha
-- no cadastro, com o plano padrão). O app tenta corrigir para "pendente"
-- logo em seguida, mas o gatilho da 021 — que impede a aluna de mudar o
-- próprio plano — passou a barrar também essa correção.
--
-- Esta migração:
--  1. muda o plano padrão da coluna para 'pendente'
--  2. faz o gatilho forçar 'pendente' em TODA conta nova (inclusive a
--     criada pelo próprio banco no cadastro); só o servidor (service_role)
--     escapa
--  3. deixa a aluna REBAIXAR o próprio plano para 'pendente' (nunca subir)
-- =============================================================

alter table profiles alter column plano set default 'pendente';

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
  return new;
end;
$$;

drop trigger if exists guarda_campos_profile on profiles;
create trigger guarda_campos_profile
  before insert or update on profiles
  for each row execute function guarda_campos_profile();

-- ── Conferência: contas criadas desde 26/10 que já estão liberadas ───────
-- Rode depois. Se aparecer conta que a Dra. Isadora NÃO liberou (como a
-- de teste), volte ela para pendente trocando o e-mail abaixo:
--   update profiles set plano = 'pendente' where email = 'email-da-conta@exemplo.com';
select nome, email, plano, turma_id, data_cadastro
  from profiles
 where data_cadastro >= '2026-10-26'
   and plano not in ('pendente', 'admin')
 order by data_cadastro desc;
