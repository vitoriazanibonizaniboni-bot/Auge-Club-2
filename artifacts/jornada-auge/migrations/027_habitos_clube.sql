-- =============================================================
-- CLUBE DO AUGE — Movimento, Sono e Tempo para Si viram opcionais no Clube
-- Execute no Supabase Dashboard → SQL Editor. Pode rodar mais de uma vez.
--
-- Decisão da Vitória (03/11): no Clube não há encontro semanal guiando os
-- três hábitos do método, então a aluna pode TIRAR da lista, COLOCAR DE
-- VOLTA e RENOMEAR cada um deles (além da meta, que já era editável).
--
--   *_nome  → o nome que ela deu. Vazio = o nome original do método.
--   *_ativo → false = tirado da lista. O histórico em `registros` fica
--             guardado, igual aos hábitos que ela mesma cria.
--
-- Na Jornada nada muda: o app ignora esses campos fora do Clube.
-- Ninguém muda hoje: todos começam com o nome original e na lista.
-- =============================================================

alter table habitos_metas add column if not exists mov_nome text;
alter table habitos_metas add column if not exists sono_nome text;
alter table habitos_metas add column if not exists tsi_nome text;
alter table habitos_metas add column if not exists mov_ativo boolean not null default true;
alter table habitos_metas add column if not exists sono_ativo boolean not null default true;
alter table habitos_metas add column if not exists tsi_ativo boolean not null default true;

-- Conferência: deve mostrar 6 linhas
select column_name, data_type, column_default
  from information_schema.columns
 where table_name = 'habitos_metas'
   and column_name in ('mov_nome','sono_nome','tsi_nome','mov_ativo','sono_ativo','tsi_ativo')
 order by column_name;
