-- Migração 017: Políticas de RLS para tabela feed
-- Garante que alunas veem só seus posts privados + posts públicos da turma
-- Admin vê tudo

-- Remover policy temporária que deixava SELECT aberto
DROP POLICY IF EXISTS select_all ON feed;

-- Política de SELECT: mostrar posts públicos da turma + próprios posts + admin vê tudo
CREATE POLICY IF NOT EXISTS select_feed ON feed
FOR SELECT
TO authenticated
USING (
  -- Posts públicos da mesma turma (ou posts sem turma se turma_id IS NULL)
  (publica = true AND (turma_id = (SELECT turma_id FROM profiles WHERE id = auth.uid()) OR turma_id IS NULL))
  -- OU posts privados da própria aluna
  OR user_id = auth.uid()
  -- OU se for admin, vê tudo
  OR (SELECT plano FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Política de INSERT: criar posts próprios (só seu user_id)
CREATE POLICY IF NOT EXISTS insert_feed ON feed
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Política de UPDATE: editar posts próprios
CREATE POLICY IF NOT EXISTS update_feed ON feed
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE já existe (delete_own), não precisa recriar
