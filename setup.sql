-- Run ONCE in your database SQL editor so pictures and units are saved.
alter table public.products add column if not exists image_key text;
alter table public.products add column if not exists unit text default 'pc';
alter table public.products add column if not exists unit_size numeric default 1;
-- If your get_pickngo_public_products function lists columns by name,
-- add image_key, unit, unit_size to it so customers see them too.
