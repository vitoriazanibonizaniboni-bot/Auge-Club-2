-- =============================================================
-- CLUBE DO AUGE — Vídeos por turma
-- Execute no Supabase Dashboard → SQL Editor
--
-- As gravações dos encontros ao vivo são de uma turma só. Já as
-- meditações, o yoga, as indicações e os podcasts servem para todas.
--
-- Por isso o campo é opcional: vídeo SEM turma aparece para todo
-- mundo, vídeo COM turma aparece só para aquela turma. Nada some
-- por esquecimento — esquecer de marcar deixa o vídeo visível para
-- todas, nunca invisível.
--
-- As aulas que já estão cadastradas são as gravações da turma que
-- está rodando hoje, então viram Turma 1. O resto continua sem
-- turma, ou seja, para todas. Qualquer vídeo pode ser trocado de
-- turma depois, pelo Painel da Mentora.
-- =============================================================

alter table videos add column if not exists turma_id text references turmas(id);

create index if not exists videos_turma_idx on videos (turma_id, categoria, ordem);

update videos
   set turma_id = 't1'
 where turma_id is null
   and categoria = 'aulas';
