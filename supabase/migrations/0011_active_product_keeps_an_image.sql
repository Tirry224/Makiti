-- =====================================================================
-- 0011 — Un produit publié garde au moins une photo
-- =====================================================================
-- `products_check_publishable` (0002, partie 3.2) refuse `status =
-- 'active'` tant qu'aucune ligne `product_images` ne référence le produit.
-- Mais ce trigger est posé sur `products` : il ne voit QUE les écritures
-- sur cette table. Rien ne se déclenche quand les photos partent de
-- l'autre côté, par `product_images`.
--
-- La faille n'est pas théorique, elle est sur le chemin que le code
-- emprunte réellement. `updateProductAction`
-- (src/lib/actions/products.ts) remplace la liste des photos en deux
-- temps — `delete` de toutes les lignes, puis `insert` de la liste
-- finale — parce que `unique (product_id, position)` rend fragile toute
-- comparaison photo par photo. Si la liste finale arrive vide (JavaScript
-- absent, `PhotoPicker` qui n'a pas chargé, commerçant qui retire ses
-- photos avant d'enregistrer), le produit reste `active` dans le
-- catalogue public **sans aucune photo**. Vérifié en base, pas déduit :
--
--   produit actif avec 1 photo → delete from product_images
--   → photos restantes = 0, statut = active
--
-- Sur une marketplace, une vignette vide est pire qu'une absence
-- d'annonce : elle occupe une place dans le fil sans rien montrer.
--
-- La règle est donc remise là où elle ne peut pas être contournée par un
-- nouveau chemin d'écriture. Le code applicatif reçoit la même
-- vérification en parallèle (pour pouvoir AFFICHER une erreur plutôt que
-- subir un dépublication silencieuse), mais c'est celle-ci qui garantit
-- l'invariant.
--
-- Choix de conception : repasser en `draft`, jamais refuser la
-- suppression. Un `raise exception` ici bloquerait
-- `updateProductAction` au milieu de son remplacement de photos — la
-- suppression est légitime, c'est l'état « publié sans photo » qui ne
-- l'est pas. Le produit redevient donc un brouillon, que son commerçant
-- retrouve dans « Mes produits » et republie une fois une photo ajoutée.

create or replace function public.unpublish_products_without_image()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- `deleted` est la table de transition du trigger : toutes les lignes
  -- supprimées par CETTE instruction, d'un coup. Un trigger `for each
  -- row` referait le même calcul une fois par photo retirée, pour un
  -- résultat qui ne peut de toute façon changer qu'au dernier passage.
  update public.products p
     set status = 'draft'
   where p.id in (select distinct d.product_id from deleted d)
     and p.status = 'active'
     and not exists (
       select 1 from public.product_images pi where pi.product_id = p.id
     );

  return null;
end;
$$;

-- `after delete`, jamais `before` : la décision dépend du nombre de
-- photos APRÈS la suppression.
--
-- Cas à connaître : supprimer un produit efface ses photos en cascade
-- (`product_images.product_id references products on delete cascade`,
-- 0001), donc ce trigger se déclenche aussi à ce moment-là. L'`update`
-- passe alors sur une ligne `products` en cours de suppression dans la
-- même transaction — sans effet visible, la ligne disparaît juste après.
-- Inutile de s'en protéger par un test supplémentaire : ce serait du code
-- à maintenir pour un `update` qui ne coûte rien.
drop trigger if exists product_images_keep_active_publishable on public.product_images;

create trigger product_images_keep_active_publishable
  after delete on public.product_images
  referencing old table as deleted
  for each statement execute function public.unpublish_products_without_image();
