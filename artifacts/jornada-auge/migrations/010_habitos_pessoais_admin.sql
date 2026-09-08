-- =============================================================
-- CLUBE DO AUGE — Painel da Mentora enxerga os hábitos pessoais
-- Execute no Supabase Dashboard → SQL Editor
--
-- A tabela habitos_pessoais só deixa cada aluna ver os próprios
-- hábitos ("own habitos_pessoais"). Isso está certo e continua.
--
-- Para o Painel da Mentora mostrar a Trajetória de cada aluna,
-- a Dra. Isadora precisa ler os hábitos de todas. Esta função faz
-- isso do mesmo jeito que as outras get_*_admin já existentes:
-- roda com permissão elevada, mas SÓ depois de confirmar que quem
-- chamou é admin. Quem não for admin recebe erro, não uma lista
-- vazia — assim a falha é barulhenta e não passa despercebida.
--
-- É leitura apenas. Não existe função para a mentora criar, editar
-- ou apagar hábito de aluna.
-- =============================================================

create or replace function get_habitos_pessoais_admin()
returns table (
  id uuid,
  user_id uuid,
  nome text,
  meta int,
  meta_texto text,
  ordem int
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.plano = 'admin'
  ) then
    raise exception 'Acesso restrito ao Painel da Mentora';
  end if;

  return query
    select h.id, h.user_id, h.nome, h.meta, h.meta_texto, h.ordem
    from habitos_pessoais h
    where h.ativo = true
    order by h.user_id, h.ordem;
end $$;

-- Ninguém anônimo chama; só quem está autenticado, e a função
-- verifica se é admin logo na primeira linha.
revoke all on function get_habitos_pessoais_admin() from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on function get_habitos_pessoais_admin() from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'grant execute on function get_habitos_pessoais_admin() to authenticated';
  end if;
end $$;
