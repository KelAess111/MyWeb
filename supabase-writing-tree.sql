-- 写作树存储 + RLS
-- Run this in the Supabase SQL Editor with an owner/admin role.
-- This migration is non-destructive: it preserves existing rows and only replaces policies/triggers.

begin;

create table if not exists public.public_writing_tree (
  tree_key text primary key,
  tree_data jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid(),
  updated_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.public_writing_tree is '公共与隐藏写作树的隔离 JSONB 存储表';
comment on column public.public_writing_tree.tree_key is '写作工作区键：public-writing-root 或 hidden-writing-root';
comment on column public.public_writing_tree.tree_data is '写作树完整 JSON 数据';

alter table public.public_writing_tree enable row level security;

create or replace function public.touch_public_writing_tree_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.created_at = old.created_at;
  new.created_by = old.created_by;
  return new;
end;
$$;

drop trigger if exists touch_public_writing_tree_updated_at on public.public_writing_tree;
create trigger touch_public_writing_tree_updated_at
before update on public.public_writing_tree
for each row
execute function public.touch_public_writing_tree_updated_at();

drop policy if exists "Public read writing tree" on public.public_writing_tree;
drop policy if exists "Author insert writing tree" on public.public_writing_tree;
drop policy if exists "Author update writing tree" on public.public_writing_tree;
drop policy if exists "Author delete writing tree" on public.public_writing_tree;
drop policy if exists "Anyone can read public writing tree" on public.public_writing_tree;
drop policy if exists "Fixed author can read writing workspaces" on public.public_writing_tree;
drop policy if exists "Fixed author can insert writing workspaces" on public.public_writing_tree;
drop policy if exists "Fixed author can update writing workspaces" on public.public_writing_tree;

create policy "Anyone can read public writing tree"
on public.public_writing_tree
for select
to anon, authenticated
using (tree_key = 'public-writing-root');

create policy "Fixed author can read writing workspaces"
on public.public_writing_tree
for select
to authenticated
using (
  tree_key in ('public-writing-root', 'hidden-writing-root')
  and auth.jwt() ->> 'email' = '2597631359@qq.com'
);

create policy "Fixed author can insert writing workspaces"
on public.public_writing_tree
for insert
to authenticated
with check (
  tree_key in ('public-writing-root', 'hidden-writing-root')
  and auth.jwt() ->> 'email' = '2597631359@qq.com'
  and created_by = auth.uid()
  and updated_by = auth.uid()
);

create policy "Fixed author can update writing workspaces"
on public.public_writing_tree
for update
to authenticated
using (
  tree_key in ('public-writing-root', 'hidden-writing-root')
  and auth.jwt() ->> 'email' = '2597631359@qq.com'
)
with check (
  tree_key in ('public-writing-root', 'hidden-writing-root')
  and auth.jwt() ->> 'email' = '2597631359@qq.com'
  and updated_by = auth.uid()
);

commit;
