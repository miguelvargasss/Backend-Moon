-- Agregar soporte de variantes al carrito de compras
ALTER TABLE "shopping_cart"
  ADD COLUMN IF NOT EXISTS "IdVariant" UUID NULL REFERENCES "product_variant"("IdVariant") ON DELETE CASCADE;
