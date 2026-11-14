-- 028: tema (série) e ordem de cada aula.
-- A Dra. Isadora/Vitória define o tema e a ordem no Painel da Mentora, aba Vídeos,
-- botão "editar". Aulas do mesmo tema viram uma fileira na tela Hoje, em ordem.
-- Sem tema, a aula cai na categoria (Aulas, Yoga, Meditação...). Pode rodar mais de uma vez.

alter table videos add column if not exists tema text;
alter table videos add column if not exists ordem integer default 0;

create index if not exists videos_tema_idx on videos (categoria, tema, ordem);
