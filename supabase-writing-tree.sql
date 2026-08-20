-- 写作树存储 + RLS
-- Run this in the Supabase SQL Editor.

begin;

create table if not exists public.public_writing_tree (
  tree_key text primary key,
  tree_data jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid(),
  updated_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.public_writing_tree is '公共写作树的单例存储表';
comment on column public.public_writing_tree.tree_data is '写作树完整 JSON 数据';

alter table public.public_writing_tree enable row level security;

drop policy if exists "Public read writing tree" on public.public_writing_tree;
drop policy if exists "Author insert writing tree" on public.public_writing_tree;
drop policy if exists "Author update writing tree" on public.public_writing_tree;
drop policy if exists "Author delete writing tree" on public.public_writing_tree;

create policy "Public read writing tree"
on public.public_writing_tree
for select
to public
using (true);

create policy "Author insert writing tree"
on public.public_writing_tree
for insert
to authenticated
with check (auth.uid() is not null);

create policy "Author update writing tree"
on public.public_writing_tree
for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy "Author delete writing tree"
on public.public_writing_tree
for delete
to authenticated
using (auth.uid() is not null);

commit;
