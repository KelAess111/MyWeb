-- Afterlight 日志条目表 + RLS
-- 在 Supabase SQL 编辑器中运行。
-- 读取策略：任何人（含匿名访客）都能读取全部日志（含未公开）。
-- 未公开日志靠隐藏空间前端密钥保护，不靠数据库隔离。
-- 写入策略：仅限已登录且为该条目作者（auth.uid() = author_id）。

-- afterlight_entries
create table if not exists public.afterlight_entries (
  id uuid primary key default gen_random_uuid(),
  title text,
  entry_date date not null,
  body text not null,
  annotations jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  author_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.afterlight_entries is 'Afterlight 日志条目';
comment on column public.afterlight_entries.entry_date is '日志日期';
comment on column public.afterlight_entries.body is '日志正文';
comment on column public.afterlight_entries.annotations is '吐槽/旁注数组';
comment on column public.afterlight_entries.published is '是否公开（前端公开日志页只显示 true；隐藏空间日志页显示全部）';
comment on column public.afterlight_entries.author_id is '作者用户 ID';

create index if not exists afterlight_entries_published_entry_date_idx
  on public.afterlight_entries (published, entry_date desc, created_at desc);

create index if not exists afterlight_entries_author_id_idx
  on public.afterlight_entries (author_id);

-- updated_at 自动刷新
create or replace function public.set_afterlight_entries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_afterlight_entries_updated_at on public.afterlight_entries;

create trigger trg_set_afterlight_entries_updated_at
before update on public.afterlight_entries
for each row
execute function public.set_afterlight_entries_updated_at();

-- RLS
alter table public.afterlight_entries enable row level security;

-- 读取：任何人都能读全部日志（含未公开）
-- 未公开日志靠隐藏空间前端密钥保护，不靠数据库。
-- 注意：拿到 anon key 的人可直接调 REST API 读到未公开日志，绕过隐藏空间入口。
-- 真正绝密的内容不要放进未公开日志。
drop policy if exists "Public can read published entries" on public.afterlight_entries;
drop policy if exists "Authors can read own entries" on public.afterlight_entries;
drop policy if exists "Anyone can read all entries" on public.afterlight_entries;
create policy "Anyone can read all entries"
on public.afterlight_entries
for select
to anon, authenticated
using (true);

-- 作者可新增自己的条目
drop policy if exists "Authors can insert own entries" on public.afterlight_entries;
create policy "Authors can insert own entries"
on public.afterlight_entries
for insert
to authenticated
with check (auth.uid() = author_id);

-- 作者可更新自己的条目
drop policy if exists "Authors can update own entries" on public.afterlight_entries;
create policy "Authors can update own entries"
on public.afterlight_entries
for update
to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

-- 作者可删除自己的条目
drop policy if exists "Authors can delete own entries" on public.afterlight_entries;
create policy "Authors can delete own entries"
on public.afterlight_entries
for delete
to authenticated
using (auth.uid() = author_id);
