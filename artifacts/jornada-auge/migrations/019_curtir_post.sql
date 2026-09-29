-- =============================================================
-- 019 — Curtir post pelo servidor (PASSO 1 de 2 da proteção do Mural)
-- =============================================================
-- Por quê: hoje o app curte um post EDITANDO a linha do post de outra aluna
-- (feed.curtidas). Isso só funciona porque a tabela feed está sem proteção
-- (RLS desligada) — e sem proteção qualquer pessoa com o endereço do app lê
-- todos os posts, inclusive os "Só você", e pode alterar ou apagar posts alheios.
--
-- Esta função faz a curtida do jeito certo: a aluna só consegue colocar ou
-- tirar o PRÓPRIO id da lista de curtidas, e só em post que ela pode ver
-- (o próprio, um público da turma dela, ou qualquer um se for a mentora).
--
-- Rodar ANTES de publicar a versão do app que usa curtir_post.
-- Pode rodar mais de uma vez.
-- Funciona com curtidas em jsonb ou em array (text[]/uuid[]): descobre sozinha.
-- =============================================================

do $$
declare
  t_cur text;   -- 'jsonb' ou 'ARRAY'
  u_cur text;   -- '_text', '_uuid'… quando é array
  t_id  text;   -- tipo do id do post (uuid, int8…)
  corpo text;
begin
  select data_type, udt_name into t_cur, u_cur
    from information_schema.columns
   where table_schema = 'public' and table_name = 'feed' and column_name = 'curtidas';
  select udt_name into t_id
    from information_schema.columns
   where table_schema = 'public' and table_name = 'feed' and column_name = 'id';

  if t_cur is null or t_id is null then
    raise exception 'feed.curtidas ou feed.id não encontrado';
  end if;

  if t_cur = 'jsonb' then
    corpo := $b$
      declare
        eu text := auth.uid()::text;
        atual jsonb;
      begin
        if auth.uid() is null then raise exception 'não autenticada'; end if;
        select coalesce(f.curtidas, '[]'::jsonb) into atual
          from feed f
         where f.id = p_post
           and ( f.user_id = auth.uid()
                 or exists (select 1 from profiles p where p.id = auth.uid() and p.plano = 'admin')
                 or ( f.publica = true
                      and f.turma_id is not distinct from (select p.turma_id from profiles p where p.id = auth.uid()) ) );
        if not found then raise exception 'post não encontrado'; end if;
        if atual ? eu then
          atual := atual - eu;
        else
          atual := atual || to_jsonb(eu);
        end if;
        update feed set curtidas = atual where id = p_post;
        return atual;
      end $b$;
  else
    -- array: o tipo do elemento é o udt sem o "_" da frente (ex.: _text -> text)
    corpo := format($b$
      declare
        eu %1$s := auth.uid()::text::%1$s;
        atual %1$s[];
      begin
        if auth.uid() is null then raise exception 'não autenticada'; end if;
        select coalesce(f.curtidas, '{}') into atual
          from feed f
         where f.id = p_post
           and ( f.user_id = auth.uid()
                 or exists (select 1 from profiles p where p.id = auth.uid() and p.plano = 'admin')
                 or ( f.publica = true
                      and f.turma_id is not distinct from (select p.turma_id from profiles p where p.id = auth.uid()) ) );
        if not found then raise exception 'post não encontrado'; end if;
        if eu = any(atual) then
          atual := array_remove(atual, eu);
        else
          atual := array_append(atual, eu);
        end if;
        update feed set curtidas = atual where id = p_post;
        return to_jsonb(atual);
      end $b$, substr(u_cur, 2));
  end if;

  execute format(
    'create or replace function curtir_post(p_post %s) returns jsonb
       language plpgsql security definer set search_path = public as %L',
    t_id, corpo);

  revoke all on function curtir_post from public;
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on function curtir_post from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'grant execute on function curtir_post to authenticated';
  end if;
end $$;
