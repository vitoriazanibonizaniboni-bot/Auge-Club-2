-- =============================================================
-- CLUBE DO AUGE — Apagar mensagem enviada + notificação de match
-- Execute no Supabase Dashboard → SQL Editor
-- =============================================================

-- 1. Remetente pode apagar a própria mensagem (estilo Instagram)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'mensagens'
      and policyname = 'Remetente apaga a própria mensagem'
  ) then
    execute 'create policy "Remetente apaga a própria mensagem"
      on mensagens for delete to authenticated
      using (auth.uid() = de_user_id)';
  end if;
end $$;

-- 2. Notificação em tempo real quando a amiga aceita a conexão
--    (adiciona a tabela conexoes ao realtime do Supabase)
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'conexoes'
  ) then
    execute 'alter publication supabase_realtime add table conexoes';
  end if;
end $$;
