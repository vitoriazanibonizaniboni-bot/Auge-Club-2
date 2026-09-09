-- =============================================================
-- CLUBE DO AUGE — "Assistido" nos vídeos da aba Conteúdo
-- Execute no Supabase Dashboard → SQL Editor
--
-- Guarda quais vídeos cada aluna já marcou como assistidos.
-- Uma linha por aluna e por vídeo; marcar de novo não duplica,
-- e desmarcar apaga a linha.
--
-- video_id é TEXTO de propósito: assim serve tanto para os vídeos
-- cadastrados no painel quanto para os que ainda vêm da lista fixa
-- do código, sem depender do tipo do id.
--
-- Cada aluna só enxerga e só mexe nas próprias marcações.
-- =============================================================

create table if not exists videos_assistidos (
  user_id uuid references auth.users on delete cascade not null,
  video_id text not null,
  created_at timestamptz default now(),
  primary key (user_id, video_id)
);

alter table videos_assistidos enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'videos_assistidos'
      and policyname = 'own videos_assistidos'
  ) then
    execute 'create policy "own videos_assistidos" on videos_assistidos for all using (auth.uid()=user_id) with check (auth.uid()=user_id)';
  end if;
end $$;
