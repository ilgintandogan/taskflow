-- TaskFlow schema migration
-- Run this in the Supabase SQL Editor or via: npx supabase db push

create table if not exists boards (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references auth.users not null,
  title       text not null,
  created_at  timestamptz default now()
);

create table if not exists columns (
  id          uuid primary key default gen_random_uuid(),
  board_id    uuid references boards on delete cascade not null,
  title       text not null,
  position    text not null,
  created_at  timestamptz default now()
);

create table if not exists cards (
  id          uuid primary key default gen_random_uuid(),
  column_id   uuid references columns on delete cascade not null,
  title       text not null,
  description text,
  position    text not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Row Level Security
alter table boards  enable row level security;
alter table columns enable row level security;
alter table cards   enable row level security;

create policy "board owner" on boards
  using (owner_id = auth.uid());

create policy "board member columns" on columns
  using (board_id in (select id from boards where owner_id = auth.uid()));

create policy "board member cards" on cards
  using (column_id in (
    select c.id from columns c
    join boards b on c.board_id = b.id
    where b.owner_id = auth.uid()
  ));
