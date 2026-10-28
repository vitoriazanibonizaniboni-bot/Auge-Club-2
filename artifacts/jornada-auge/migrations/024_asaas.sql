-- =============================================================
-- CLUBE DO AUGE — pagamento do Clube pelo Asaas (etapa 3)
-- Execute no Supabase Dashboard → SQL Editor. Pode rodar mais de uma vez.
--
-- Como funciona:
--  - A aluna paga a mensalidade num link de assinatura do Asaas, FORA do app.
--  - O Asaas avisa o servidor (api/asaas.mjs). O servidor procura a conta
--    pelo e-mail e estende profiles.clube_ate. Também guarda o telefone dela.
--  - Se ela pagou e ainda não criou conta, o pagamento fica em `assinaturas`.
--    Quando ela se cadastra com o MESMO e-mail, o gatilho do fim desta
--    migração libera o Clube na hora.
--  - O Painel mostra o "Grupo do WhatsApp": quem pode estar no grupo
--    (Clube ativo) e quem deve sair (Clube encerrado), com telefone.
--
-- Tudo aqui é lido e escrito só pelo servidor (service_role) e pelas
-- funções da mentora. As alunas não enxergam nenhuma destas tabelas.
-- =============================================================

alter table profiles add column if not exists telefone text;
alter table profiles add column if not exists grupo_removida_em timestamptz;

-- O telefone (vem do Asaas) e a marca "já removi do grupo" não são editáveis
-- pela aluna pela API: refaz o gatilho da 023 incluindo os dois (o resto
-- fica igual).
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
  return new;
end;
$$;

drop trigger if exists guarda_campos_profile on profiles;
create trigger guarda_campos_profile
  before insert or update on profiles
  for each row execute function guarda_campos_profile();

-- ── Assinaturas do Asaas (inclusive de quem ainda não criou conta) ────────
create table if not exists assinaturas (
  asaas_customer_id text primary key,
  asaas_subscription_id text,
  email text,
  nome text,
  telefone text,
  status text,                 -- ativa · atrasada · cancelada · encerrada
  pago_ate date,               -- até quando o Clube vale com o que já foi pago
  user_id uuid,
  atualizado_em timestamptz default now()
);
create index if not exists assinaturas_email_idx on assinaturas (lower(email));
alter table assinaturas enable row level security;   -- sem política: só o servidor

-- ── Avisos do Asaas já processados (o Asaas pode mandar o mesmo duas vezes) ──
create table if not exists asaas_eventos (
  id text primary key,
  tipo text,
  recebido_em timestamptz default now(),
  payload jsonb
);
alter table asaas_eventos enable row level security; -- sem política: só o servidor

-- ── Conta criada DEPOIS do pagamento: libera o Clube na hora ──────────────
-- Roda depois que a linha da conta nasce (o gatilho de cima já a deixou
-- "pendente"). A conta só é usada depois de confirmar o e-mail, então
-- ninguém consegue pegar a assinatura de outra pessoa só digitando o e-mail.
create or replace function aplica_assinatura_pendente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  a assinaturas%rowtype;
begin
  if new.email is null or new.email = '' then
    return new;
  end if;
  select * into a from assinaturas
   where lower(email) = lower(trim(new.email))
     and pago_ate >= current_date
   order by pago_ate desc
   limit 1;
  if not found then
    return new;
  end if;
  update profiles
     set plano = case when plano in ('pendente') or plano is null then 'comunidade' else plano end,
         clube_ate = greatest(coalesce(clube_ate, a.pago_ate), a.pago_ate),
         clube_origem = 'asaas',
         clube_status = coalesce(a.status, 'ativa'),
         telefone = coalesce(a.telefone, telefone),
         asaas_customer_id = a.asaas_customer_id,
         asaas_subscription_id = a.asaas_subscription_id,
         dispensada_em = null,
         grupo_removida_em = null
   where id = new.id;
  update assinaturas set user_id = new.id, atualizado_em = now()
   where asaas_customer_id = a.asaas_customer_id;
  return new;
end;
$$;

drop trigger if exists aplica_assinatura_pendente on profiles;
create trigger aplica_assinatura_pendente
  after insert on profiles
  for each row execute function aplica_assinatura_pendente();

-- ── Painel: Grupo do WhatsApp ─────────────────────────────────────────────
-- Todas as contas que já tiveram Clube: o Painel separa "podem estar no
-- grupo" (clube_ate hoje ou depois) de "remover do grupo" (vencido e ainda
-- não marcado como removido).
create or replace function admin_get_grupo()
returns table (id uuid, nome text, email text, telefone text, plano text,
               clube_ate date, clube_status text, clube_origem text, grupo_removida_em timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from profiles p where p.id = auth.uid() and p.plano = 'admin') then
    raise exception 'apenas a mentora';
  end if;
  return query
    select p.id, p.nome, p.email, p.telefone, p.plano, p.clube_ate, p.clube_status,
           p.clube_origem, p.grupo_removida_em
      from profiles p
     where p.clube_ate is not null
     order by p.nome;
end;
$$;

-- "Já removi do grupo" (ou desfazer, com p_removida = false)
create or replace function admin_marcar_removida(p_user_id uuid, p_removida boolean default true)
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
     set grupo_removida_em = case when p_removida then now() else null end
   where id = p_user_id;
end;
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on function admin_get_grupo() from public, anon;
    revoke all on function admin_marcar_removida(uuid, boolean) from public, anon;
    grant execute on function admin_get_grupo() to authenticated;
    grant execute on function admin_marcar_removida(uuid, boolean) to authenticated;
  end if;
end $$;
