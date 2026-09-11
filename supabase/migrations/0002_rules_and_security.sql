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

-- Depuis la décision des comptes liés (2026-09-11), `auth.uid()` identifie
-- une CONNEXION, plus un profil : la même connexion peut porter un profil
-- client et un profil commerçant. Chaque policy plus bas a donc besoin de
-- savoir « lequel de MES profils est concerné », pas juste « est-ce moi ».
-- Ces fonctions sont le seul endroit qui traduit auth.uid() en identifiants
-- de profil — si cette traduction devait changer un jour, il y a UN seul
-- endroit à corriger, pas une recherche dans tout le fichier.
-- `security definer` : la fonction s'exécute avec les droits de son
-- propriétaire, donc elle contourne le RLS. C'est indispensable ici, sinon
-- une règle posée SUR la table profiles qui interroge la table profiles
-- tournerait en boucle infinie. C'est un outil puissant et donc dangereux :
-- on ne l'utilise que sur des fonctions courtes et vérifiées, et on fige
-- toujours `search_path` pour empêcher le détournement de noms.

-- Le profil (client OU commerçant) de la connexion active, pour le rôle
-- demandé. NULL si cette connexion n'a pas (encore) ce compte-là.
create or replace function public.my_profile_id(want_role public.user_role)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.profiles
  where auth_user_id = auth.uid() and role = want_role;
$$;

-- Un profil donné appartient-il à la connexion active ? Sert à valider
-- `sender_id` sur les messages, qui peut être mon profil client OU mon
-- profil commerçant selon le fil concerné — `my_profile_id` seul ne
-- suffit pas puisqu'il faut choisir un rôle à l'avance.
create or replace function public.owns_profile(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = pid and auth_user_id = auth.uid()
  );
$$;

-- Ce profil précis est-il actif (ni suspendu, ni supprimé) ? Volontairement
-- paramétrée par profil et non par connexion : les deux comptes liés d'une
-- même personne sont modérés indépendamment (voir docs/SPEC.md, décision
-- 8) — suspendre le compte client d'un fauteur de troubles ne doit pas
-- geler sa boutique, qui n'a rien à y voir.
create or replace function public.is_active_profile(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = pid and is_suspended = false and is_deleted = false
  );
$$;

-- Renvoie l'identifiant de la boutique du profil COMMERÇANT de la
-- connexion active, ou NULL si elle n'en a pas.
create or replace function public.my_merchant_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.merchants
  where profile_id = public.my_profile_id('merchant');
$$;


-- =====================================================================
-- PARTIE 2 — Création automatique du PREMIER profil à l'inscription
-- =====================================================================
-- Supabase crée la ligne dans `auth.users`. Ce trigger crée le profil
-- correspondant dans `profiles`, à partir des métadonnées envoyées au
-- moment de l'inscription. Il ne s'exécute qu'à la création de la
-- CONNEXION elle-même — donc une seule fois par personne, pour son premier
-- compte (client ou commerçant). Le second compte lié, s'il est créé plus
-- tard, passe par la policy « profiles: je cree mon second compte »
-- (partie 6), pas par ce trigger : à ce moment-là `auth.users` existe déjà.
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
  insert into public.profiles (auth_user_id, role, full_name, phone)
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
-- Il ne compte pas les messages, mais le nombre de CLIENTS DISTINCTS ayant
-- posé une question sur ce produit. Sans cette distinction, un client
-- bavard ferait grimper artificiellement un produit dans le classement, et
-- ton fil récompenserait le bruit au lieu de l'intérêt réel.
create or replace function public.bump_contact_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_client uuid;
begin
  if new.product_id is null then
    return new;
  end if;

  select client_id into v_client
    from public.conversations where id = new.conversation_id;

  -- Premier message de CE client sur CE produit ?
  if not exists (
    select 1
      from public.messages m
      join public.conversations c on c.id = m.conversation_id
     where m.product_id = new.product_id
       and c.client_id  = v_client
       and m.id <> new.id
  ) then
    update public.products
       set contact_count = contact_count + 1
     where id = new.product_id;
  end if;

  return new;
end;
$$;

create trigger messages_bump_contact_count
  after insert on public.messages
  for each row execute function public.bump_contact_count();


-- 3.4 — Anti-spam, DEUX limites complémentaires.
--
-- Le passage à « un fil par client » a déplacé le problème : puisqu'un
-- client n'ouvre plus qu'un seul fil par boutique, limiter les fils ne
-- protège plus de rien — il suffirait d'envoyer 5 000 messages dans le même
-- fil pour noyer un commerçant. Il faut donc verrouiller les deux portes :
--   (a) le nombre de commerçants qu'un client peut contacter par jour ;
--   (b) le nombre de messages qu'il peut envoyer par jour, tous fils confondus.
--
-- Leçon générale : quand tu changes un modèle de données, redemande-toi ce
-- que tes protections existantes protégeaient encore. Une règle de sécurité
-- écrite pour l'ancien modèle devient souvent décorative dans le nouveau,
-- sans qu'aucun test ne le signale.
--
-- Ces protections sont PRÉVENTIVES : le bouton « signaler » et la suspension
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


-- (b) 100 messages par jour et par expéditeur, tous fils confondus.
-- Volontairement large : un commerçant très actif qui répond à trente
-- clients dans la journée ne doit jamais rencontrer cette limite.
create or replace function public.check_message_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent_count int;
begin
  select count(*) into recent_count
    from public.messages
   where sender_id = new.sender_id
     and created_at > now() - interval '1 day';

  if recent_count >= 100 then
    raise exception 'Limite atteinte : 100 messages par jour maximum.';
  end if;
  return new;
end;
$$;

create trigger messages_rate_limit
  before insert on public.messages
  for each row execute function public.check_message_rate_limit();


-- 3.4 bis — Cohérence du produit référencé par un message.
-- Deux règles que l'interface ne doit PAS être seule à garantir :
--   1. le premier message d'un fil porte obligatoirement un produit,
--      sinon le commerçant reçoit une question sans objet ;
--   2. le produit référencé appartient bien à la boutique destinataire.
--      Sans cette vérification, on pourrait écrire à la boutique A en
--      référençant un produit de la boutique B — affichage incohérent au
--      mieux, moyen de sonder l'existence de produits masqués au pire.
create or replace function public.check_message_product()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_merchant  uuid;
  v_is_first  boolean;
begin
  select merchant_id into v_merchant
    from public.conversations where id = new.conversation_id;

  v_is_first := not exists (
    select 1 from public.messages
     where conversation_id = new.conversation_id
  );

  if v_is_first and new.product_id is null then
    raise exception 'Le premier message doit préciser le produit concerné.';
  end if;

  if new.product_id is not null then
    if not exists (
      select 1 from public.products
       where id = new.product_id
         and merchant_id = v_merchant
         and status in ('active', 'sold')
    ) then
      raise exception 'Ce produit n''appartient pas à cette boutique.';
    end if;
  end if;

  return new;
end;
$$;

create trigger messages_check_product
  before insert on public.messages
  for each row execute function public.check_message_product();


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

-- `is_suspended`, `is_deleted` et `deleted_at` restent hors de cette liste
-- blanche. `is_suspended` est déjà admin-only ; `is_deleted`/`deleted_at`
-- le sont pour une autre raison : « supprimer mon compte » doit aussi
-- couper l'accès à `auth.users`, ce que RLS ne peut pas faire — ça
-- suppose une fonction serveur avec `service_role` (voir docs/REPRISE.md,
-- étape 9). Laisser le client écrire `is_deleted` directement ouvrirait
-- une fenêtre où le profil est marqué supprimé mais la connexion reste
-- active — un état incohérent qu'une seule opération atomique évite.
--
-- `auth_user_id` et `role` non plus : le premier ferait basculer un profil
-- vers une autre connexion (vol de compte), le second transformerait un
-- profil client en commerçant sans repasser par la validation d'une
-- boutique. Vouloir « l'autre rôle » crée un SECOND profil (policy plus
-- bas), ça ne mute jamais le premier.

revoke update on public.merchants from authenticated, anon;
grant  update (shop_name, description, whatsapp_phone, city_id, address_hint)
  on public.merchants to authenticated;

-- `status`, `approved_at` et `rejection_reason` restent hors de cette liste
-- blanche, volontairement : ce sont les trois colonnes que SEUL
-- l'administrateur écrit, depuis le tableau de bord (avec `service_role`,
-- qui ignore le RLS). Un commerçant qui pourrait écrire son propre motif
-- de refus pourrait tout aussi bien l'effacer.

-- `status` reste modifiable par le commerçant : c'est lui qui publie, retire
-- ou marque son produit comme vendu. Le trigger 3.2 encadre ce qu'il a le
-- droit d'en faire. En revanche `is_featured`, `contact_count` et
-- `merchant_id` lui échappent totalement.
revoke update on public.products from authenticated, anon;
grant  update (category_id, title, description, price_gnf, is_negotiable, status)
  on public.products to authenticated;

-- Sur `messages`, la seule modification légitime est le passage en « lu ».
-- Sans cette restriction, la policy 6.7 « marquer comme lu » laisserait un
-- participant RÉÉCRIRE le message de son interlocuteur : elle autorise la
-- modification des lignes reçues, et sans liste blanche de colonnes cette
-- autorisation couvre `body`. Un commerçant pourrait donc falsifier ce que
-- le client lui a écrit, ou l'inverse.
-- Le RLS choisit QUELLES LIGNES sont accessibles ; lui seul ne suffit
-- jamais. Il faut toujours se demander en plus : quelles COLONNES ?
revoke update on public.messages from authenticated, anon;
grant  update (read_at) on public.messages to authenticated;

-- Une conversation n'est presque jamais modifiée par un utilisateur : sa
-- date de dernier message est tenue à jour par un trigger. La seule
-- exception est `blocked_by` (écran 32, policy 6.6 bis plus bas) : un
-- participant peut s'y désigner lui-même comme bloqueur, rien d'autre.
revoke update on public.conversations from authenticated, anon;
grant  update (blocked_by) on public.conversations to authenticated;

-- Rien ne s'efface : on masque (voir `status`). Supprimer une fiche
-- détruirait le contexte des conversations qui y renvoient.
revoke delete on public.messages, public.conversations from authenticated, anon;

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


-- 6.2 Profils : chacun voit LES SIENS — au pluriel, une connexion peut en
-- porter deux (voir partie 1). Un interlocuteur voit le nom de la personne
-- avec qui il discute — et rien de plus, ce qui suppose de ne jamais
-- sélectionner `phone` côté client sans raison.
create policy "profiles: je vois mes profils"
  on public.profiles for select
  using (auth_user_id = auth.uid());

create policy "profiles: je vois mes interlocuteurs"
  on public.profiles for select
  using (
    exists (
      select 1
        from public.conversations c
        join public.merchants m on m.id = c.merchant_id
       where (c.client_id = public.profiles.id and m.profile_id = public.my_profile_id('merchant'))
          or (m.profile_id  = public.profiles.id and c.client_id  = public.my_profile_id('client'))
    )
  );

create policy "profiles: je modifie mon profil"
  on public.profiles for update
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- Créer le SECOND compte lié (écran 12 : « vous pourrez créer l'autre
-- compte plus tard »). Le premier passe par le trigger `handle_new_user`
-- (partie 2), pas par cette policy — à l'inscription, `auth.uid()` dans une
-- policy RLS n'est pas encore utilisable de la même transaction. Rien
-- n'empêche ici de redemander un rôle déjà possédé : la contrainte
-- `unique (auth_user_id, role)` s'en charge, avec un message d'erreur
-- réseau plutôt qu'une policy qui devrait dupliquer la même logique.
create policy "profiles: je cree mon second compte"
  on public.profiles for insert
  with check (auth_user_id = auth.uid());


-- 6.3 Boutiques : les boutiques approuvées sont publiques ; un commerçant
-- voit toujours la sienne, même en attente de validation.
create policy "merchants: boutiques approuvees publiques"
  on public.merchants for select
  using (status = 'approved' or profile_id = public.my_profile_id('merchant'));

-- `profile_id = my_profile_id('merchant')` suffit à vérifier à la fois la
-- propriété ET le rôle : cette fonction ne renvoie que l'id d'un profil de
-- rôle 'merchant' appartenant à la connexion active (partie 1).
create policy "merchants: je cree ma boutique"
  on public.merchants for insert
  with check (
    profile_id = public.my_profile_id('merchant')
    and public.is_active_profile(profile_id)
  );

create policy "merchants: je modifie ma boutique"
  on public.merchants for update
  using (profile_id = public.my_profile_id('merchant') and public.is_active_profile(profile_id))
  with check (profile_id = public.my_profile_id('merchant'));


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
  using (merchant_id = public.my_merchant_id() and public.is_active_profile(public.my_profile_id('merchant')))
  with check (merchant_id = public.my_merchant_id() and public.is_active_profile(public.my_profile_id('merchant')));


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
    and public.is_active_profile(public.my_profile_id('merchant'))
  )
  with check (
    exists (select 1 from public.products p
            where p.id = public.product_images.product_id
              and p.merchant_id = public.my_merchant_id())
    and public.is_active_profile(public.my_profile_id('merchant'))
  );


-- 6.6 Conversations : strictement réservées à leurs deux participants.
-- C'est la policy la plus critique du fichier. Une erreur ici et toutes les
-- conversations privées deviennent publiques.
create policy "conversations: reservees aux participants"
  on public.conversations for select
  using (
    client_id = public.my_profile_id('client')
    or merchant_id = public.my_merchant_id()
  );

-- Seul un client peut ouvrir une conversation, et seulement vers une
-- boutique validée. Le contrôle du produit ne se fait plus ici — il a suivi
-- le produit là où il vit maintenant, c'est-à-dire sur le message
-- (trigger 3.4 bis). `client_id = my_profile_id('client')` vérifie à la
-- fois la propriété et le rôle, comme pour les boutiques plus haut.
create policy "conversations: un client contacte un commercant"
  on public.conversations for insert
  with check (
    client_id = public.my_profile_id('client')
    and public.is_active_profile(client_id)
    and exists (
      select 1 from public.merchants m
      where m.id = public.conversations.merchant_id
        and m.status = 'approved'
    )
  );

-- 6.6 bis Blocage (écran 32) : un participant se désigne lui-même comme
-- bloqueur — jamais l'autre. Écrit en deux branches (je suis le client /
-- je suis le commerçant) plutôt qu'un `owns_profile(blocked_by)` seul :
-- une connexion avec ses deux comptes liés pourrait sinon désigner son
-- AUTRE profil (non participant à CE fil) comme bloqueur, une valeur
-- possédée mais dénuée de sens ici.
create policy "conversations: je bloque mon interlocuteur"
  on public.conversations for update
  using (client_id = public.my_profile_id('client') or merchant_id = public.my_merchant_id())
  with check (
    (client_id = public.my_profile_id('client') and blocked_by = client_id)
    or
    (merchant_id = public.my_merchant_id()
     and blocked_by = (select profile_id from public.merchants where id = merchant_id))
  );


-- 6.7 Messages : lisibles et écrivables par les participants uniquement.
create policy "messages: lecture par les participants"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = public.messages.conversation_id
        and (c.client_id = public.my_profile_id('client') or c.merchant_id = public.my_merchant_id())
    )
  );

-- `sender_id` peut être mon profil client OU mon profil commerçant selon
-- le fil : `owns_profile` vérifie qu'il est bien à moi, puis l'`exists`
-- vérifie qu'il correspond au bon participant de CE fil précis — pas
-- seulement « un de mes profils », qui pourrait être mon AUTRE compte, pas
-- participant à ce fil. `blocked_by is null or blocked_by = sender_id` : si
-- personne n'a bloqué personne, les deux écrivent normalement ; sinon SEUL
-- le bloqueur garde le droit d'écrire — l'autre, visé par « elle ne pourra
-- plus vous écrire » sur l'écran 32, en est privé.
create policy "messages: envoi par les participants"
  on public.messages for insert
  with check (
    public.owns_profile(sender_id)
    and public.is_active_profile(sender_id)
    and exists (
      select 1 from public.conversations c
      where c.id = public.messages.conversation_id
        and (
          c.client_id = sender_id
          or exists (select 1 from public.merchants m where m.id = c.merchant_id and m.profile_id = sender_id)
        )
        and (c.blocked_by is null or c.blocked_by = sender_id)
    )
  );

-- Marquer comme lu : uniquement les messages reçus, jamais ceux qu'on a
-- envoyés soi-même (sous AUCUN de ses deux profils). La partie 4 a
-- restreint l'écriture à la seule colonne `read_at` : c'est cette
-- restriction, et non cette policy, qui empêche de réécrire le texte
-- d'autrui. Les deux mécanismes sont nécessaires.
create policy "messages: marquer comme lu"
  on public.messages for update
  using (
    not public.owns_profile(sender_id)
    and exists (
      select 1 from public.conversations c
      where c.id = public.messages.conversation_id
        and (c.client_id = public.my_profile_id('client') or c.merchant_id = public.my_merchant_id())
    )
  )
  with check (true);


-- 6.8 Signalements : on crée le sien, on relit le sien. Toi seul les
-- traites. `reporter_id` peut être mon profil client ou commerçant : les
-- deux peuvent signaler (un produit, une conversation, une boutique).
create policy "reports: je signale"
  on public.reports for insert
  with check (public.owns_profile(reporter_id) and public.is_active_profile(reporter_id));

create policy "reports: je relis mes signalements"
  on public.reports for select
  using (public.owns_profile(reporter_id));
