-- Migração 018: Corrigir RLS policies de INSERT em comentarios
-- As policies anterior tinham qual = NULL, bloqueando todos os INSERTs
-- Solução: usar WITH CHECK (correto para INSERT) em vez de USING

-- Remover policies quebradas
DROP POLICY IF EXISTS "Comenta só em post visível" ON comentarios;
DROP POLICY IF EXISTS "Usuária comenta como ela mesma" ON comentarios;

-- Recriar com WITH CHECK (correto para INSERT)
CREATE POLICY "Comenta só em post visível" ON comentarios
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM feed f 
    WHERE f.id = video_id 
    AND (f.publica = true OR f.user_id = auth.uid())
  )
);

CREATE POLICY "Usuária comenta como ela mesma" ON comentarios
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
