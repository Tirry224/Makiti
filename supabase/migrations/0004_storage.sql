-- =====================================================================
-- Makiti — 0004 : stockage des photos
-- =====================================================================
-- Les images ne vont pas dans la base de données : on y stocke seulement
-- leur CHEMIN. Mettre des fichiers binaires dans PostgreSQL alourdit les
-- sauvegardes et coûte cher à servir. Les fichiers vont dans Supabase
-- Storage, qui est un stockage d'objets avec son propre RLS.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Bucket public en LECTURE : les photos des produits doivent être visibles
-- par les visiteurs non connectés, puisque le catalogue est ouvert.
create policy "photos: lecture publique"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- En ÉCRITURE, tout est verrouillé. Convention de nommage imposée :
--     product-images/{merchant_id}/{product_id}/{fichier}
-- La règle compare le premier dossier du chemin à l'identifiant de la
-- boutique de l'utilisateur. Conséquence : un commerçant ne peut écrire que
-- dans son propre dossier, et ne peut ni écraser ni supprimer les photos
-- d'un autre. Sans cette règle, n'importe quel utilisateur connecté pourrait
-- remplacer les photos de tous les produits du site.
create policy "photos: envoi dans mon dossier"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = public.my_merchant_id()::text
  );

create policy "photos: remplacement dans mon dossier"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = public.my_merchant_id()::text
  );

create policy "photos: suppression dans mon dossier"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = public.my_merchant_id()::text
  );
