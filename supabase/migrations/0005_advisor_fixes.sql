-- =====================================================================
-- Makiti — 0005 : corrections suite aux advisors Supabase
-- =====================================================================
-- Deux fonctions n'avaient pas de search_path figé (touch_updated_at,
-- search_products) — la règle du projet dit « toujours », sans exception.
-- is_active_profile(pid) acceptait n'importe quel id de profil : appelable
-- directement en RPC par un inconnu, elle révélait si un profil ARBITRAIRE
-- (pas forcément le sien) était suspendu ou supprimé. Dans les faits, tous
-- les appels internes aux policies ne l'invoquent déjà que sur un profil
-- dont la propriété a été vérifiée juste avant (voir 0002) : ajouter cette
-- même vérification DANS la fonction ne change aucun comportement légitime,
-- et ferme la fuite pour un appel direct.

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.search_products(
  p_query       text default null,
  p_city_id     int  default null,
  p_category_id int  default null,
  p_sort        text default 'recent',
  p_limit       int  default 24,
  p_offset      int  default 0
)
returns table (
  product_id    uuid,
  title         text,
  price_gnf     bigint,
  is_negotiable boolean,
  category_id   int,
  is_featured   boolean,
  contact_count int,
  created_at    timestamptz,
  merchant_id   uuid,
  shop_name     text,
  city_id       int,
  city_name     text,
  image_path    text
)
language sql
stable
set search_path = ''
as $$
  select
    p.id, p.title, p.price_gnf, p.is_negotiable, p.category_id,
    p.is_featured, p.contact_count, p.created_at,
    m.id, m.shop_name, c.id, c.name,
    img.storage_path
  from public.products p
  join public.merchants m on m.id = p.merchant_id
  join public.cities    c on c.id = m.city_id
  left join lateral (
    select storage_path
      from public.product_images
     where product_id = p.id
     order by position
     limit 1
  ) img on true
  where p.status = 'active'
    and m.status = 'approved'
    and (p_city_id     is null or m.city_id     = p_city_id)
    and (p_category_id is null or p.category_id = p_category_id)
    and (
      p_query is null or trim(p_query) = ''
      or extensions.unaccent(p.title)                    ilike '%' || extensions.unaccent(trim(p_query)) || '%'
      or extensions.unaccent(coalesce(p.description, '')) ilike '%' || extensions.unaccent(trim(p_query)) || '%'
      or extensions.unaccent(m.shop_name)                ilike '%' || extensions.unaccent(trim(p_query)) || '%'
    )
  order by
    p.is_featured desc,
    case when p_sort = 'popular' then p.contact_count end desc nulls last,
    p.created_at desc
  limit  least(coalesce(p_limit, 24), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

create or replace function public.is_active_profile(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = pid and auth_user_id = auth.uid()
      and is_suspended = false and is_deleted = false
  );
$$;
