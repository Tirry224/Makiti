drop policy "products: catalogue public" on public.products;
create policy "products: catalogue public"
  on public.products for select
  using (
    (status in ('active', 'sold') and exists (
      select 1 from public.merchants m
      where m.id = public.products.merchant_id and m.status = 'approved'
    ))
    or merchant_id = public.my_merchant_id()
  );

drop policy "product_images: visibles avec le produit" on public.product_images;
create policy "product_images: visibles avec le produit"
  on public.product_images for select
  using (
    exists (
      select 1 from public.products p
      where p.id = public.product_images.product_id
        and (
          (p.status in ('active', 'sold') and exists (
             select 1 from public.merchants m
             where m.id = p.merchant_id and m.status = 'approved'))
          or p.merchant_id = public.my_merchant_id()
        )
    )
  );
