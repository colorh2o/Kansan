create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  created_at timestamptz not null default now()
);

create index if not exists cards_status_created_at_idx
  on public.cards (status, created_at);

alter table public.cards enable row level security;

grant select, insert, update, delete on public.cards to anon, authenticated;

drop policy if exists cards_read_public on public.cards;
drop policy if exists cards_read_authenticated on public.cards;
create policy cards_read_public on public.cards
  for select to anon, authenticated using (true);

drop policy if exists cards_insert_public on public.cards;
drop policy if exists cards_insert_authenticated on public.cards;
create policy cards_insert_public on public.cards
  for insert to anon, authenticated with check (true);

drop policy if exists cards_update_public on public.cards;
drop policy if exists cards_update_authenticated on public.cards;
create policy cards_update_public on public.cards
  for update to anon, authenticated using (true) with check (true);

drop policy if exists cards_delete_public on public.cards;
drop policy if exists cards_delete_authenticated on public.cards;
create policy cards_delete_public on public.cards
  for delete to anon, authenticated using (true);