-- =====================================================================
-- Makiti — 0005 : la liste de catégories du lancement
-- =====================================================================
-- 0003 posait dix catégories « supermarché » (alimentation, maison,
-- bricolage…). Le positionnement retenu est plus étroit : téléphonie,
-- mode, beauté, pièces auto. Une liste qui promet des catégories vides
-- coûte cher — le client ouvre « Alimentation », ne trouve rien, et ne
-- revient pas. Mieux vaut huit catégories habitées que dix dont six
-- désertes.
--
-- UN SEUL NIVEAU, volontairement. Les sous-listes fournies (coques,
-- chargeurs, robes, jeans…) ne deviennent PAS des sous-catégories : elles
-- deviennent des EXEMPLES affichés sous le sélecteur, pour aider le
-- commerçant à choisir sans réfléchir. Un deuxième niveau coûterait une
-- table, un écran de navigation, un filtre supplémentaire et deux clics au
-- client, pour un catalogue qui n'a pas encore mille produits. On l'ajoutera
-- le jour où une catégorie deviendra illisible — pas avant.
--
-- Pas de catégorie « Autre » non plus : elle existait pour qu'aucun produit
-- ne soit impubliable. Sur une place de marché généraliste c'est prudent ;
-- sur une place de marché spécialisée c'est une fuite. « Autre » finit par
-- absorber tout ce qui sort du périmètre et le catalogue redevient un
-- fourre-tout. Conséquence assumée : un produit hors périmètre n'est pas
-- publiable. Surveille les demandes des commerçants : trois fois la même
-- demande = une catégorie à ajouter ici, pas un « Autre » à rouvrir.

-- Les exemples affichés à côté du sélecteur de catégorie. Colonne plutôt
-- que texte codé en dur dans le front : la liste vit avec les catégories,
-- au même endroit, et se corrige sans redéploiement.
alter table public.categories
  add column if not exists examples text;

insert into public.categories (slug, name, position, examples) values
  ('telephones',  'Téléphones',           1,
   'Toutes marques, neuf et occasion'),
  ('accessoires', 'Accessoires téléphone', 2,
   'Coques, vitres, chargeurs, câbles, écouteurs, power banks, supports, montres connectées, batteries, adaptateurs'),
  ('mode-femme',  'Vêtements femme',      3,
   'Robes, ensembles, jeans, pantalons, jupes, t-shirts, chemises, boubous, bazins'),
  ('mode-homme',  'Vêtements homme',      4,
   'T-shirts, chemises, jeans, pantalons, ensembles, costumes, boubous, bazins, maillots'),
  ('sacs',        'Sacs',                 5,
   'Sacs à main, sacs à dos, sacs de voyage, sacs professionnels, portefeuilles, femme et homme'),
  ('parfums',     'Parfums',              6,
   'Parfums homme, femme et mixtes, marques et inspirations, huiles et fragrances'),
  ('beaute',      'Produits de beauté',   7,
   'Visage, corps, cheveux, maquillage, soins, perruques, mèches, extensions, coiffure, onglerie'),
  ('pieces-auto', 'Pièces automobiles',   8,
   'Moteur, freinage, suspension, électricité, éclairage, filtres, batteries, pneus, accessoires — neuf et occasion')
on conflict (slug) do update
  set name     = excluded.name,
      position = excluded.position,
      examples = excluded.examples;

-- Retrait des catégories de 0003 sorties du périmètre. Le `not exists` est
-- la sécurité : `products.category_id` est une clé étrangère, supprimer une
-- catégorie encore utilisée ferait échouer toute la migration. On ne
-- supprime donc que les catégories vides.
-- (« beaute » n'est pas dans la liste : le slug est réutilisé ci-dessus,
-- les produits déjà classés dedans restent valides.)
delete from public.categories c
 where c.slug in ('alimentation', 'mode', 'electronique', 'maison',
                  'materiaux', 'enfants', 'sport', 'vehicules', 'autre')
   and not exists (
     select 1 from public.products p where p.category_id = c.id
   );

-- Celles qui restent portent encore des produits : on les renvoie en fin de
-- liste au lieu de les afficher entre « Téléphones » et « Sacs ». À toi de
-- reclasser ces produits à la main, puis de relancer cette migration : le
-- `delete` ci-dessus les emportera.
update public.categories
   set position = 90
 where slug in ('alimentation', 'mode', 'electronique', 'maison',
                'materiaux', 'enfants', 'sport', 'vehicules', 'autre');
