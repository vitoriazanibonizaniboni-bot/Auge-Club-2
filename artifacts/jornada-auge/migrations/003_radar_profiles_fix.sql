-- =============================================================
-- CLUBE DO AUGE — Correção do Radar de Amigas
-- A função get_radar_profiles referenciava a tabela conexoes
-- antiga (user1_id/user2_id) e quebrou com a migração 002.
-- Esta versão usa o novo modelo solicitante/destinataria.
-- Execute no Supabase Dashboard → SQL Editor
-- =============================================================

drop function if exists get_radar_profiles(uuid);

create or replace function get_radar_profiles(uid uuid)
returns table (
  id uuid,
  nome text,
  cidade text,
  interesses text[],
  avatar_url text
)
language sql security definer set search_path = public as $$
  select
    p.id,
    p.nome,
    p.radar_cidade as cidade,
    p.radar_interesses as interesses,
    p.avatar_url
  from profiles p
  where p.id <> uid
    -- só perfis que preencheram as preferências do radar
    and (p.radar_cidade is not null or p.radar_interesses is not null)
    -- esconde quem já tem conexão ou solicitação com a usuária
    -- (pendente, aceita ou recusada — recusada some sem notificar)
    and not exists (
      select 1 from conexoes c
      where (c.solicitante_id = uid and c.destinataria_id = p.id)
         or (c.solicitante_id = p.id and c.destinataria_id = uid)
    );
$$;
