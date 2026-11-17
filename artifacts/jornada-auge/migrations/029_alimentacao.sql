-- =============================================================
-- CLUBE DO AUGE — novo hábito: Alimentação
-- Execute no Supabase Dashboard → SQL Editor. Pode rodar mais de uma vez.
--
-- Desbloqueio da Jornada (a partir de agora):
--   Movimento → Semana 1 (primeiro dia)
--   Alimentação → Semana 4
--   Sono → Semana 7
--   Tempo para Si → Semana 10
--
-- Este script só cria as colunas da Alimentação em habitos_metas
-- (meta, objetivo, mínimo, nome e lista), no mesmo padrão de mov_* e sono_*.
-- Sem essas colunas o app não consegue salvar a meta da Alimentação.
-- Nenhuma aluna perde dados: quem não preencheu ainda usa a meta padrão (5x).
-- =============================================================

alter table habitos_metas add column if not exists alimentacao_freq integer;
alter table habitos_metas add column if not exists alimentacao_desc text;
alter table habitos_metas add column if not exists alimentacao_minimo text;
alter table habitos_metas add column if not exists alimentacao_nome text;
alter table habitos_metas add column if not exists alimentacao_ativo boolean not null default true;

-- Conferência: deve mostrar 5 linhas
select column_name, data_type, column_default
  from information_schema.columns
 where table_name = 'habitos_metas'
   and column_name like 'alimentacao_%'
 order by column_name;
