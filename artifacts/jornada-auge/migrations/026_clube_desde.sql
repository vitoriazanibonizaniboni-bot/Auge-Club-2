-- =============================================================
-- CLUBE DO AUGE — desde quando a aluna está no Clube
-- Execute no Supabase Dashboard → SQL Editor. Pode rodar mais de uma vez.
--
-- Para os marcos de 1, 3, 6 e 12 meses de Clube (03/11), o app precisa
-- saber o dia em que a aluna entrou. profiles.clube_desde é preenchido
-- SOZINHO pelo banco sempre que o Clube passa de "sem acesso" (vazio ou
-- vencido) para "ativo" — venha a liberação da mentora (Painel), do
-- Asaas (pagamento) ou do cadastro feito depois do pagamento. Se o Clube
-- vence e ela volta depois, a contagem recomeça do dia da volta.
--
-- A aluna não altera esse campo pela API (gatilho de proteção, refeito
-- abaixo com o campo novo; o resto fica igual à 024).
-- =============================================================

alter table profiles add column if not exists clube_desde date;

-- Quem já está com o Clube ativo começa a contar de hoje
update profiles
   set clube_desde = current_date
 where clube_desde is null
   and clube_ate >= current_date;

create or replace function guarda_campos_profile()
returns trigger
language plpgsql
as $$
begin
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
    new.grupo_removida_em := null;
    new.clube_desde := null;
    return new;
  end if;

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
  new.grupo_removida_em := old.grupo_removida_em;
  new.telefone := old.telefone;   -- vem do Asaas; a mentora usa para achar ela no grupo
  new.clube_desde := old.clube_desde;
  return new;
end;
$$;

drop trigger if exists guarda_campos_profile on profiles;
create trigger guarda_campos_profile
  before insert or update on profiles
  for each row execute function guarda_campos_profile();

-- ── Marca o início do Clube quando ele passa a valer ──────────────────────
-- Roda depois do gatilho de proteção (ordem alfabética dos nomes), então
-- só vale para mudanças que a proteção deixou passar (mentora, servidor).
create or replace function marca_clube_desde()
returns trigger
language plpgsql
as $$
begin
  if new.clube_ate is not null and new.clube_ate >= current_date then
    if tg_op = 'INSERT' then
      new.clube_desde := coalesce(new.clube_desde, current_date);
    elsif old.clube_ate is null or old.clube_ate < current_date or new.clube_desde is null then
      new.clube_desde := current_date;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists marca_clube_desde on profiles;
create trigger marca_clube_desde
  before insert or update on profiles
  for each row execute function marca_clube_desde();
