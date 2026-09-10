-- Adicionar coluna destaque_semana na tabela feed
ALTER TABLE feed ADD COLUMN IF NOT EXISTS destaque_semana boolean DEFAULT false;

-- Índice para queries de destaque
CREATE INDEX IF NOT EXISTS idx_feed_destaque_semana ON feed(destaque_semana, turma_id);
