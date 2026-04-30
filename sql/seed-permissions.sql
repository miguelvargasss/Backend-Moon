-- ═══════════════════════════════════════════════════════════════════
-- MoonPhases — Seed de Permisos y Asignación de Roles
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ═══════════════════════════════════════════════════════════════════

-- IDs de roles existentes
-- admin:     06e75273-0802-4cb8-b630-462be53098e2
-- comprador: 479584cc-1d0f-4497-9e6a-d3993442d47a

-- ══════════════════════════════════════════════════════════════
-- PASO 1: Insertar todos los permisos (módulos + acciones)
-- ══════════════════════════════════════════════════════════════

INSERT INTO permits ("IdPermits", "moduleName", "actionName") VALUES

  -- ── Módulo: products ──────────────────────────────────────
  (gen_random_uuid(), 'products', 'create'),
  (gen_random_uuid(), 'products', 'read'),
  (gen_random_uuid(), 'products', 'update'),
  (gen_random_uuid(), 'products', 'delete'),
  (gen_random_uuid(), 'products', 'list'),

  -- ── Módulo: categories ────────────────────────────────────
  (gen_random_uuid(), 'categories', 'create'),
  (gen_random_uuid(), 'categories', 'read'),
  (gen_random_uuid(), 'categories', 'update'),
  (gen_random_uuid(), 'categories', 'delete'),
  (gen_random_uuid(), 'categories', 'list'),

  -- ── Módulo: orders ────────────────────────────────────────
  (gen_random_uuid(), 'orders', 'create'),
  (gen_random_uuid(), 'orders', 'read_own'),
  (gen_random_uuid(), 'orders', 'read_all'),
  (gen_random_uuid(), 'orders', 'list_own'),
  (gen_random_uuid(), 'orders', 'list_all'),
  (gen_random_uuid(), 'orders', 'update_status'),
  (gen_random_uuid(), 'orders', 'cancel_own'),

  -- ── Módulo: coupons ───────────────────────────────────────
  (gen_random_uuid(), 'coupons', 'create'),
  (gen_random_uuid(), 'coupons', 'read'),
  (gen_random_uuid(), 'coupons', 'update'),
  (gen_random_uuid(), 'coupons', 'delete'),
  (gen_random_uuid(), 'coupons', 'list'),
  (gen_random_uuid(), 'coupons', 'validate'),

  -- ── Módulo: cart ──────────────────────────────────────────
  (gen_random_uuid(), 'cart', 'add'),
  (gen_random_uuid(), 'cart', 'remove'),
  (gen_random_uuid(), 'cart', 'read_own'),
  (gen_random_uuid(), 'cart', 'clear'),

  -- ── Módulo: users ─────────────────────────────────────────
  (gen_random_uuid(), 'users', 'read_own'),
  (gen_random_uuid(), 'users', 'read_all'),
  (gen_random_uuid(), 'users', 'update_own'),
  (gen_random_uuid(), 'users', 'update_all'),
  (gen_random_uuid(), 'users', 'delete'),

  -- ── Módulo: shipping ──────────────────────────────────────
  (gen_random_uuid(), 'shipping', 'create'),
  (gen_random_uuid(), 'shipping', 'read_own'),
  (gen_random_uuid(), 'shipping', 'read_all'),
  (gen_random_uuid(), 'shipping', 'update'),
  (gen_random_uuid(), 'shipping', 'delete'),

  -- ── Módulo: pints_user (puntos) ───────────────────────────
  (gen_random_uuid(), 'pints_user', 'read_own'),
  (gen_random_uuid(), 'pints_user', 'read_all'),
  (gen_random_uuid(), 'pints_user', 'update'),

  -- ── Módulo: product_images ────────────────────────────────
  (gen_random_uuid(), 'product_images', 'create'),
  (gen_random_uuid(), 'product_images', 'read'),
  (gen_random_uuid(), 'product_images', 'delete')

ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════
-- PASO 2: Asignar TODOS los permisos al rol ADMIN
-- (admin tiene acceso completo a todo el sistema)
-- ══════════════════════════════════════════════════════════════

INSERT INTO role_permits ("IdRolePermits", "IdPermits", "IdRole")
SELECT
  gen_random_uuid(),
  p."IdPermits",
  '06e75273-0802-4cb8-b630-462be53098e2'::uuid  -- admin
FROM permits p
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════
-- PASO 3: Asignar permisos LIMITADOS al rol COMPRADOR
-- ══════════════════════════════════════════════════════════════

INSERT INTO role_permits ("IdRolePermits", "IdPermits", "IdRole")
SELECT
  gen_random_uuid(),
  p."IdPermits",
  '479584cc-1d0f-4497-9e6a-d3993442d47a'::uuid  -- comprador
FROM permits p
WHERE
  -- Productos: solo ver y listar
  ("moduleName" = 'products'      AND "actionName" IN ('read', 'list'))
  -- Categorías: solo ver y listar
  OR ("moduleName" = 'categories'  AND "actionName" IN ('read', 'list'))
  -- Órdenes: crear, ver las propias, listar las propias, cancelar las propias
  OR ("moduleName" = 'orders'      AND "actionName" IN ('create', 'read_own', 'list_own', 'cancel_own'))
  -- Cupones: solo validar (aplicar un cupón en su compra)
  OR ("moduleName" = 'coupons'     AND "actionName" IN ('validate'))
  -- Carrito: acceso completo a su propio carrito
  OR ("moduleName" = 'cart'        AND "actionName" IN ('add', 'remove', 'read_own', 'clear'))
  -- Usuarios: ver y editar su propio perfil
  OR ("moduleName" = 'users'       AND "actionName" IN ('read_own', 'update_own'))
  -- Envío: crear y ver sus propias direcciones
  OR ("moduleName" = 'shipping'    AND "actionName" IN ('create', 'read_own'))
  -- Puntos: solo ver sus propios puntos
  OR ("moduleName" = 'pints_user'  AND "actionName" IN ('read_own'))
  -- Imágenes de productos: solo ver
  OR ("moduleName" = 'product_images' AND "actionName" IN ('read'))
ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════
-- VERIFICACIÓN: Contar permisos asignados por rol
-- ══════════════════════════════════════════════════════════════

SELECT
  r."nameRole",
  COUNT(rp."IdRolePermits") AS total_permisos
FROM role r
LEFT JOIN role_permits rp ON r."IdRole" = rp."IdRole"
GROUP BY r."nameRole"
ORDER BY r."nameRole";
