-- Apply AFTER the original schema scripts. Run as the database owner in Supabase SQL Editor.
-- No content is deleted. Public media reads and anonymous questions remain available.
begin;

drop policy if exists "journal_author_only_insert" on storage.objects;
create policy "journal_author_only_insert" on storage.objects as restrictive for insert to public
with check (bucket_id not in ('journal-images', 'journal-videos') or auth.uid() = '8dff792d-ceab-4299-9d0a-e984191fe29c'::uuid)
;

drop policy if exists "journal_author_only_update" on storage.objects;
create policy "journal_author_only_update" on storage.objects as restrictive for update to public
using (bucket_id not in ('journal-images', 'journal-videos') or auth.uid() = '8dff792d-ceab-4299-9d0a-e984191fe29c'::uuid)
with check (bucket_id not in ('journal-images', 'journal-videos') or auth.uid() = '8dff792d-ceab-4299-9d0a-e984191fe29c'::uuid)
;

drop policy if exists "journal_author_only_delete" on storage.objects;
create policy "journal_author_only_delete" on storage.objects as restrictive for delete to public
using (bucket_id not in ('journal-images', 'journal-videos') or auth.uid() = '8dff792d-ceab-4299-9d0a-e984191fe29c'::uuid)
;

-- Only public question fields may be selected directly. RLS still controls rows.
revoke select on table public.qa_entries from public, anon, authenticated;
-- Also remove pre-existing column grants, including author_email.
do $$ declare fields text; begin
  select string_agg(quote_ident(attname), ', ') into fields from pg_attribute
    where attrelid = 'public.qa_entries'::regclass and attnum > 0 and not attisdropped;
  execute format('revoke select (%s) on public.qa_entries from public, anon, authenticated', fields);
end $$;
grant select (id, question, answer, author_name, status, created_at, answered_at, display_order, tags, likes_count) on public.qa_entries to anon, authenticated;

-- Keep author's complete admin read behind an authenticated identity check.
create or replace function public.get_author_questions()
returns setof public.qa_entries language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is distinct from '8dff792d-ceab-4299-9d0a-e984191fe29c'::uuid then
    raise exception 'Author access required' using errcode = '42501';
  end if;
  return query select * from public.qa_entries order by created_at desc;
end;
$$;
revoke all on function public.get_author_questions() from public, anon;
grant execute on function public.get_author_questions() to authenticated;

notify pgrst, 'reload schema';
commit;
-- Verification (read-only): review policies, column privileges, and bucket properties.
select policyname, cmd, permissive, roles, qual, with_check from pg_policies
where schemaname = 'storage' and tablename = 'objects';
select grantee, column_name, privilege_type from information_schema.column_privileges
where table_schema = 'public' and table_name = 'qa_entries' and grantee in ('anon','authenticated','PUBLIC');
