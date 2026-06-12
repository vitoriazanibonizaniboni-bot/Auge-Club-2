-- =============================================================
-- CLUBE DO AUGE — Endurecimento de segurança
-- Execute no Supabase Dashboard → SQL Editor
-- =============================================================

-- 1. Mensagens só podem ser ENVIADAS entre conexões aceitas
--    (o app já esconde o botão, mas isto fecha a porta na API)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'mensagens'
      and policyname = 'Mensagem só entre conexões aceitas'
  ) then
    execute 'create policy "Mensagem só entre conexões aceitas"
      on mensagens as restrictive for insert to authenticated
      with check (
        exists (
          select 1 from conexoes c
          where c.status = ''aceita''
            and ((c.solicitante_id = de_user_id and c.destinataria_id = para_user_id)
              or (c.solicitante_id = para_user_id and c.destinataria_id = de_user_id))
        )
      )';
  end if;
end $$;

-- 2. Impede que o conteúdo de uma mensagem seja EDITADO
--    (a política de "marcar como lida" permite UPDATE; este trigger
--    garante que só o campo lida pode mudar)
create or replace function protege_mensagem() returns trigger
language plpgsql as $$
begin
  if new.texto is distinct from old.texto
     or new.de_user_id is distinct from old.de_user_id
     or new.para_user_id is distinct from old.para_user_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Mensagens não podem ser editadas';
  end if;
  return new;
end; $$;

drop trigger if exists trg_protege_mensagem on mensagens;
create trigger trg_protege_mensagem
  before update on mensagens
  for each row execute procedure protege_mensagem();

-- 3. Comentários: só é possível comentar em post público
--    (ou no próprio post privado) e só ler comentários desses posts
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'comentarios'
      and policyname = 'Comenta só em post visível'
  ) then
    execute 'create policy "Comenta só em post visível"
      on comentarios as restrictive for insert to authenticated
      with check (
        exists (
          select 1 from feed f
          where f.id = post_id and (f.publica = true or f.user_id = auth.uid())
        )
      )';
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'comentarios'
      and policyname = 'Lê comentário só de post visível'
  ) then
    execute 'create policy "Lê comentário só de post visível"
      on comentarios as restrictive for select to authenticated
      using (
        exists (
          select 1 from feed f
          where f.id = post_id and (f.publica = true or f.user_id = auth.uid())
        )
      )';
  end if;
end $$;

-- 4. AUDITORIA — rode estes SELECTs e confira o resultado:
-- 4a. Tabelas SEM RLS ativada (não deve listar nenhuma das suas):
--   select tablename from pg_tables where schemaname='public'
--   and rowsecurity = false;
-- 4b. Políticas existentes por tabela:
--   select tablename, policyname, cmd from pg_policies
--   where schemaname='public' order by tablename;
