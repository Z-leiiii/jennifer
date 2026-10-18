alter table public.books
  add column if not exists file_url text,
  add column if not exists file_name text,
  add column if not exists file_type text;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'book-files',
  'book-files',
  true,
  52428800,
  array['application/pdf', 'application/epub+zip']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
