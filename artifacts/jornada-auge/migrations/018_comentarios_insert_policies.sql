-- Migração 018: Corrigir RLS policies de INSERT em comentarios
-- As policies anterior tinham qual = NULL, bloqueando todos os INSERTs
-- Solução: usar WITH CHECK (correto para INSERT) em vez de USING

-- Remover policies quebradas
DROP POLICY IF EXISTS "Comenta só em post visível" ON comentarios;
DROP POLICY IF EXISTS "Comenta em post visível ou vídeo" ON comentarios;
DROP POLICY IF EXISTS "Usuária comenta como ela mesma" ON comentarios;

-- Recriar com WITH CHECK (correto para INSERT)
-- Aceita tanto comentários em posts do Mural (post_id) quanto em vídeos de conteúdo (video_id)
CREATE POLICY "Comenta em post visível ou vídeo" ON comentarios
FOR INSERT
TO authenticated
WITH CHECK (
  -- Comentário em post do Mural
  (post_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM feed f 
    WHERE f.id = post_id 
    AND (f.publica = true OR f.user_id = auth.uid())
  ))
  OR
  -- Comentário em vídeo de conteúdo
  (video_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM videos v 
    WHERE v.id = video_id
  ))
);

CREATE POLICY "Usuária comenta como ela mesma" ON comentarios
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
