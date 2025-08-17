-- Extensions
create extension if not exists pg_trgm;
create extension if not exists vector;

-- Templates
create table if not exists prompt_templates (
  id text not null,
  version text not null,
  status text not null check (status in ('active','draft','archived')),
  fork_of text,
  purpose text,
  target_persona text,
  inputs_schema jsonb not null,
  body_mustache text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now(),
  primary key (id, version)
);

-- Search index (one-stop)
create table if not exists search_index (
  item_type text not null check (item_type in ('template','workflow','tool')),
  item_id text not null,
  title text not null,
  tags text[] default '{}',
  tsv tsvector,
  embedding vector(1536),
  updated_at timestamptz default now(),
  primary key (item_type, item_id)
);
create or replace function trg_update_tsv() returns trigger language plpgsql as $$
begin
  new.tsv := setweight(to_tsvector('simple', coalesce(new.title,'')), 'A')
           || setweight(to_tsvector('simple', array_to_string(coalesce(new.tags,'{}'::text[]),' ')), 'B');
  return new;
end $$;
drop trigger if exists search_index_tsv on search_index;
create trigger search_index_tsv before insert or update on search_index
for each row execute function trg_update_tsv();
create index if not exists idx_search_index_tsv on search_index using gin(tsv);
create index if not exists idx_search_index_trgm on search_index using gin (title gin_trgm_ops);

-- Runs / Steps
create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists run_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references runs(id) on delete cascade,
  idx int not null,
  type text not null check (type in ('manual','instruction','generator')),
  input jsonb,
  output jsonb,
  notes text,
  checked boolean default false,
  status text not null default 'ready' check (status in ('ready','done','skipped')),
  created_at timestamptz default now()
);
create unique index if not exists idx_run_steps_run_idx on run_steps(run_id, idx);

-- Usage / Profiles
create table if not exists usage_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id),
  event text not null,
  meta jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_usage_user_time on usage_events(user_id, created_at);
create table if not exists profiles (
  id uuid primary key references auth.users(id),
  plan text not null default 'free'
);

-- RLS
alter table prompt_templates enable row level security;
create policy "templates_owner" on prompt_templates
  for all using (created_by = auth.uid()) with check (created_by = auth.uid());

alter table runs enable row level security;
create policy "runs_owner" on runs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table run_steps enable row level security;
create policy "steps_owner_via_run" on run_steps
  for all using (exists (select 1 from runs r where r.id = run_id and r.user_id = auth.uid()))
  with check (exists (select 1 from runs r where r.id = run_id and r.user_id = auth.uid()));

alter table usage_events enable row level security;
create policy "usage_insert_self" on usage_events for insert with check (user_id = auth.uid());
create policy "usage_read_self"   on usage_events for select using      (user_id = auth.uid());

alter table search_index enable row level security;
create policy "index_read_all" on search_index for select using (true);
create policy "index_write_internal" on search_index
  for insert with check (auth.role() = 'service_role');
create policy "index_update_internal" on search_index
  for update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
