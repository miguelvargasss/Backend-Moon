-- ============================================================
-- MoonPhases — Seed: Roles, Estados de Orden, Cupón categoría
-- Fecha: 2026-04-17
-- ============================================================

-- Roles del sistema
INSERT INTO "role" ("nameRole", "statusRole")
VALUES ('admin', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO "role" ("nameRole", "statusRole")
VALUES ('comprador', 'active')
ON CONFLICT DO NOTHING;

-- Estados de orden (CU08)
INSERT INTO "status" ("nameStatus") VALUES ('EN PROCESO')    ON CONFLICT DO NOTHING;
INSERT INTO "status" ("nameStatus") VALUES ('CONFIRMADO')    ON CONFLICT DO NOTHING;
INSERT INTO "status" ("nameStatus") VALUES ('ENVIADO')       ON CONFLICT DO NOTHING;
INSERT INTO "status" ("nameStatus") VALUES ('FINALIZADO')    ON CONFLICT DO NOTHING;
INSERT INTO "status" ("nameStatus") VALUES ('CANCELADO')     ON CONFLICT DO NOTHING;

-- Estados de producto
INSERT INTO "statusProduct" ("nameStatusProduct") VALUES ('activo')   ON CONFLICT DO NOTHING;
INSERT INTO "statusProduct" ("nameStatusProduct") VALUES ('inactivo') ON CONFLICT DO NOTHING;

-- Agregar columna de categoría a cupones (CU05/CU06)
-- Permite restricción por categoría: si es NULL, el cupón aplica a todas
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS
  "IdCategorie" UUID REFERENCES "categorie"("IdCategorie") ON DELETE SET NULL;
