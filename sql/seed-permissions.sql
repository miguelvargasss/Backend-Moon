-- ═══════════════════════════════════════════════════════════════════
-- MoonPhases — Seed de Permisos y Asignación de Roles
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ═══════════════════════════════════════════════════════════════════

-- IDs de roles existentes
-- admin:     06e75273-0802-4cb8-b630-462be53098e2
-- comprador: 479584cc-1d0f-4497-9e6a-d3993442d47a

DO $$ 
DECLARE
  -- Módulos
  m_products CONSTANT text := 'products';
  m_categories CONSTANT text := 'categories';
  m_orders CONSTANT text := 'orders';
  m_coupons CONSTANT text := 'coupons';
  m_cart CONSTANT text := 'cart';
  m_users CONSTANT text := 'users';
  m_shipping CONSTANT text := 'shipping';
  m_pints_user CONSTANT text := 'pints_user';
  m_product_images CONSTANT text := 'product_images';

  -- Acciones
  a_create CONSTANT text := 'create';
  a_read CONSTANT text := 'read';
  a_update CONSTANT text := 'update';
  a_delete CONSTANT text := 'delete';
  a_list CONSTANT text := 'list';
  a_read_own CONSTANT text := 'read_own';
  a_read_all CONSTANT text := 'read_all';
  a_list_own CONSTANT text := 'list_own';
  a_list_all CONSTANT text := 'list_all';
  a_update_status CONSTANT text := 'update_status';
  a_cancel_own CONSTANT text := 'cancel_own';
  a_validate CONSTANT text := 'validate';
  a_add CONSTANT text := 'add';
  a_remove CONSTANT text := 'remove';
  a_clear CONSTANT text := 'clear';
  a_update_own CONSTANT text := 'update_own';
  a_update_all CONSTANT text := 'update_all';

  -- Roles IDs
  role_admin CONSTANT uuid := '06e75273-0802-4cb8-b630-462be53098e2'::uuid;
  role_buyer CONSTANT uuid := '479584cc-1d0f-4497-9e6a-d3993442d47a'::uuid;
BEGIN

  -- ══════════════════════════════════════════════════════════════
  -- PASO 1: Insertar todos los permisos (módulos + acciones)
  -- ══════════════════════════════════════════════════════════════
  INSERT INTO permits ("IdPermits", "moduleName", "actionName") VALUES
    (gen_random_uuid(), m_products, a_create),
    (gen_random_uuid(), m_products, a_read),
    (gen_random_uuid(), m_products, a_update),
    (gen_random_uuid(), m_products, a_delete),
    (gen_random_uuid(), m_products, a_list),

    (gen_random_uuid(), m_categories, a_create),
    (gen_random_uuid(), m_categories, a_read),
    (gen_random_uuid(), m_categories, a_update),
    (gen_random_uuid(), m_categories, a_delete),
    (gen_random_uuid(), m_categories, a_list),

    (gen_random_uuid(), m_orders, a_create),
    (gen_random_uuid(), m_orders, a_read_own),
    (gen_random_uuid(), m_orders, a_read_all),
    (gen_random_uuid(), m_orders, a_list_own),
    (gen_random_uuid(), m_orders, a_list_all),
    (gen_random_uuid(), m_orders, a_update_status),
    (gen_random_uuid(), m_orders, a_cancel_own),

    (gen_random_uuid(), m_coupons, a_create),
    (gen_random_uuid(), m_coupons, a_read),
    (gen_random_uuid(), m_coupons, a_update),
    (gen_random_uuid(), m_coupons, a_delete),
    (gen_random_uuid(), m_coupons, a_list),
    (gen_random_uuid(), m_coupons, a_validate),

    (gen_random_uuid(), m_cart, a_add),
    (gen_random_uuid(), m_cart, a_remove),
    (gen_random_uuid(), m_cart, a_read_own),
    (gen_random_uuid(), m_cart, a_clear),

    (gen_random_uuid(), m_users, a_read_own),
    (gen_random_uuid(), m_users, a_read_all),
    (gen_random_uuid(), m_users, a_update_own),
    (gen_random_uuid(), m_users, a_update_all),
    (gen_random_uuid(), m_users, a_delete),

    (gen_random_uuid(), m_shipping, a_create),
    (gen_random_uuid(), m_shipping, a_read_own),
    (gen_random_uuid(), m_shipping, a_read_all),
    (gen_random_uuid(), m_shipping, a_update),
    (gen_random_uuid(), m_shipping, a_delete),

    (gen_random_uuid(), m_pints_user, a_read_own),
    (gen_random_uuid(), m_pints_user, a_read_all),
    (gen_random_uuid(), m_pints_user, a_update),

    (gen_random_uuid(), m_product_images, a_create),
    (gen_random_uuid(), m_product_images, a_read),
    (gen_random_uuid(), m_product_images, a_delete)
  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════════════════════════════
  -- PASO 2: Asignar TODOS los permisos al rol ADMIN
  -- ══════════════════════════════════════════════════════════════
  INSERT INTO role_permits ("IdRolePermits", "IdPermits", "IdRole")
  SELECT
    gen_random_uuid(),
    p."IdPermits",
    role_admin
  FROM permits p
  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════════════════════════════
  -- PASO 3: Asignar permisos LIMITADOS al rol COMPRADOR
  -- ══════════════════════════════════════════════════════════════
  INSERT INTO role_permits ("IdRolePermits", "IdPermits", "IdRole")
  SELECT
    gen_random_uuid(),
    p."IdPermits",
    role_buyer
  FROM permits p
  WHERE
    ("moduleName" = m_products      AND "actionName" IN (a_read, a_list))
    OR ("moduleName" = m_categories  AND "actionName" IN (a_read, a_list))
    OR ("moduleName" = m_orders      AND "actionName" IN (a_create, a_read_own, a_list_own, a_cancel_own))
    OR ("moduleName" = m_coupons     AND "actionName" IN (a_validate))
    OR ("moduleName" = m_cart        AND "actionName" IN (a_add, a_remove, a_read_own, a_clear))
    OR ("moduleName" = m_users       AND "actionName" IN (a_read_own, a_update_own))
    OR ("moduleName" = m_shipping    AND "actionName" IN (a_create, a_read_own))
    OR ("moduleName" = m_pints_user  AND "actionName" IN (a_read_own))
    OR ("moduleName" = m_product_images AND "actionName" IN (a_read))
  ON CONFLICT DO NOTHING;

END $$;

-- ══════════════════════════════════════════════════════════════
-- VERIFICACIÓN: Contar permisos asignados por rol
-- ══════════════════════════════════════════════════════════════
SELECT
  r."nameRole",
  COUNT(rp."IdRolePermits") AS total_permisos
FROM role r
LEFT JOIN role_permits rp ON r."IdRole" = rp."IdRole"
GROUP BY r."nameRole"
ORDER BY r."nameRole" ASC;
