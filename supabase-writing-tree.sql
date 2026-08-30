-- 写作区文章树 + 作者白名单 + RLS
-- 在 Supabase SQL 编辑器中运行。
-- 读取：所有人可读文章树。
-- 写入：仅限 author_profiles 白名单中 can_edit_writing = true 的登录用户。
--
-- 重要顺序：第 7 步按邮箱从 auth.users 匹配作者。若该邮箱尚未在
-- Supabase Auth 注册（没登录过），这条 insert 会匹配 0 行并静默跳过，
-- 白名单为空 → 写入被拒。请先用该邮箱走一次 OTP 登录，再跑第 7 步。

create extension if not exists pgcrypto;

-- 1. 创建文章树结构表
create table if not exists public.public_writing_tree (
  id uuid primary key default gen_random_uuid(),
  tree_key text not null unique default 'public-writing-root',
  tree_data jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. 自动更新 updated_at 触发器
create or replace function public.set_public_writing_tree_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_public_writing_tree_updated_at on public.public_writing_tree;
create trigger trg_public_writing_tree_updated_at
before update on public.public_writing_tree
for each row
execute function public.set_public_writing_tree_updated_at();

-- 3. 启用 RLS
alter table public.public_writing_tree enable row level security;

-- 所有人可读
drop policy if exists "public read writing tree" on public.public_writing_tree;
create policy "public read writing tree"
on public.public_writing_tree
for select
using (true);

-- 4. 创建作者白名单表
create table if not exists public.author_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  can_edit_writing boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.author_profiles enable row level security;

drop policy if exists "author can read own profile" on public.author_profiles;
create policy "author can read own profile"
on public.author_profiles
for select
to authenticated
using (
  auth.uid() = user_id
);

drop policy if exists "service role manages author profiles" on public.author_profiles;
create policy "service role manages author profiles"
on public.author_profiles
for all
to service_role
using (true)
with check (true);

-- 5. 作者身份校验函数（security definer 以绕过 author_profiles 的 RLS 读取限制）
create or replace function public.is_writing_author()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.author_profiles
    where user_id = auth.uid()
      and can_edit_writing = true
  );
$$;

-- 6. 配置文章树表增删改权限（仅限白名单作者）
drop policy if exists "authenticated insert writing tree" on public.public_writing_tree;
drop policy if exists "writing authors insert tree" on public.public_writing_tree;
create policy "writing authors insert tree"
on public.public_writing_tree
for insert
to authenticated
with check (
  public.is_writing_author()
);

drop policy if exists "authenticated update writing tree" on public.public_writing_tree;
drop policy if exists "writing authors update tree" on public.public_writing_tree;
create policy "writing authors update tree"
on public.public_writing_tree
for update
to authenticated
using (
  public.is_writing_author()
)
with check (
  public.is_writing_author()
);

drop policy if exists "authenticated delete writing tree" on public.public_writing_tree;
drop policy if exists "writing authors delete tree" on public.public_writing_tree;
create policy "writing authors delete tree"
on public.public_writing_tree
for delete
to authenticated
using (
  public.is_writing_author()
);

-- 7. 动态绑定作者白名单（自动匹配 auth.users 表中的邮箱）
-- 前置条件：该邮箱必须已在 Supabase Auth 注册（登录过一次），否则匹配 0 行静默跳过。
insert into public.author_profiles (user_id, email, can_edit_writing)
select id, email, true
from auth.users
where email = '2597631359@qq.com'
on conflict (user_id)
do update set
  email = excluded.email,
  can_edit_writing = excluded.can_edit_writing;
