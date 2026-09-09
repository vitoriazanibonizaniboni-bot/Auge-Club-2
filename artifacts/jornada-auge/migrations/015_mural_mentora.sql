-- =============================================================
-- CLUBE DO AUGE — a mentora enxerga o Mural das três turmas
-- Execute no Supabase Dashboard → SQL Editor
--
-- A política criada em 013 deixa cada aluna ver só a própria turma.
-- Ela vale, e continua valendo — mas cortava também a Dra. Isadora,
-- que precisa acompanhar todas as turmas.
--
-- Esta migração troca a política pela mesma coisa com uma exceção:
-- quem tem plano 'admin' vê tudo.
--
-- Rodar junto: as contas que ficaram sem turma (a conta admin, entre
-- elas) devem entrar na Turma 1 — é o que faz o Mural, as Aulas e a
-- semana voltarem ao normal para quem estava de fora.
-- =============================================================

update profiles set turma_id = 't1' where turma_id is null;

update turmas set inicio = '2026-08-03' where id = 't1' and inicio is null;

drop policy if exists "feed so da minha turma" on feed;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute $p$
      create policy "feed so da minha turma" on feed as restrictive for select to authenticated
      using (
        user_id = auth.uid()
        or exists (select 1 from profiles p where p.id = auth.uid() and p.plano = 'admin')
        or turma_id is not distinct from (select p.turma_id from profiles p where p.id = auth.uid())
      )$p$;
  else
    execute $p$
      create policy "feed so da minha turma" on feed as restrictive for select
      using (
        user_id = auth.uid()
        or exists (select 1 from profiles p where p.id = auth.uid() and p.plano = 'admin')
        or turma_id is not distinct from (select p.turma_id from profiles p where p.id = auth.uid())
      )$p$;
  end if;
end $$;
