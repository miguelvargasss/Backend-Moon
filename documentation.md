# 📘 Documentación del Backend — MoonPhases

## 1. Información General

| Item | Detalle |
|---|---|
| **Framework** | NestJS v11 + TypeScript |
| **Base de datos** | PostgreSQL (Supabase) |
| **Arquitectura** | Clean Architecture — 3 capas por módulo (`domain/`, `application/`, `infrastructure/`) |
| **Autenticación** | JWT via Supabase Auth |
| **Storage** | Supabase Storage — bucket `product-images` (público, 5MB) |
| **Puerto** | 3000 |
| **WhatsApp** | +51999159716 |

---

## 2. Estructura de Módulos

```
src/
├── common/                   ← Infraestructura compartida
│   ├── decorators/           ← @Roles(), @CurrentUser()
│   ├── dto/                  ← ApiResponse wrapper
│   ├── exceptions/           ← throwSupabaseError()
│   └── guards/               ← AuthGuard, RolesGuard
├── supabase/                 ← SupabaseService (client + adminClient)
├── auth/                     ← CU01 — Login, Register, Logout, Refresh
├── users/                    ← Perfil de usuario
├── products/                 ← CU04 — CRUD productos + imágenes
├── categories/               ← Categorías públicas
├── cart/                     ← CU02 — Carrito con validación de stock
├── coupons/                  ← CU05 + CU06 — Admin crea / Cliente valida
├── shipping/                 ← Direcciones de envío
└── orders/                   ← CU03 + CU07 + CU08 — Checkout, historial, admin
```

---

## 3. Endpoints (30 rutas)

### Auth (CU01)
| Método | Ruta | Acceso | Estado |
|---|---|---|---|
| `POST` | `/auth/login` | 🔓 público | ✅ Funcional |
| `POST` | `/auth/register` | 🔓 público | ✅ Funcional |
| `POST` | `/auth/logout` | 🔒 auth | ✅ Funcional |
| `POST` | `/auth/refresh` | 🔓 público | ✅ Funcional |

### Users
| Método | Ruta | Acceso | Estado |
|---|---|---|---|
| `GET` | `/users/profile` | 🔒 auth | ✅ Funcional |
| `PATCH` | `/users/profile` | 🔒 auth | ✅ Funcional |

### Categories
| Método | Ruta | Acceso | Estado |
|---|---|---|---|
| `GET` | `/categories` | 🔓 público | ✅ Funcional |

### Products (CU04)
| Método | Ruta | Acceso | Estado |
|---|---|---|---|
| `GET` | `/products` | 🔓 público | ✅ Funcional |
| `GET` | `/products/:id` | 🔓 público | ✅ Funcional |
| `POST` | `/products` | 🛡️ admin | ✅ Funcional |
| `PATCH` | `/products/:id` | 🛡️ admin | ✅ Funcional |
| `DELETE` | `/products/:id` | 🛡️ admin | ✅ Funcional |
| `POST` | `/products/:id/images` | 🛡️ admin | ✅ Funcional |
| `DELETE` | `/products/:id/images/:imageId` | 🛡️ admin | ✅ Funcional |

### Cart (CU02)
| Método | Ruta | Acceso | Estado |
|---|---|---|---|
| `GET` | `/cart` | 🔒 auth | ✅ Funcional |
| `POST` | `/cart/items` | 🔒 auth | ✅ Funcional |
| `PATCH` | `/cart/items/:id` | 🔒 auth | ✅ Funcional |
| `DELETE` | `/cart/items/:id` | 🔒 auth | ✅ Funcional |
| `DELETE` | `/cart` | 🔒 auth | ✅ Funcional |

### Coupons (CU05 + CU06)
| Método | Ruta | Acceso | Estado |
|---|---|---|---|
| `POST` | `/coupons` | 🛡️ admin | ✅ Funcional |
| `GET` | `/coupons` | 🛡️ admin | ✅ Funcional |
| `POST` | `/coupons/validate` | 🔒 auth | ✅ Funcional |

### Shipping
| Método | Ruta | Acceso | Estado |
|---|---|---|---|
| `GET` | `/shipping/addresses` | 🔒 auth | ✅ Funcional |
| `POST` | `/shipping/addresses` | 🔒 auth | ✅ Funcional |
| `DELETE` | `/shipping/addresses/:id` | 🔒 auth | ⚠️ Incompleto |

### Orders (CU03 + CU07 + CU08)
| Método | Ruta | Acceso | Estado |
|---|---|---|---|
| `POST` | `/orders` | 🔒 auth | ✅ Funcional |
| `GET` | `/orders` | 🔒 auth | ✅ Funcional |
| `GET` | `/orders/:id` | 🔒 auth | ✅ Funcional |
| `GET` | `/orders/admin/all` | 🛡️ admin | ✅ Funcional |
| `PATCH` | `/orders/admin/:id/status` | 🛡️ admin | ✅ Funcional |

---

## 4. Estado Actual — Análisis Completo

### ✅ Lo que está correctamente implementado

1. **Arquitectura Clean Architecture** — Todas las capas separadas correctamente
2. **Autenticación JWT** via `AuthGuard` + Supabase Auth
3. **Autorización por roles** via `RolesGuard` + `@Roles('admin')`
4. **Validación de DTOs** con `class-validator` + `ValidationPipe` global
5. **Manejo centralizado de errores** con `throwSupabaseError()`
6. **Respuestas uniformes** con `ApiResponse.ok()` / `.created()` / `.empty()`
7. **8 módulos de dominio** registrados y compilando sin errores
8. **30 endpoints** definidos cubriendo los 8 CUN
9. **Variables de entorno** configuradas correctamente
10. **CORS** configurado para el frontend (localhost:5173)
11. **Migraciones SQL** — schema + seed data ejecutados

---

## 5. ✅ Problemas Encontrados y Corregidos

### PROBLEMA 1 — `DELETE /shipping/addresses/:id` no eliminaba ✅ CORREGIDO

Se creó `DeleteShippingAddressUseCase` y se conectó al controller. Ahora el endpoint realmente elimina la dirección de la BD.

### PROBLEMA 2 — Función SQL `decrement_coupon_quantity` faltante ✅ CORREGIDO

Se creó la función RPC en la migración `20260418000000_fix_rpc_and_constraints.sql`. La función decrementa atómicamente la cantidad del cupón y lanza error si no hay stock.

### PROBLEMA 3 — UNIQUE constraints faltantes en tablas seed ✅ CORREGIDO

Se agregaron constraints `UNIQUE` a `role.nameRole`, `status.nameStatus` y `statusProduct.nameStatusProduct` en la misma migración.

> ⚠️ **Acción requerida:** Ejecutar `supabase db push` para aplicar la nueva migración `20260418000000_fix_rpc_and_constraints.sql`.

---

## 6. Variables de Entorno Requeridas

| Variable | Descripción | Valor actual |
|---|---|---|
| `PORT` | Puerto del servidor | `3000` |
| `FRONTEND_URL` | URL del frontend para CORS | `http://localhost:5173` |
| `SUPABASE_URL` | URL del proyecto Supabase | ✅ Configurado |
| `SUPABASE_ANON_KEY` | Clave pública de Supabase | ✅ Configurado |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (admin) | ✅ Configurado |
| `WHATSAPP_NUMBER` | Número para link de checkout | `+51999159716` |

---

## 7. Base de Datos — Tablas

| Tabla | Módulo | Registros seed |
|---|---|---|
| `role` | Auth/Users | `admin`, `comprador` |
| `permits` | Auth | — |
| `role_permits` | Auth | — |
| `user` | Users | vía trigger `handle_new_user()` |
| `pints_user` | Users | — |
| `categorie` | Categories | — |
| `statusProduct` | Products | `activo`, `inactivo` |
| `product` | Products | — |
| `product_image` | Products | — |
| `shopping_cart` | Cart | — |
| `coupons` | Coupons | — |
| `status` | Orders | `EN PROCESO`, `CONFIRMADO`, `ENVIADO`, `FINALIZADO`, `CANCELADO` |
| `shipping_address` | Shipping | — |
| `order` | Orders | — |
| `order_item` | Orders | — |
| `order_history` | Orders | — |

---

## 8. Roles y Permisos

| Rol | Permisos |
|---|---|
| **admin** | CRUD productos, crear cupones, ver todas las órdenes, cambiar estados |
| **comprador** | Ver catálogo, gestionar carrito, validar cupones, hacer checkout, ver su historial |

---

## 9. Flujo de Checkout (CU03)

```
1. Cliente agrega productos al carrito (POST /cart/items)
2. Cliente registra dirección de envío (POST /shipping/addresses)
3. [Opcional] Cliente valida cupón (POST /coupons/validate)
4. Cliente hace checkout (POST /orders)
   ├── Verifica carrito no vacío
   ├── Verifica stock de cada producto
   ├── Valida cupón si se envió
   ├── Verifica dirección de envío
   ├── Genera código alfanumérico (ej: M892BGS)
   ├── Busca status "EN PROCESO"
   ├── Crea orden + order_items (precios congelados)
   ├── Reduce stock de productos
   ├── Decrementa cantidad del cupón
   ├── Vacía carrito
   └── Genera URL WhatsApp
5. Retorna { order, total, discount, whatsappUrl }
```
