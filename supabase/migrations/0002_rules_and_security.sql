-- =====================================================================
-- Makiti — 0002 : règles métier et sécurité
-- =====================================================================
-- C'EST LE FICHIER LE PLUS IMPORTANT DU PROJET.
--
-- Avec Supabase, le navigateur du client parle DIRECTEMENT à PostgreSQL.
-- Il n'y a pas de serveur intermédiaire pour vérifier les droits. Autrement
-- dit : n'importe qui peut ouvrir la console de son navigateur et écrire
-- ses propres requêtes vers ta base.
--
-- La seule chose qui l'en empêche, c'est le Row Level Security (RLS) : des
-- règles écrites DANS la base, qui filtrent les lignes visibles selon
-- l'utilisateur connecté. Sans RLS, toutes les conversations privées de tous
-- tes utilisateurs sont lisibles publiquement. C'est la faille numéro un des
-- projets Supabase de débutants, et elle a déjà fait fuiter de vraies bases.
--
-- Règle à retenir : RLS activé sur CHAQUE table, sans exception.
-- =====================================================================


-- =====================================================================
-- PARTIE 1 — Fonctions utilitaires
-- =====================================================================

-- Un utilisateur suspendu ne doit plus rien pouvoir écrire.
-- `security definer` : la fonction s'exécute avec les droits de son
-- propriétaire, donc elle contourne le RLS. C'est indispensable ici, sinon
-- une règle posée SUR la table profiles qui interroge la table profiles
-- tournerait en boucle infinie. C'est un outil puissant et donc dangereux :
-- on ne l'utilise que sur des fonctions courtes et vérifiées, et on fige
-- toujours `search_path` pour empêcher le détournement de noms.
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_suspended = false
  );
$$;

-- Renvoie l'identifiant de la boutique de l'utilisateur connecté, ou NULL.
create or replace function public.my_merchant_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.merchants where profile_id = auth.uid();
$$;


-- =====================================================================
-- PARTIE 2 — Création automatique du profil à l'inscription
-- =====================================================================
-- Supabase crée la ligne dans `auth.users`. Ce trigger crée la ligne
-- correspondante dans `profiles`, à partir des métadonnées envoyées au
-- moment de l'inscription.
--
-- Point de sécurité à comprendre : `role` vient du navigateur, donc de
-- l'utilisateur. Il peut donc mentir et s'inscrire comme 'merchant'. Est-ce
-- grave ? Non — car s'inscrire comme commerçant ne donne aucun privilège :
-- sa boutique reste en 'pending' et il ne peut rien publier tant que TU ne
-- l'as pas approuvé. Le privilège réel est protégé ailleurs.
-- Le raisonnement compte plus que la règle : demande-toi toujours ce qu'une
-- donnée contrôlée par l'utilisateur permet réellement d'obtenir.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'client')::public.user_role,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Utilisateur'),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =====================================================================
-- PARTIE 3 — Règles métier appliquées par la base
-- =====================================================================

-- 3.1 — `updated_at` tenu à jour automatiquement.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();


-- 3.2 — Un produit ne peut être publié qu'avec au moins une photo, et
-- seulement si la boutique est approuvée.
-- Pourquoi ici et pas dans le code de la page ? Parce qu'une vérification
-- côté navigateur se contourne en dix secondes. Ce qui doit être vrai en
-- toutes circonstances s'écrit dans la base.
create or replace function public.check_product_publishable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'active' then
    if not exists (
      select 1 from public.product_images where product_id = new.id
    ) then
      raise exception 'Un produit doit avoir au moins une photo pour être publié.';
    end if;

    if not exists (
      select 1 from public.merchants
      where id = new.merchant_id and status = 'approved'
    ) then
      raise exception 'Votre boutique doit être validée avant de publier.';
    end if;
  end if;
  return new;
end;
$$;

create trigger products_check_publishable
  before insert or update of status on public.products
  for each row execute function public.check_product_publishable();


-- 3.3 — Compteur de contacts (sert au tri « populaires »).
create or replace function public.bump_contact_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.products
     set contact_count = contact_count + 1
   where id = new.product_id;
  return new;
end;
$$;

create trigger conversations_bump_contact_count
  after insert on public.conversations
  for each row execute function public.bump_contact_count();


-- 3.4 — Anti-spam : 20 nouvelles conversations maximum par jour et par client.
-- Invisible pour un usage normal, mais empêche un script d'ouvrir des
-- milliers de fils en une nuit et de noyer tous tes commerçants.
-- C'est une protection PRÉVENTIVE : le bouton « signaler » et la suspension
-- de compte, eux, n'interviennent qu'après les dégâts.
create or replace function public.check_conversation_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent_count int;
begin
  select count(*) into recent_count
    from public.conversations
   where client_id = new.client_id
     and created_at > now() - interval '1 day';

  if recent_count >= 20 then
    raise exception 'Limite atteinte : 20 nouvelles conversations par jour maximum.';
  end if;
  return new;
end;
$$;

create trigger conversations_rate_limit
  before insert on public.conversations
  for each row execute function public.check_conversation_rate_limit();


-- 3.5 — Remonter une conversation dès qu'un message y arrive.
create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation();


-- =====================================================================
-- PARTIE 4 — Colonnes interdites à l'écriture par les utilisateurs
-- =====================================================================
-- Le RLS filtre des LIGNES, pas des COLONNES. Sans ce bloc, un commerçant
-- pourrait modifier sa propre ligne — c'est autorisé — et en profiter pour
-- passer son statut à 'approved' ou son produit à 'à la une'. Il s'auto-valide.
--
-- ATTENTION, PIÈGE : on ne peut PAS se contenter de révoquer les colonnes
-- sensibles. En PostgreSQL, révoquer un privilège au niveau colonne n'a
-- aucun effet tant que l'utilisateur détient le privilège UPDATE au niveau
-- TABLE — et Supabase accorde ce privilège par défaut à tous les comptes
-- connectés. La révocation passerait sans erreur, et la faille resterait
-- grande ouverte.
--
-- La seule méthode correcte : révoquer UPDATE sur la table entière, puis
-- ré-accorder colonne par colonne. C'est une liste blanche, pas une liste
-- noire. Le principe est général et vaut bien au-delà de SQL : une liste
-- noire oublie toujours quelque chose, une liste blanche est explicite.
-- Corollaire : à chaque nouvelle colonne, il faudra décider ici si elle est
-- modifiable par l'utilisateur. Cet effort est voulu.

revoke update on public.profiles  from authenticated, anon;
grant  update (full_name, phone)
  on public.profiles to authenticated;

revoke update on public.merchants from authenticated, anon;
grant  update (shop_name, description, whatsapp_phone, city_id, address_hint)
  on public.merchants to authenticated;

-- `status` reste modifiable par le commerçant : c'est lui qui publie, retire
-- ou marque son produit comme vendu. Le trigger 3.2 encadre ce qu'il a le
-- droit d'en faire. En revanche `is_featured`, `contact_count` et
-- `merchant_id` lui échappent totalement.
revoke update on public.products from authenticated, anon;
grant  update (category_id, title, description, price_gnf, is_negotiable, status)
  on public.products to authenticated;

-- Les référentiels sont en lecture seule pour tout le monde.
revoke insert, update, delete on public.cities     from authenticated, anon;
revoke insert, update, delete on public.categories from authenticated, anon;


-- =====================================================================
-- PARTIE 5 — Activation du RLS
-- =====================================================================
-- Dès qu'il est activé, TOUT est refusé par défaut. Chaque accès doit
-- ensuite être autorisé explicitement par une policy. C'est le bon sens de
-- la sécurité : on ouvre ce dont on a besoin, on n'essaie pas de deviner ce
-- qu'il faudrait fermer.

alter table public.cities         enable row level security;
alter table public.categories     enable row level security;
alter table public.profiles       enable row level security;
alter table public.merchants      enable row level security;
alter table public.products       enable row level security;
alter table public.product_images enable row level security;
alter table public.conversations  enable row level security;
alter table public.messages       enable row level security;
alter table public.reports        enable row level security;

-- Note : l'administrateur (toi, dans le tableau de bord Supabase) utilise la
-- clé `service_role`, qui ignore volontairement le RLS. C'est pour cela que
-- tu peux tout voir et tout corriger sans qu'on ait à coder une page admin.
-- Corollaire : cette clé ne doit JAMAIS se retrouver dans le navigateur ni
-- dans un fichier versionné. Elle donne un accès total à la base.


-- =====================================================================
-- PARTIE 6 — Policies
-- =====================================================================

-- 6.1 Référentiels : lisibles par tout le monde, y compris les visiteurs
-- non connectés (le catalogue est public).
create policy "cities: lecture publique"
  on public.cities for select using (true);

create policy "categories: lecture publique"
  on public.categories for select using (true);


-- 6.2 Profils : chacun voit le sien. Un interlocuteur voit le nom de la
-- personne avec qui il discute — et rien de plus, ce qui suppose de ne
-- jamais sélectionner `phone` côté client sans raison.
create policy "profiles: je vois mon profil"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: je vois mes interlocuteurs"
  on public.profiles for select
  using (
    exists (
      select 1
        from public.conversations c
        join public.merchants m on m.id = c.merchant_id
       where (c.client_id = public.profiles.id and m.profile_id = auth.uid())
          or (m.profile_id  = public.profiles.id and c.client_id  = auth.uid())
    )
  );

create policy "profiles: je modifie mon profil"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());


-- 6.3 Boutiques : les boutiques approuvées sont publiques ; un commerçant
-- voit toujours la sienne, même en attente de validation.
create policy "merchants: boutiques approuvees publiques"
  on public.merchants for select
  using (status = 'approved' or profile_id = auth.uid());

create policy "merchants: je cree ma boutique"
  on public.merchants for insert
  with check (
    profile_id = auth.uid()
    and public.is_active_user()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'merchant'
    )
  );

create policy "merchants: je modifie ma boutique"
  on public.merchants for update
  using (profile_id = auth.uid() and public.is_active_user())
  with check (profile_id = auth.uid());


-- 6.4 Produits.
-- `using` filtre ce qu'on peut LIRE ou modifier ; `with check` valide ce
-- qu'on tente d'ÉCRIRE. Ici, un commerçant en attente peut créer et
-- modifier ses brouillons, mais le trigger 3.2 lui refusera la publication.
create policy "products: catalogue public"
  on public.products for select
  using (
    (status = 'active' and exists (
      select 1 from public.merchants m
      where m.id = public.products.merchant_id and m.status = 'approved'
    ))
    or merchant_id = public.my_merchant_id()
  );

create policy "products: je gere mes produits"
  on public.products for all
  using (merchant_id = public.my_merchant_id() and public.is_active_user())
  with check (merchant_id = public.my_merchant_id() and public.is_active_user());


-- 6.5 Photos : elles suivent exactement la visibilité du produit.
create policy "product_images: visibles avec le produit"
  on public.product_images for select
  using (
    exists (
      select 1 from public.products p
      where p.id = public.product_images.product_id
        and (
          (p.status = 'active' and exists (
             select 1 from public.merchants m
             where m.id = p.merchant_id and m.status = 'approved'))
          or p.merchant_id = public.my_merchant_id()
        )
    )
  );

create policy "product_images: je gere les photos de mes produits"
  on public.product_images for all
  using (
    exists (select 1 from public.products p
            where p.id = public.product_images.product_id
              and p.merchant_id = public.my_merchant_id())
    and public.is_active_user()
  )
  with check (
    exists (select 1 from public.products p
            where p.id = public.product_images.product_id
              and p.merchant_id = public.my_merchant_id())
    and public.is_active_user()
  );


-- 6.6 Conversations : strictement réservées à leurs deux participants.
-- C'est la policy la plus critique du fichier. Une erreur ici et toutes les
-- conversations privées deviennent publiques.
create policy "conversations: reservees aux participants"
  on public.conversations for select
  using (
    client_id = auth.uid()
    or merchant_id = public.my_merchant_id()
  );

-- Seul un client peut ouvrir une conversation, uniquement sur un produit
-- réellement publié par une boutique approuvée.
create policy "conversations: un client contacte un commercant"
  on public.conversations for insert
  with check (
    client_id = auth.uid()
    and public.is_active_user()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'client'
    )
    and exists (
      select 1
        from public.products p
        join public.merchants m on m.id = p.merchant_id
       where p.id = public.conversations.product_id
         and p.status = 'active'
         and m.status = 'approved'
         and m.id = public.conversations.merchant_id
    )
  );


-- 6.7 Messages : lisibles et écrivables par les participants uniquement.
create policy "messages: lecture par les participants"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = public.messages.conversation_id
        and (c.client_id = auth.uid() or c.merchant_id = public.my_merchant_id())
    )
  );

create policy "messages: envoi par les participants"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and public.is_active_user()
    and exists (
      select 1 from public.conversations c
      where c.id = public.messages.conversation_id
        and (c.client_id = auth.uid() or c.merchant_id = public.my_merchant_id())
    )
  );

-- Marquer comme lu : uniquement les messages reçus, jamais ceux qu'on a
-- envoyés soi-même.
create policy "messages: marquer comme lu"
  on public.messages for update
  using (
    sender_id <> auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = public.messages.conversation_id
        and (c.client_id = auth.uid() or c.merchant_id = public.my_merchant_id())
    )
  )
  with check (true);


-- 6.8 Signalements : on crée le sien, on relit le sien. Toi seul les traites.
create policy "reports: je signale"
  on public.reports for insert
  with check (reporter_id = auth.uid() and public.is_active_user());

create policy "reports: je relis mes signalements"
  on public.reports for select
  using (reporter_id = auth.uid());
