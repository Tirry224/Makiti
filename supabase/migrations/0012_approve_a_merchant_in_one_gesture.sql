-- =====================================================================
-- 0012 — Approuver ou refuser une boutique en UN seul geste
-- =====================================================================
-- Demande initiale : « une colonne sur la table des commerçants qui
-- permet d'approuver ou désapprouver un compte ».
--
-- Cette colonne existe déjà : `merchants.status`
-- (`pending` / `approved` / `rejected`, 0001_schema.sql). En ajouter une
-- seconde — un booléen `is_approved`, par exemple — serait un vrai piège :
-- `status = 'approved'` est lu à NEUF endroits (policy « products :
-- catalogue public », trigger `products_check_publishable`, fonction
-- `search_products`, policy de visibilité de la boutique, policies de la
-- messagerie…), et la colonne neuve serait lue à zéro. On la cocherait,
-- et RIEN ne changerait dans l'application. Deux colonnes qui prétendent
-- dire la même vérité, c'est une source de vérité de moins, pas une de
-- plus.
--
-- Le vrai manque était ailleurs : changer `status` ne SUFFISAIT pas.
-- Trois oublis possibles, aucun signalé :
--
--   1. `approved_at` n'était rempli par aucun trigger. Valider en
--      changeant une seule cellule laissait la date NULL — une
--      information gratuite à capturer sur le moment, impossible à
--      reconstituer après.
--   2. Un refus sans motif était accepté. C'est le trou documenté depuis
--      le 2026-09-11 (docs/REPRISE.md, section 4, point 2) : la colonne
--      `rejection_reason` avait justement été créée pour qu'un refus
--      s'explique, et rien n'obligeait à la remplir. Un vendeur refusé
--      sans motif ne sait pas quoi corriger : c'est un vendeur perdu.
--   3. Un motif de refus SURVIVAIT à une validation. Une boutique
--      refusée puis approuvée gardait son ancien motif en base, prêt à
--      réapparaître sur `/vendeur/refusee` au prochain refus.
--
-- Après cette migration, changer la seule cellule `status` fait le reste.
-- C'est bien « une colonne pour approuver ou refuser » — celle qui était
-- déjà là.


-- --- 1. Un refus s'explique, toujours ---------------------------------
-- Posé en contrainte plutôt qu'en trigger : une CHECK est vérifiée APRÈS
-- les triggers `before`, donc aucun trigger ne peut la contourner en
-- inventant un motif par défaut. Un refus sans explication doit échouer
-- bruyamment, pas être rattrapé en silence.
alter table public.merchants
  add constraint merchants_rejection_needs_reason
  check (status <> 'rejected' or rejection_reason is not null);


-- --- 2. Les colonnes qui accompagnent le statut se remplissent seules --
create or replace function public.touch_merchant_approval()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Date de validation posée à la TRANSITION vers `approved`, pas à
  -- chaque écriture : sans le test sur l'ancien statut, une simple
  -- correction de nom sur une boutique déjà validée repousserait sa date
  -- de validation à aujourd'hui.
  if new.status = 'approved' and coalesce(old.status, 'pending') <> 'approved' then
    new.approved_at := now();
  end if;

  -- En sortant de `rejected`, le motif part avec. Il décrivait un refus
  -- qui n'a plus cours ; le garder, c'est risquer de le réafficher au
  -- prochain refus comme s'il venait d'être écrit.
  if new.status <> 'rejected' and old.status = 'rejected' then
    new.rejection_reason := null;
  end if;

  -- `approved_at` n'est JAMAIS effacé quand une boutique quitte
  -- `approved` : « cette boutique a été validée le 12 septembre » reste
  -- vrai même après un refus. Une date d'événement passé n'est pas un
  -- état courant.
  return new;
end;
$$;

create trigger merchants_touch_approval
  before insert or update of status on public.merchants
  for each row execute function public.touch_merchant_approval();


-- --- 3. Deux verbes, pour ne pas retenir la syntaxe -------------------
-- Le Table Editor suffit désormais (une cellule). Ces deux fonctions sont
-- là pour l'éditeur SQL, quand on veut nommer ce qu'on fait.
--
-- `security invoker` — le défaut, écrit ici pour que ce soit un CHOIX
-- visible et non un oubli. En `security definer`, ces fonctions
-- deviendraient appelables en RPC (`/rest/v1/rpc/approve_merchant`) par
-- n'importe quel visiteur, et rouvriraient EXACTEMENT la faille que les
-- tests de sécurité avaient trouvée : un commerçant qui s'auto-valide.
-- En `invoker`, l'appelant reste lui-même, et la liste blanche de
-- colonnes de 0002 (`revoke update on merchants`, `status` non
-- ré-accordé) le bloque. Le `revoke execute` plus bas est la seconde
-- barrière : deux verrous indépendants, parce qu'un seul se retire par
-- accident.
create or replace function public.approve_merchant(p_shop_name text)
returns public.merchants
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row public.merchants;
begin
  update public.merchants
     set status = 'approved'
   where shop_name = p_shop_name
  returning * into v_row;

  -- `shop_name` n'est pas unique en base : refuser explicitement plutôt
  -- que de valider silencieusement la mauvaise boutique, ou deux.
  if not found then
    raise exception 'Aucune boutique ne porte le nom « % ».', p_shop_name;
  end if;
  return v_row;
end;
$$;

create or replace function public.reject_merchant(p_shop_name text, p_reason text)
returns public.merchants
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row public.merchants;
begin
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'Un refus doit dire pourquoi : indiquez ce que le commerçant doit corriger.';
  end if;

  update public.merchants
     set status = 'rejected', rejection_reason = btrim(p_reason)
   where shop_name = p_shop_name
  returning * into v_row;

  if not found then
    raise exception 'Aucune boutique ne porte le nom « % ».', p_shop_name;
  end if;
  return v_row;
end;
$$;

-- Supabase accorde `execute` à `public` par défaut sur toute fonction
-- nouvelle : sans ces deux lignes, l'API REST les exposerait aux
-- visiteurs. Elles n'aboutiraient pas (voir le raisonnement ci-dessus),
-- mais une porte fermée vaut mieux qu'une porte ouverte sur un mur.
revoke execute on function public.approve_merchant(text)     from anon, authenticated, public;
revoke execute on function public.reject_merchant(text, text) from anon, authenticated, public;
