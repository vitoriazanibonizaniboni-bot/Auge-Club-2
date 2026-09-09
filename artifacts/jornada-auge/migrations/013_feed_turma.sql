-- =============================================================
-- CLUBE DO AUGE — Mural do 1% separado por turma
-- Execute no Supabase Dashboard → SQL Editor
--
-- Decisão da Vitória: cada aluna vê só os posts da própria turma.
-- Cada post passa a guardar de qual turma ele veio.
--
-- Os posts que já existem são da turma atual, então viram Turma 1 —
-- as 8 alunas de hoje estão nela e nada some do Mural delas.
--
-- Post sem turma (de aluna que ficou sem turma) só aparece para quem
-- também está sem turma. Não vaza para as turmas.
-- =============================================================

alter table feed add column if not exists turma_id text references turmas(id);

create index if not exists feed_turma_idx on feed (turma_id, publica, created_at desc);

-- Tudo que já foi postado é da turma que está rodando hoje.
update feed set turma_id = 't1' where turma_id is null;

-- =============================================================
-- A separação também no banco, não só na tela
-- =============================================================
-- Sem isto, o app filtra o Mural mas o banco continua entregando
-- tudo a quem pedir. Esta política é RESTRITIVA: ela se soma às que
-- já existem e corta o que estiver fora da turma de quem está lendo.
--
-- Cada aluna enxerga:
--   • os posts da própria turma (turma sem valor conta como turma
--     sem valor, então quem está sem turma vê os posts sem turma);
--   • e sempre os posts que ela mesma escreveu, inclusive os "Só você".

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'feed'
      and policyname = 'feed so da minha turma'
  ) then
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute $p$
        create policy "feed so da minha turma" on feed as restrictive for select to authenticated
        using (
          user_id = auth.uid()
          or turma_id is not distinct from (select p.turma_id from profiles p where p.id = auth.uid())
        )$p$;
    else
      execute $p$
        create policy "feed so da minha turma" on feed as restrictive for select
        using (
          user_id = auth.uid()
          or turma_id is not distinct from (select p.turma_id from profiles p where p.id = auth.uid())
        )$p$;
    end if;
  end if;
end $$;
