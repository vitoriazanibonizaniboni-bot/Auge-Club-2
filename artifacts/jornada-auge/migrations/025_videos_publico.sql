-- =============================================================
-- CLUBE DO AUGE — Vídeo só do Clube, só da Jornada, ou dos dois
-- Execute no Supabase Dashboard → SQL Editor. Pode rodar mais de uma vez.
--
-- Decisão da Vitória (03/11): ao cadastrar um conteúdo, a Isadora
-- escolhe onde ele aparece. Sem escolha (vazio) = aparece nos dois,
-- como sempre foi. Por isso NENHUM vídeo que já existe muda: todos
-- ficam vazios, ou seja, continuam aparecendo para todo mundo.
--
--   publico = 'clube'   → só quem tem o Clube ativo (clube_ate hoje ou depois)
--   publico = 'jornada' → só alunas da Jornada
--   publico vazio       → as duas
--
-- O app filtra na tela, e o banco também corta (política RESTRITIVA,
-- como a do Mural): conteúdo do Clube é o que se paga, então não pode
-- chegar a quem pedir por fora do app. A mentora vê tudo.
-- =============================================================

alter table videos add column if not exists publico text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'videos_publico_valido') then
    alter table videos add constraint videos_publico_valido check (publico is null or publico in ('clube', 'jornada'));
  end if;
end $$;

drop policy if exists "videos por publico" on videos;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute $p$
      create policy "videos por publico" on videos as restrictive for select to authenticated
      using (
        publico is null
        or exists (select 1 from profiles p where p.id = auth.uid() and p.plano = 'admin')
        or (publico = 'clube' and exists (select 1 from profiles p where p.id = auth.uid() and p.clube_ate >= current_date))
        or (publico = 'jornada' and exists (select 1 from profiles p where p.id = auth.uid() and p.plano = 'jornada'))
      )$p$;
  else
    execute $p$
      create policy "videos por publico" on videos as restrictive for select
      using (
        publico is null
        or exists (select 1 from profiles p where p.id = auth.uid() and p.plano = 'admin')
        or (publico = 'clube' and exists (select 1 from profiles p where p.id = auth.uid() and p.clube_ate >= current_date))
        or (publico = 'jornada' and exists (select 1 from profiles p where p.id = auth.uid() and p.plano = 'jornada'))
      )$p$;
  end if;
end $$;

-- Conferência: quantos vídeos em cada público (todos devem estar em "os dois")
select coalesce(publico, 'os dois') as onde_aparece, count(*) from videos group by 1;
