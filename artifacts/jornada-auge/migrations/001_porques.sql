create table if not exists porques (
  user_id uuid references auth.users on delete cascade primary key,
  p1 text, p2 text, p3 text,
  updated_at timestamptz default now()
);
alter table porques enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'porques' and policyname = 'own porques'
  ) then
    execute 'create policy "own porques" on porques for all using (auth.uid()=user_id)';
  end if;
end $$;
