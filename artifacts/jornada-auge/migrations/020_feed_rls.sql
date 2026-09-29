-- =============================================================
-- 020 — Liga a proteção (RLS) da tabela feed (PASSO 2 de 2)
-- =============================================================
-- Situação encontrada em 29/09/2026: a consulta
--   select tablename from pg_tables where schemaname='public' and rowsecurity=false;
-- devolveu "feed". Com a RLS desligada, as políticas do Mural existem mas
-- NÃO valem: qualquer pessoa com o endereço do app (mesmo sem login) lê todos
-- os posts, inclusive os "Só você", e pode alterar ou apagar post de outra aluna.
--
-- A 017 tentou criar as políticas com "create policy if not exists", que o
-- Postgres não aceita — por isso ela provavelmente falhou. Esta refaz tudo.
--
-- Rodar SÓ DEPOIS de:
--   1) rodar a 019 (curtir_post), e
--   2) publicar a versão do app que curte pela função curtir_post.
-- Antes disso, ligar a proteção quebraria o "Curtir".
-- Pode rodar mais de uma vez.
-- =============================================================

alter table feed enable row level security;

-- Tira as políticas antigas/soltas para recriar num formato só
drop policy if exists select_all  on feed;
drop policy if exists select_feed on feed;
drop policy if exists insert_feed on feed;
drop policy if exists update_feed on feed;
drop policy if exists delete_own  on feed;
drop policy if exists "feed ler"        on feed;
drop policy if exists "feed criar o meu"  on feed;
drop policy if exists "feed editar o meu" on feed;
drop policy if exists "feed apagar o meu" on feed;
-- A política RESTRITIVA "feed so da minha turma" (015) continua valendo.

do $$
declare
  papel text := case when exists (select 1 from pg_roles where rolname = 'authenticated')
                     then ' to authenticated' else '' end;
begin
  -- Ler: o próprio post, qualquer um se for a mentora, ou post público
  -- (a restritiva da 015 ainda limita o público à turma de quem lê)
  execute 'create policy "feed ler" on feed for select' || papel || '
    using (
      user_id = auth.uid()
      or publica = true
      or exists (select 1 from profiles p where p.id = auth.uid() and p.plano = ''admin'')
    )';

  -- Criar: só post em nome próprio
  execute 'create policy "feed criar o meu" on feed for insert' || papel || '
    with check (user_id = auth.uid())';

  -- Editar: só o próprio post (curtidas de outras alunas passam pela curtir_post)
  execute 'create policy "feed editar o meu" on feed for update' || papel || '
    using (user_id = auth.uid()) with check (user_id = auth.uid())';

  -- Apagar: o próprio post, ou a mentora (moderação)
  execute 'create policy "feed apagar o meu" on feed for delete' || papel || '
    using (
      user_id = auth.uid()
      or exists (select 1 from profiles p where p.id = auth.uid() and p.plano = ''admin'')
    )';
end $$;

-- Conferência: deve voltar vazio
-- select tablename from pg_tables where schemaname = 'public' and rowsecurity = false;
