-- =====================================================================
-- Makiti — 0001 : structure de la base
-- =====================================================================
-- À exécuter dans l'éditeur SQL de Supabase, dans l'ordre des fichiers.
-- Chaque bloc est commenté : lis-les, ne te contente pas de copier-coller.
-- =====================================================================

-- unaccent permet de traiter "telephone" et "téléphone" comme identiques.
-- Sur mobile, en Guinée, les accents sont rarement tapés : sans cette
-- extension, ta recherche renverrait zéro résultat la moitié du temps.
create extension if not exists unaccent with schema extensions;


-- ---------------------------------------------------------------------
-- Types énumérés
-- ---------------------------------------------------------------------
-- Pourquoi un ENUM plutôt qu'un simple texte ? Parce que la base refusera
-- physiquement d'enregistrer une valeur non prévue. Une faute de frappe
-- dans ton code devient une erreur immédiate, pas une donnée corrompue
-- que tu découvriras trois mois plus tard.

create type public.user_role       as enum ('client', 'merchant');
create type public.merchant_status as enum ('pending', 'approved', 'rejected');
create type public.product_status  as enum ('draft', 'active', 'sold', 'hidden');
create type public.report_target   as enum ('product', 'conversation', 'merchant');


-- ---------------------------------------------------------------------
-- Référentiels (listes fixes gérées par l'administrateur)
-- ---------------------------------------------------------------------

create table public.cities (
  id       serial primary key,
  name     text not null unique,
  position int  not null default 0   -- ordre d'affichage dans la liste
);

create table public.categories (
  id       serial primary key,
  slug     text not null unique,     -- identifiant stable pour les URL
  name     text not null,            -- libellé affiché, modifiable
  position int  not null default 0
);


-- ---------------------------------------------------------------------
-- Profils
-- ---------------------------------------------------------------------
-- Supabase gère les identifiants et mots de passe dans la table `auth.users`,
-- à laquelle tu n'as pas accès en écriture. `profiles` est TA table : elle
-- porte les informations métier et partage la même clé primaire.
-- `on delete cascade` : si le compte d'authentification disparaît, le profil
-- disparaît avec lui. Pas d'orphelins.

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         public.user_role not null,
  full_name    text not null,
  phone        text not null,        -- non vérifié : ce n'est PAS une preuve d'identité
  is_suspended boolean not null default false,
  created_at   timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- Boutiques
-- ---------------------------------------------------------------------
-- Une boutique par commerçant (contrainte `unique` sur profile_id).
-- `status` démarre à 'pending' : le commerçant prépare, tu valides.

create table public.merchants (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null unique references public.profiles(id) on delete cascade,
  shop_name        text not null,
  description      text,
  whatsapp_phone   text,               -- filet de sécurité si le chat reste sans réponse
  city_id          int  not null references public.cities(id),
  address_hint     text,               -- ex. « Marché Madina, allée 3 »
  status           public.merchant_status not null default 'pending',
  approved_at      timestamptz,
  -- Rempli par l'administrateur quand `status = 'rejected'`. Un refus sans
  -- motif est un vendeur perdu définitivement (voir docs/REPRISE.md,
  -- section 4) : l'écran « boutique refusée » a besoin de ce texte pour
  -- dire au commerçant ce qu'il doit corriger avant de renvoyer sa
  -- boutique.
  rejection_reason text,
  created_at       timestamptz not null default now()
);

create index merchants_city_idx   on public.merchants(city_id);
create index merchants_status_idx on public.merchants(status);


-- ---------------------------------------------------------------------
-- Produits
-- ---------------------------------------------------------------------
-- price_gnf est un BIGINT, jamais un nombre à virgule flottante. Les `float`
-- ne peuvent pas représenter exactement certaines valeurs décimales : on ne
-- stocke JAMAIS de l'argent avec. Le GNF n'ayant pas de subdivision utilisée,
-- l'entier est la représentation naturelle.
--
-- contact_count est une donnée DÉNORMALISÉE : on pourrait la recalculer en
-- comptant les conversations, mais on la stocke pour trier le fil sans
-- jointure coûteuse. Un trigger la tient à jour (voir plus bas). Le risque
-- de la dénormalisation, c'est la désynchronisation — d'où le trigger plutôt
-- qu'une mise à jour depuis le code applicatif, qu'on oublierait un jour.

create table public.products (
  id            uuid primary key default gen_random_uuid(),
  merchant_id   uuid not null references public.merchants(id) on delete cascade,
  category_id   int  not null references public.categories(id),
  title         text not null check (length(trim(title)) between 3 and 120),
  description   text check (length(description) <= 2000),
  price_gnf     bigint not null check (price_gnf >= 0),
  is_negotiable boolean not null default false,
  status        public.product_status not null default 'draft',
  is_featured   boolean not null default false,  -- « à la une », géré par l'admin
  contact_count int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index products_feed_idx     on public.products(status, created_at desc);
create index products_merchant_idx on public.products(merchant_id);
create index products_category_idx on public.products(category_id);


-- ---------------------------------------------------------------------
-- Photos
-- ---------------------------------------------------------------------
-- Le maximum de 3 photos n'est pas contrôlé par du code applicatif : il
-- découle de la structure. `position` ne peut valoir que 0, 1 ou 2, et le
-- couple (produit, position) est unique. Il devient donc IMPOSSIBLE
-- d'insérer une quatrième photo, même avec une requête forgée à la main.
-- Règle générale : préfère toujours une contrainte de base de données à une
-- vérification dans le code. Le code se contourne, la contrainte non.
--
-- Le minimum d'une photo, lui, ne peut pas s'exprimer ainsi : au moment où
-- on crée le produit, aucune photo n'existe encore. Il est vérifié au
-- passage en statut 'active' (voir 0002).

create table public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  position     smallint not null check (position between 0 and 2),
  created_at   timestamptz not null default now(),
  unique (product_id, position)
);


-- ---------------------------------------------------------------------
-- Conversations et messages
-- ---------------------------------------------------------------------
-- UN SEUL FIL PAR COUPLE (client, boutique) — voir `unique` ci-dessous.
-- Le commerçant retrouve donc une personne, pas une liste de demandes
-- éparpillées. C'est le modèle mental de WhatsApp, et c'est ce qui rend une
-- boîte de réception lisible quand le même client revient plusieurs fois.
--
-- Le prix de ce choix : la conversation ne porte plus de produit. C'est
-- chaque MESSAGE qui référence le produit dont il parle (voir plus bas).
-- Sans cette référence, le commerçant lit « bonjour, c'est combien ? » sans
-- savoir de quoi on lui parle — et le fil ne sert plus à rien.

create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.profiles(id) on delete cascade,
  merchant_id     uuid not null references public.merchants(id) on delete cascade,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique (client_id, merchant_id)
);

create index conversations_client_idx   on public.conversations(client_id, last_message_at desc);
create index conversations_merchant_idx on public.conversations(merchant_id, last_message_at desc);

-- `product_id` porte le contexte du message : « je te parle de CE produit ».
-- Il est nullable, parce qu'une fois le sujet posé, la suite de l'échange
-- n'a plus besoin de le répéter. En revanche le PREMIER message d'un fil
-- doit obligatoirement en porter un — c'est vérifié par un trigger dans
-- 0002, pas par l'interface : une règle qui doit toujours être vraie
-- n'appartient pas au navigateur.
--
-- `on delete set null` et non `cascade` : si un produit disparaît, on perd
-- le contexte, pas la conversation. Effacer l'échange d'un client parce que
-- le commerçant a supprimé une fiche serait une perte de données absurde.

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  product_id      uuid references public.products(id) on delete set null,
  body            text not null check (length(trim(body)) between 1 and 2000),
  read_at         timestamptz,       -- NULL = non lu, sert au badge de non-lus
  created_at      timestamptz not null default now()
);

create index messages_conversation_idx on public.messages(conversation_id, created_at);
create index messages_product_idx      on public.messages(product_id) where product_id is not null;


-- ---------------------------------------------------------------------
-- Signalements
-- ---------------------------------------------------------------------
-- Volontairement générique : un signalement peut viser un produit, une
-- conversation ou une boutique. Tu les traites dans le tableau de bord.

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type public.report_target not null,
  target_id   uuid not null,
  reason      text not null check (length(trim(reason)) between 3 and 1000),
  handled_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index reports_pending_idx on public.reports(created_at desc) where handled_at is null;
