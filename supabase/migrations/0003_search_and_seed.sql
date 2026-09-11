-- =====================================================================
-- Makiti — 0003 : recherche, fil d'accueil et données de référence
-- =====================================================================

-- ---------------------------------------------------------------------
-- Fonction unique pour le fil et la recherche
-- ---------------------------------------------------------------------
-- Pourquoi une fonction SQL plutôt que des requêtes construites côté
-- navigateur ? Trois raisons :
--   1. la logique de tri vit à un seul endroit, donc elle ne diverge pas ;
--   2. le code de la page reste lisible : un seul appel, trois paramètres ;
--   3. elle est testable directement dans l'éditeur SQL, sans lancer l'app.
--
-- Choix assumé : ILIKE plutôt que la recherche plein texte de PostgreSQL.
-- ILIKE '%mot%' ne peut pas utiliser d'index classique, donc il lit toute la
-- table. À ton échelle — quelques milliers de produits — c'est de l'ordre de
-- la milliseconde : totalement invisible. La recherche plein texte serait
-- plus rapide, mais plus complexe à écrire, à comprendre et à déboguer.
-- Optimiser avant d'avoir un problème mesuré, c'est payer une complexité
-- immédiate pour un gain hypothétique. On migrera vers `tsvector` le jour où
-- une mesure le justifiera — pas avant.
--
-- La fonction n'est PAS `security definer` : elle s'exécute avec les droits
-- de l'appelant, donc le RLS s'applique normalement. Un produit masqué reste
-- invisible même à travers elle.

-- `create or replace` ne suffit pas : PostgreSQL refuse de changer le type
-- de retour d'une fonction existante (ici, deux colonnes ajoutées). Il faut
-- la supprimer d'abord — sans risque, rien ne l'appelait encore en dehors
-- de ce fichier au moment de ce changement.
drop function if exists public.search_products(text, int, int, text, int, int);

create or replace function public.search_products(
  p_query       text default null,
  p_city_id     int  default null,
  p_category_id int  default null,
  p_sort        text default 'recent',   -- 'recent' | 'popular'
  p_limit       int  default 24,
  p_offset      int  default 0
)
returns table (
  product_id    uuid,
  title         text,
  price_gnf     bigint,
  is_negotiable boolean,
  status        public.product_status,
  category_id   int,
  category_name text,
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
    p.id, p.title, p.price_gnf, p.is_negotiable, p.status,
    p.category_id, cat.name,
    p.is_featured, p.contact_count, p.created_at,
    m.id, m.shop_name, c.id, c.name,
    img.storage_path
  from public.products p
  join public.merchants  m on m.id = p.merchant_id
  join public.cities     c on c.id = m.city_id
  join public.categories cat on cat.id = p.category_id
  left join lateral (
    select storage_path
      from public.product_images
     where product_id = p.id
     order by position
     limit 1
  ) img on true
  -- 'sold' reste visible (grisé, prix barré côté écran) : un produit vendu
  -- n'est pas retiré du catalogue, seul son statut change. Seuls 'draft' et
  -- 'hidden' disparaissent.
  where p.status in ('active', 'sold')
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
  limit  least(coalesce(p_limit, 24), 50)   -- plafond dur : personne n'aspire le catalogue
  offset greatest(coalesce(p_offset, 0), 0);
$$;

grant execute on function public.search_products(text, int, int, text, int, int)
  to anon, authenticated;


-- ---------------------------------------------------------------------
-- Villes
-- ---------------------------------------------------------------------
-- Liste de départ, à ajuster selon ta zone de lancement. Si tu démarres sur
-- Conakry uniquement, tu auras tout intérêt à remplacer cette liste par les
-- communes (Kaloum, Dixinn, Matam, Ratoma, Matoto) : « Conakry » est trop
-- large pour un client qui veut acheter à côté de chez lui.

insert into public.cities (name, position) values
  ('Conakry', 1), ('Coyah', 2), ('Dubréka', 3), ('Kindia', 4),
  ('Boké', 5), ('Labé', 6), ('Mamou', 7), ('Faranah', 8),
  ('Kankan', 9), ('Siguiri', 10), ('Kissidougou', 11), ('Nzérékoré', 12)
on conflict (name) do nothing;


-- ---------------------------------------------------------------------
-- Catégories
-- ---------------------------------------------------------------------
-- Dix catégories, volontairement larges. Une liste trop fine oblige le
-- commerçant à réfléchir et le client à chercher : les deux abandonnent.
-- « Autre » existe pour éviter qu'un produit ne soit pas publiable du tout —
-- surveille son remplissage : si elle devient la plus grosse catégorie,
-- c'est le signal qu'il manque une catégorie à ta liste.

insert into public.categories (slug, name, position) values
  ('alimentation',  'Alimentation & Boissons',      1),
  ('mode',          'Vêtements & Chaussures',       2),
  ('electronique',  'Électronique & Téléphones',    3),
  ('beaute',        'Beauté & Cosmétiques',         4),
  ('maison',        'Maison & Meubles',             5),
  ('materiaux',     'Matériaux & Bricolage',        6),
  ('enfants',       'Bébé & Enfants',               7),
  ('sport',         'Sport & Loisirs',              8),
  ('vehicules',     'Véhicules & Pièces',           9),
  ('autre',         'Autre',                       10)
on conflict (slug) do nothing;
