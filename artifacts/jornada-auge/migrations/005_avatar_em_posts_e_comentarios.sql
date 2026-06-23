-- =============================================================
-- CLUBE DO AUGE — Foto de perfil em posts e comentários
-- Execute no Supabase Dashboard → SQL Editor
-- A foto da autora é gravada junto com o post/comentário
-- (mesmo padrão do autor_nome — evita a RLS de profiles).
-- =============================================================

alter table feed add column if not exists autor_avatar text;
alter table comentarios add column if not exists autor_avatar text;
