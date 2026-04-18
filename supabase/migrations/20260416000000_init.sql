-- ============================================================
-- MoonPhases — Migración inicial del esquema de base de datos
-- Fecha: 2026-04-16
-- Motor: PostgreSQL (Supabase)
-- Nota: La tabla "user" referencia auth.users de Supabase Auth
--       Los IDs son UUID generados automáticamente
--       RLS habilitado en todas las tablas (políticas por definir)
-- ============================================================

-- ============================================================
-- TABLAS INDEPENDIENTES (sin claves foráneas)
-- ============================================================

-- Roles de usuarios (admin, cliente, vendedor, etc.)
CREATE TABLE IF NOT EXISTS "role" (
  "IdRole"      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nameRole"    TEXT NOT NULL,
  "statusRole"  TEXT NOT NULL
);

-- Permisos disponibles en el sistema (moduleName: 'products', actionName: 'create')
CREATE TABLE IF NOT EXISTS "permits" (
  "IdPermits"   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "moduleName"  TEXT NOT NULL,
  "actionName"  TEXT NOT NULL
);

-- Estados de orden (pendiente, procesando, enviado, entregado, etc.)
CREATE TABLE IF NOT EXISTS "status" (
  "IdStatus"    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nameStatus"  TEXT NOT NULL
);

-- Cupones de descuento
CREATE TABLE IF NOT EXISTS "coupons" (
  "IdCoupons"       UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  "Code"            TEXT    NOT NULL UNIQUE,
  "ExpirationDate"  DATE    NOT NULL,
  "CouponQuantity"  INTEGER NOT NULL DEFAULT 0,
  "MinimumAmount"   NUMERIC(10, 2) NOT NULL DEFAULT 0,
  "DiscountAmount"  NUMERIC(10, 2) NOT NULL DEFAULT 0
);

-- Categorías de productos
CREATE TABLE IF NOT EXISTS "categorie" (
  "IdCategorie"   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "NameCategori"  TEXT NOT NULL
);

-- Estados de los productos (activo, inactivo, agotado, etc.)
CREATE TABLE IF NOT EXISTS "statusProduct" (
  "IdStatusProduct"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nameStatusProduct"   TEXT NOT NULL
);

-- ============================================================
-- TABLAS CON DEPENDENCIAS DE 1er NIVEL
-- ============================================================

-- Relación N:M entre roles y permisos
CREATE TABLE IF NOT EXISTS "role_permits" (
  "IdRolePermits" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "IdPermits"     UUID NOT NULL REFERENCES "permits"("IdPermits") ON DELETE CASCADE,
  "IdRole"        UUID NOT NULL REFERENCES "role"("IdRole") ON DELETE CASCADE
);

-- Perfil de usuario — extiende auth.users de Supabase Auth
-- IdUser referencia auth.users(id): cuando un usuario se registra
-- via Supabase Auth, el trigger handle_new_user() crea su perfil aquí
CREATE TABLE IF NOT EXISTS "user" (
  "IdUser"    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "Name"      TEXT NOT NULL DEFAULT '',
  "LastName"  TEXT NOT NULL DEFAULT '',
  "email"     TEXT NOT NULL UNIQUE,
  "password"  TEXT,           -- gestionado por Supabase Auth, campo referencial
  "IdRole"    UUID REFERENCES "role"("IdRole") ON DELETE SET NULL
);

-- Productos del catálogo de la tienda
CREATE TABLE IF NOT EXISTS "product" (
  "IdProduct"       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "NameProduct"     TEXT          NOT NULL,
  "QuantityProduct" INTEGER       NOT NULL DEFAULT 0,
  "Color"           TEXT,
  "Size"            TEXT,
  "Price"           NUMERIC(10,2) NOT NULL DEFAULT 0,
  "Specification"   TEXT,
  "IdCategorie"     UUID REFERENCES "categorie"("IdCategorie") ON DELETE SET NULL,
  "IdStatusProduct" UUID REFERENCES "statusProduct"("IdStatusProduct") ON DELETE SET NULL
);

-- ============================================================
-- TABLAS CON DEPENDENCIAS DE 2do NIVEL
-- ============================================================

-- Puntos/fidelización del usuario
CREATE TABLE IF NOT EXISTS "pints_user" (
  "IdPointsUser"  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  "points"        INTEGER NOT NULL DEFAULT 0,
  "IdUser"        UUID    NOT NULL REFERENCES "user"("IdUser") ON DELETE CASCADE
);

-- Direcciones de envío del usuario
CREATE TABLE IF NOT EXISTS "shipping_address" (
  "IdShippingAddress" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "FirstName"         TEXT NOT NULL,
  "LastName"          TEXT NOT NULL,
  "Address"           TEXT NOT NULL,
  "Reference"         TEXT,
  "City"              TEXT NOT NULL,
  "Region"            TEXT NOT NULL,
  "CodeZip"           TEXT,
  "Phone"             TEXT NOT NULL,
  "DNI"               TEXT,
  "IdUser"            UUID NOT NULL REFERENCES "user"("IdUser") ON DELETE CASCADE
);

-- Imágenes de los productos (almacenadas en Supabase Storage bucket: product-images)
CREATE TABLE IF NOT EXISTS "product_image" (
  "IdProductImage"  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "url"             TEXT NOT NULL,   -- URL pública del archivo en Supabase Storage
  "IdProduct"       UUID NOT NULL REFERENCES "product"("IdProduct") ON DELETE CASCADE
);

-- ============================================================
-- TABLAS CON DEPENDENCIAS DE 3er NIVEL
-- ============================================================

-- Órdenes de compra
-- Nota: "order" es palabra reservada en PostgreSQL — se usa con comillas
CREATE TABLE IF NOT EXISTS "order" (
  "IdOrder"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "OrderCode"         TEXT NOT NULL UNIQUE,
  "Date"              DATE NOT NULL DEFAULT CURRENT_DATE,
  "Time"              TIME NOT NULL DEFAULT CURRENT_TIME,
  "IdUser"            UUID NOT NULL  REFERENCES "user"("IdUser") ON DELETE RESTRICT,
  "IdShippingAddress" UUID           REFERENCES "shipping_address"("IdShippingAddress") ON DELETE SET NULL,
  "IdStatus"          UUID           REFERENCES "status"("IdStatus") ON DELETE SET NULL,
  "IdCoupons"         UUID           REFERENCES "coupons"("IdCoupons") ON DELETE SET NULL
);

-- Carrito de compras del usuario
CREATE TABLE IF NOT EXISTS "shopping_cart" (
  "IdShoppingCart"  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  "Quantity"        INTEGER NOT NULL DEFAULT 1,
  "IdUser"          UUID    NOT NULL REFERENCES "user"("IdUser") ON DELETE CASCADE,
  "IdProduct"       UUID    NOT NULL REFERENCES "product"("IdProduct") ON DELETE CASCADE
);

-- ============================================================
-- TABLAS CON DEPENDENCIAS DE 4to NIVEL
-- ============================================================

-- Historial de estados de una orden
CREATE TABLE IF NOT EXISTS "order_history" (
  "IdOrderHistory"  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "IdOrder"         UUID NOT NULL REFERENCES "order"("IdOrder") ON DELETE CASCADE
);

-- Ítems/líneas de una orden
CREATE TABLE IF NOT EXISTS "order_item" (
  "IdOrderItem" UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "PriceAtSale" NUMERIC(10,2) NOT NULL,    -- precio al momento de la compra
  "Quantity"    INTEGER       NOT NULL DEFAULT 1,
  "IdOrder"     UUID          NOT NULL REFERENCES "order"("IdOrder") ON DELETE CASCADE,
  "IdProduct"   UUID          NOT NULL REFERENCES "product"("IdProduct") ON DELETE RESTRICT
);

-- ============================================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- Las políticas quedaron habilitadas pero sin reglas:
-- por defecto todo acceso es denegado para el cliente anon.
-- El adminClient (service_role) del backend bypassa RLS.
-- Define las políticas según tu lógica de negocio.
-- ============================================================

ALTER TABLE "role"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "permits"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "status"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "coupons"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categorie"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "statusProduct"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "role_permits"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pints_user"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shipping_address" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_image"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_history"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_item"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shopping_cart"    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FUNCIÓN + TRIGGER: Auto-crear perfil al registrar usuario
-- Cuando Supabase Auth crea un usuario nuevo en auth.users,
-- este trigger crea automáticamente su fila en public."user"
-- Los metadatos Name y LastName se pasan en signUp options.data
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public."user" ("IdUser", "Name", "LastName", "email")
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'Name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'LastName', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger que se ejecuta después de cada INSERT en auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
