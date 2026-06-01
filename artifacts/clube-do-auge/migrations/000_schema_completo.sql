-- =============================================================
-- CLUBE DO AUGE — Schema completo (9 tabelas)
-- Execute no Supabase Dashboard → SQL Editor
-- =============================================================

-- -------------------------------------------------------------
-- 1. profiles
-- -------------------------------------------------------------
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text,
  email text,
  plano text default 'comunidade' check (plano in ('comunidade','jornada')),
  data_cadastro timestamptz default now(),
  lgpd_aceito boolean default false,
  lgpd_data timestamptz
);
alter table profiles enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='own profile') then
    execute 'create policy "own profile" on profiles for all using (auth.uid()=id)';
  end if;
end $$;

-- trigger: cria profile automaticamente no cadastro
create or replace function handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into profiles(id, nome, email)
  values (new.id, new.raw_user_meta_data->>'nome', new.email)
  on conflict (id) do nothing;
  return new;
end;$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure handle_new_user();

-- -------------------------------------------------------------
-- 2. checkins
-- -------------------------------------------------------------
create table if not exists checkins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  data date not null,
  hab_feitos text[] default '{}',
  hab_nao_feitos text[] default '{}',
  total_feitos int default 0,
  total int default 0,
  percentual int default 0,
  chips text[] default '{}',
  nota text,
  retomada boolean default false,
  created_at timestamptz default now(),
  unique(user_id, data)
);
alter table checkins enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='checkins' and policyname='own checkins') then
    execute 'create policy "own checkins" on checkins for all using (auth.uid()=user_id)';
  end if;
end $$;

-- -------------------------------------------------------------
-- 3. habitos_angulares
-- -------------------------------------------------------------
create table if not exists habitos_angulares (
  user_id uuid references auth.users on delete cascade primary key,
  hab1 text, hab2 text, hab3 text,
  updated_at timestamptz default now()
);
alter table habitos_angulares enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='habitos_angulares' and policyname='own habitos') then
    execute 'create policy "own habitos" on habitos_angulares for all using (auth.uid()=user_id)';
  end if;
end $$;

-- -------------------------------------------------------------
-- 4. roda_auge
-- -------------------------------------------------------------
create table if not exists roda_auge (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  momento text check (momento in ('S1','S6','S12')),
  data date default current_date,
  respostas jsonb,
  nota_energia numeric, nota_consciencia numeric,
  nota_organizacao numeric, nota_autocuidado numeric, nota_protagonismo numeric,
  indice_auge numeric,
  created_at timestamptz default now()
);
alter table roda_auge enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='roda_auge' and policyname='own roda') then
    execute 'create policy "own roda" on roda_auge for all using (auth.uid()=user_id)';
  end if;
end $$;

-- -------------------------------------------------------------
-- 5. kit_emergencia
-- -------------------------------------------------------------
create table if not exists kit_emergencia (
  user_id uuid references auth.users on delete cascade primary key,
  min_viavel text, onde_apoio text,
  updated_at timestamptz default now()
);
alter table kit_emergencia enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='kit_emergencia' and policyname='own kit') then
    execute 'create policy "own kit" on kit_emergencia for all using (auth.uid()=user_id)';
  end if;
end $$;

-- -------------------------------------------------------------
-- 6. ancora
-- -------------------------------------------------------------
create table if not exists ancora (
  user_id uuid references auth.users on delete cascade primary key,
  texto text,
  updated_at timestamptz default now()
);
alter table ancora enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ancora' and policyname='own ancora') then
    execute 'create policy "own ancora" on ancora for all using (auth.uid()=user_id)';
  end if;
end $$;

-- -------------------------------------------------------------
-- 7. vitorias
-- -------------------------------------------------------------
create table if not exists vitorias (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  sem int, texto text, data text,
  created_at timestamptz default now()
);
alter table vitorias enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='vitorias' and policyname='own vitorias') then
    execute 'create policy "own vitorias" on vitorias for all using (auth.uid()=user_id)';
  end if;
end $$;

-- -------------------------------------------------------------
-- 8. carta_futuro
-- -------------------------------------------------------------
create table if not exists carta_futuro (
  user_id uuid references auth.users on delete cascade primary key,
  texto text,
  data_escrita timestamptz default now()
);
alter table carta_futuro enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='carta_futuro' and policyname='own carta') then
    execute 'create policy "own carta" on carta_futuro for all using (auth.uid()=user_id)';
  end if;
end $$;

-- -------------------------------------------------------------
-- 9. porques
-- -------------------------------------------------------------
create table if not exists porques (
  user_id uuid references auth.users on delete cascade primary key,
  p1 text, p2 text, p3 text,
  updated_at timestamptz default now()
);
alter table porques enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='porques' and policyname='own porques') then
    execute 'create policy "own porques" on porques for all using (auth.uid()=user_id)';
  end if;
end $$;
