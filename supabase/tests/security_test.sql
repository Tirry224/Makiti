-- =====================================================================
-- Makiti — tests de sécurité
-- =====================================================================
-- Ces tests simulent de vrais utilisateurs et vérifient qu'ils ne peuvent
-- PAS faire ce qui leur est interdit. Un test de sécurité qui ne vérifie
-- que les cas autorisés ne sert à rien : ce sont les refus qui comptent.
--
-- Exécution locale : voir supabase/tests/README.md
-- =====================================================================

\set ON_ERROR_STOP on
set client_min_messages = notice;

-- Un test doit pouvoir être relancé autant de fois qu'on veut sans
-- reconstruire la base. On repart donc systématiquement d'une table vide.
-- `cascade` suffit : la suppression se propage par les clés étrangères
-- jusqu'aux messages, ce qui prouve au passage que le chaînage est correct.
truncate auth.users cascade;

-- --- Jeu de données ---------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.gn', '{"role":"merchant","full_name":"Boutique A","phone":"620000001"}'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.gn', '{"role":"merchant","full_name":"Boutique B","phone":"620000002"}'),
  ('33333333-3333-3333-3333-333333333333', 'c@test.gn', '{"role":"client","full_name":"Client C","phone":"620000003"}'),
  ('44444444-4444-4444-4444-444444444444', 'd@test.gn', '{"role":"client","full_name":"Client D","phone":"620000004"}');

insert into public.merchants (id, profile_id, shop_name, city_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Chez A', 1),
  ('bbbbbbbb-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Chez B', 1);

-- Helper de test : signale un échec bruyamment.
create or replace function pg_temp.check(label text, condition boolean) returns void
language plpgsql as $$
begin
  if condition then raise notice 'OK    %', label;
  else raise exception 'ECHEC %', label;
  end if;
end $$;

create or replace function pg_temp.login(uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', uid::text, false);
end $$;


-- =====================================================================
-- 1. Le trigger d'inscription a bien créé les profils
-- =====================================================================
select pg_temp.check('profils créés à l''inscription',
  (select count(*) from public.profiles) = 4);

select pg_temp.check('le rôle envoyé à l''inscription est respecté',
  (select role from public.profiles where id = '33333333-3333-3333-3333-333333333333') = 'client');


-- =====================================================================
-- 2. Un commerçant NON validé ne peut pas publier
-- =====================================================================
set role authenticated;
select pg_temp.login('11111111-1111-1111-1111-111111111111');

-- Un brouillon, en revanche, doit être possible (point 12 de la spec).
insert into public.products (id, merchant_id, category_id, title, price_gnf, status)
values ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 1, 'Sac de riz importé 50kg', 450000, 'draft');

do $$
begin
  update public.products set status = 'active'
   where id = 'cccccccc-0000-0000-0000-000000000001';
  raise exception 'ECHEC un commerçant en attente a pu publier';
exception when others then
  if sqlerrm like 'ECHEC%' then raise; end if;
  raise notice 'OK    publication refusée tant que la boutique n''est pas validée';
end $$;

reset role;


-- =====================================================================
-- 3. Un commerçant ne peut pas s'auto-valider
-- =====================================================================
set role authenticated;
select pg_temp.login('11111111-1111-1111-1111-111111111111');

do $$
begin
  update public.merchants set status = 'approved'
   where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  raise exception 'ECHEC un commerçant a pu s''auto-valider';
exception when insufficient_privilege then
  raise notice 'OK    auto-validation refusée (colonne protégée)';
end $$;

reset role;

-- L'administrateur, lui, valide sans difficulté.
update public.merchants set status = 'approved', approved_at = now()
 where id in ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002');


-- =====================================================================
-- 4. Pas de publication sans photo
-- =====================================================================
set role authenticated;
select pg_temp.login('11111111-1111-1111-1111-111111111111');

do $$
begin
  update public.products set status = 'active'
   where id = 'cccccccc-0000-0000-0000-000000000001';
  raise exception 'ECHEC publication acceptée sans photo';
exception when others then
  if sqlerrm like 'ECHEC%' then raise; end if;
  raise notice 'OK    publication refusée sans photo';
end $$;

insert into public.product_images (product_id, storage_path, position)
values ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001/p1/0.webp', 0);

update public.products set status = 'active'
 where id = 'cccccccc-0000-0000-0000-000000000001';
select pg_temp.check('publication acceptée avec photo et boutique validée',
  (select status from public.products where id = 'cccccccc-0000-0000-0000-000000000001') = 'active');


-- =====================================================================
-- 5. Maximum 3 photos, garanti par la structure
-- =====================================================================
insert into public.product_images (product_id, storage_path, position) values
  ('cccccccc-0000-0000-0000-000000000001', 'x/1.webp', 1),
  ('cccccccc-0000-0000-0000-000000000001', 'x/2.webp', 2);

do $$
begin
  insert into public.product_images (product_id, storage_path, position)
  values ('cccccccc-0000-0000-0000-000000000001', 'x/3.webp', 3);
  raise exception 'ECHEC une 4e photo a été acceptée';
exception when check_violation then
  raise notice 'OK    4e photo refusée par la contrainte';
end $$;

reset role;


-- =====================================================================
-- 6. Un commerçant ne peut pas toucher aux produits d'un autre
-- =====================================================================
set role authenticated;
select pg_temp.login('22222222-2222-2222-2222-222222222222');   -- Boutique B

-- Le produit reste VISIBLE (catalogue public)…
select pg_temp.check('le produit d''autrui est visible dans le catalogue',
  (select count(*) from public.products
    where id = 'cccccccc-0000-0000-0000-000000000001') = 1);

-- … mais pas modifiable. Le RLS ne lève pas d'erreur : il fait simplement
-- que la ligne n'existe pas pour cet utilisateur. Zéro ligne modifiée.
with modif as (
  update public.products set title = 'Piraté' 
   where id = 'cccccccc-0000-0000-0000-000000000001' returning 1
)
select pg_temp.check('modification du produit d''autrui bloquée',
  (select count(*) from modif) = 0);

reset role;


-- =====================================================================
-- 7. Le cœur du sujet : l'étanchéité des conversations privées
-- =====================================================================
set role authenticated;
select pg_temp.login('33333333-3333-3333-3333-333333333333');   -- Client C

insert into public.conversations (id, product_id, client_id, merchant_id)
values ('dddddddd-0000-0000-0000-000000000001',
        'cccccccc-0000-0000-0000-000000000001',
        '33333333-3333-3333-3333-333333333333',
        'aaaaaaaa-0000-0000-0000-000000000001');

insert into public.messages (conversation_id, sender_id, body)
values ('dddddddd-0000-0000-0000-000000000001',
        '33333333-3333-3333-3333-333333333333',
        'Bonjour, le sac de riz est-il disponible ?');

select pg_temp.check('le client voit sa conversation',
  (select count(*) from public.conversations) = 1);

reset role;
set role authenticated;
select pg_temp.login('11111111-1111-1111-1111-111111111111');   -- Commerçant A
select pg_temp.check('le commerçant destinataire voit la conversation',
  (select count(*) from public.messages) = 1);

reset role;
set role authenticated;
select pg_temp.login('44444444-4444-4444-4444-444444444444');   -- Client D, étranger
select pg_temp.check('un tiers ne voit AUCUNE conversation',
  (select count(*) from public.conversations) = 0);
select pg_temp.check('un tiers ne voit AUCUN message',
  (select count(*) from public.messages) = 0);

reset role;
set role authenticated;
select pg_temp.login('22222222-2222-2222-2222-222222222222');   -- Commerçant concurrent
select pg_temp.check('un commerçant concurrent ne voit AUCUN message',
  (select count(*) from public.messages) = 0);

reset role;


-- =====================================================================
-- 8. Un commerçant ne peut pas ouvrir de conversation (rôle unique)
-- =====================================================================
set role authenticated;
select pg_temp.login('22222222-2222-2222-2222-222222222222');

do $$
begin
  insert into public.conversations (product_id, client_id, merchant_id)
  values ('cccccccc-0000-0000-0000-000000000001',
          '22222222-2222-2222-2222-222222222222',
          'aaaaaaaa-0000-0000-0000-000000000001');
  raise exception 'ECHEC un commerçant a pu ouvrir une conversation';
exception when insufficient_privilege then
  raise notice 'OK    ouverture de conversation refusée à un commerçant';
end $$;

reset role;


-- =====================================================================
-- 9. Un utilisateur suspendu ne peut plus écrire
-- =====================================================================
update public.profiles set is_suspended = true
 where id = '33333333-3333-3333-3333-333333333333';

set role authenticated;
select pg_temp.login('33333333-3333-3333-3333-333333333333');

do $$
begin
  insert into public.messages (conversation_id, sender_id, body)
  values ('dddddddd-0000-0000-0000-000000000001',
          '33333333-3333-3333-3333-333333333333', 'Encore moi');
  raise exception 'ECHEC un utilisateur suspendu a pu écrire';
exception when insufficient_privilege then
  raise notice 'OK    écriture refusée à un compte suspendu';
end $$;

reset role;
update public.profiles set is_suspended = false
 where id = '33333333-3333-3333-3333-333333333333';


-- =====================================================================
-- 10. Le compteur de contacts et la limite anti-spam
-- =====================================================================
select pg_temp.check('compteur de contacts incrémenté',
  (select contact_count from public.products
    where id = 'cccccccc-0000-0000-0000-000000000001') = 1);

-- La limite se teste en administrateur : les triggers s'appliquent même
-- quand le RLS est contourné.
insert into public.products (id, merchant_id, category_id, title, price_gnf, status)
select gen_random_uuid(), 'aaaaaaaa-0000-0000-0000-000000000001', 1, 'Produit ' || i, 1000, 'draft'
  from generate_series(1, 25) i;

do $$
declare p record; n int := 0;
begin
  for p in select id from public.products where status = 'draft' loop
    begin
      insert into public.conversations (product_id, client_id, merchant_id)
      values (p.id, '44444444-4444-4444-4444-444444444444',
              'aaaaaaaa-0000-0000-0000-000000000001');
      n := n + 1;
    exception when others then
      raise notice 'OK    limite anti-spam déclenchée après % conversations', n;
      return;
    end;
  end loop;
  raise exception 'ECHEC la limite anti-spam ne s''est jamais déclenchée (% insertions)', n;
end $$;


-- =====================================================================
-- 11. La recherche est insensible aux accents et à la casse
-- =====================================================================
-- Le titre contient « importé ». On le cherche sans accent ET en
-- majuscules : c'est exactement ce que tapera un client sur un clavier
-- de téléphone.
select pg_temp.check('recherche sans accent trouve le produit accentué',
  (select count(*) from public.search_products('IMPORTE')) = 1);

select pg_temp.check('recherche avec accent trouve aussi',
  (select count(*) from public.search_products('importé')) = 1);

select pg_temp.check('recherche par nom de boutique',
  (select count(*) from public.search_products('chez a')) = 1);

select pg_temp.check('filtre par ville sans résultat hors zone',
  (select count(*) from public.search_products(null, 4)) = 0);

select pg_temp.check('les brouillons n''apparaissent jamais dans la recherche',
  (select count(*) from public.search_products()) = 1);

\echo ''
\echo '===== TOUS LES TESTS SONT PASSES ====='
