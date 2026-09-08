-- =============================================================
-- CLUBE DO AUGE — Pastilha do hábito no post do Mural
-- Execute no Supabase Dashboard → SQL Editor
--
-- Quando a aluna posta pelo convite que aparece logo depois de
-- marcar um hábito, o post guarda de qual hábito veio e mostra
-- isso como pastilha no card do Mural.
--
-- Guardamos o NOME do hábito ("Movimento", "Água"), não o id:
-- assim vale para os 3 angulares e para os hábitos que a própria
-- aluna cria, sem precisar cruzar tabela para exibir o feed.
--
-- Posts feitos pelo botão manual do Mural continuam com a coluna
-- vazia, e o card simplesmente não mostra pastilha.
-- =============================================================

alter table feed add column if not exists habito text;
