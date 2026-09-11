-- Jusqu'ici la ville n'existait que côté boutique (`merchants.city_id`) :
-- le client ne pouvait pas renseigner la sienne depuis « Mes informations »
-- (écran 18), alors que la maquette prévoyait ce champ (voir
-- docs/REPRISE.md, étape 4). Nullable : les clients déjà inscrits n'ont pas
-- encore de valeur, et ce n'est pas une information obligatoire pour
-- utiliser l'app.
alter table public.profiles
  add column city_id int references public.cities(id);

-- Même liste blanche que `full_name`/`phone` (0002_rules_and_security.sql,
-- partie 4) : un `grant` supplémentaire s'ajoute aux colonnes déjà
-- autorisées, il ne les remplace pas.
grant update (city_id)
  on public.profiles to authenticated;
