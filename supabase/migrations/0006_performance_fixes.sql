-- =====================================================================
-- Makiti — 0006 : corrections de performance suite aux advisors
-- =====================================================================
-- Deux catégories d'avertissement ignorées volontairement, pas oubliées :
--   - « unused index » : base neuve, zéro historique de requêtes. Rien à
--     tirer d'une statistique mesurée sur une base vide.
--   - « multiple permissive policies » (products, product_images,
--     profiles) : deux policies nommées séparément par cas d'usage réel
--     (catalogue public vs gestion de ses propres produits) plutôt qu'une
--     seule policy combinée par OR. Même choix que search_products en
--     0003 : la lisibilité d'abord, on optimise quand une mesure le
--     justifie, pas avant — à cette échelle l'écart est invisible.

-- Trois clés étrangères sans index couvrant, au même titre que client_id
-- et merchant_id déjà indexés en 0001.
create index messages_sender_idx      on public.messages(sender_id);
create index reports_reporter_idx     on public.reports(reporter_id);
create index conversations_blocked_by_idx on public.conversations(blocked_by) where blocked_by is not null;

-- `auth.uid()` appelé littéralement dans une policy est réévalué à CHAQUE
-- ligne ; l'envelopper dans `(select auth.uid())` permet à Postgres de ne
-- l'évaluer qu'une fois par requête (InitPlan). Les policies qui passent
-- par my_profile_id()/owns_profile() n'ont pas ce problème : auth.uid() y
-- est déjà à l'intérieur d'une fonction stable.
drop policy "profiles: je vois mes profils" on public.profiles;
create policy "profiles: je vois mes profils"
  on public.profiles for select
  using (auth_user_id = (select auth.uid()));

drop policy "profiles: je modifie mon profil" on public.profiles;
create policy "profiles: je modifie mon profil"
  on public.profiles for update
  using (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));

drop policy "profiles: je cree mon second compte" on public.profiles;
create policy "profiles: je cree mon second compte"
  on public.profiles for insert
  with check (auth_user_id = (select auth.uid()));
