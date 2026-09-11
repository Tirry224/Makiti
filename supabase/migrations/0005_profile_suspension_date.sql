-- L'écran « compte suspendu » (écran 19) a besoin d'une date réelle à
-- afficher plutôt qu'un texte vague. Rempli à la main par l'équipe tant
-- qu'il n'y a pas d'écran d'administration (voir docs/REPRISE.md).
alter table public.profiles add column suspended_at timestamptz;
