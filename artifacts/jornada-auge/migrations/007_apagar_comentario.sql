-- =============================================================
-- CLUBE DO AUGE — Apagar comentário
-- Execute no Supabase Dashboard → SQL Editor
-- A autora pode apagar o próprio comentário; a dona do post
-- pode apagar qualquer comentário feito no post dela (moderação).
-- =============================================================

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'comentarios'
      and policyname = 'Apaga próprio comentário ou do próprio post'
  ) then
    execute 'create policy "Apaga próprio comentário ou do próprio post"
      on comentarios for delete to authenticated
      using (
        auth.uid() = user_id
        or exists (
          select 1 from feed f
          where f.id = post_id and f.user_id = auth.uid()
        )
      )';
  end if;
end $$;
