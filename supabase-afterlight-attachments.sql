-- Afterlight journal attachments + Storage buckets + RLS
-- Run this in the Supabase SQL Editor.

begin;

alter table public.afterlight_entries
  add column if not exists attachments jsonb not null default '[]'::jsonb;

comment on column public.afterlight_entries.attachments is 'Afterlight 日志的图片/视频附件数组';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'journal-images',
    'journal-images',
    true,
    52428800,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
  ),
  (
    'journal-videos',
    'journal-videos',
    true,
    209715200,
    array['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Clean up old policies first

drop policy if exists "Public read journal-images" on storage.objects;
drop policy if exists "Author upload journal-images" on storage.objects;
drop policy if exists "Author update journal-images" on storage.objects;
drop policy if exists "Author delete journal-images" on storage.objects;

drop policy if exists "Public read journal-videos" on storage.objects;
drop policy if exists "Author upload journal-videos" on storage.objects;
drop policy if exists "Author update journal-videos" on storage.objects;
drop policy if exists "Author delete journal-videos" on storage.objects;

-- journal-images: public read
create policy "Public read journal-images"
on storage.objects
for select
to public
using (bucket_id = 'journal-images');

-- journal-images: authenticated author write
create policy "Author upload journal-images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'journal-images'
  and auth.uid() is not null
);

create policy "Author update journal-images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'journal-images'
  and auth.uid() is not null
)
with check (
  bucket_id = 'journal-images'
  and auth.uid() is not null
);

create policy "Author delete journal-images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'journal-images'
  and auth.uid() is not null
);

-- journal-videos: public read
create policy "Public read journal-videos"
on storage.objects
for select
to public
using (bucket_id = 'journal-videos');

-- journal-videos: authenticated author write
create policy "Author upload journal-videos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'journal-videos'
  and auth.uid() is not null
);

create policy "Author update journal-videos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'journal-videos'
  and auth.uid() is not null
)
with check (
  bucket_id = 'journal-videos'
  and auth.uid() is not null
);

create policy "Author delete journal-videos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'journal-videos'
  and auth.uid() is not null
);

commit;
