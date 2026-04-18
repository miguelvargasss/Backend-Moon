-- ============================================================
-- MoonPhases — Fix: Función decrement_coupon_quantity + UNIQUE constraints
-- Fecha: 2026-04-18
-- ============================================================

-- Función RPC para decrementar la cantidad de un cupón de forma atómica
-- Evita race conditions al usar UPDATE directo con expresión
CREATE OR REPLACE FUNCTION decrement_coupon_quantity(coupon_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE "coupons"
  SET "CouponQuantity" = "CouponQuantity" - 1
  WHERE "IdCoupons" = coupon_id
    AND "CouponQuantity" > 0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cupón no encontrado o sin stock';
  END IF;
END;
$$;

-- UNIQUE constraints para evitar duplicados en tablas de configuración
-- Esto permite que ON CONFLICT DO NOTHING funcione correctamente en seeds
ALTER TABLE "role" ADD CONSTRAINT role_name_unique
  UNIQUE ("nameRole") ;

ALTER TABLE "status" ADD CONSTRAINT status_name_unique
  UNIQUE ("nameStatus") ;

ALTER TABLE "statusProduct" ADD CONSTRAINT status_product_name_unique
  UNIQUE ("nameStatusProduct") ;
