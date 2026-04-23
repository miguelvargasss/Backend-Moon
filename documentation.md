# 📘 Documentación del Backend — MoonPhases

El backend sigue una **arquitectura Clean Architecture** (Arquitectura Limpia) con **8 módulos de dominio**, cada uno organizado en 3 capas internas: `domain`, `application` e `infrastructure`.


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
------------------------------------------------------------------------------------

### 1. Shapes a usar

| Elemento | Shape en Draw.io | Ubicación en menú |
|---|---|---|
| **Paquete (capa)** | UML → Package | Selecciona la pestaña UML del panel izquierdo |
| **Sub-paquete** | UML → Package (más pequeño, anidado) | Arrastra dentro del paquete padre |
| **Componente** | General → Rectangle | Rectángulo simple con nombre |
| **Base de datos** | General → Cylinder / Database | Forma de cilindro |
| **Dependencia** | Dashed arrow con punta abierta | Selecciona la flecha → estilo Dashed |

### 2. Colores por Capa

| Capa | Fill (fondo) | Stroke (borde) | Código hex |
|---|---|---|---|
| Presentación | Azul claro | Azul | `#DBEAFE` / `#3B82F6` |
| Seguridad | Gris claro | Gris | `#E5E7EB` / `#6B7280` |
| Lógica de Negocio | Amarillo claro | Amarillo | `#FEF3C7` / `#F59E0B` |
| Dominio | Verde claro | Verde | `#D1FAE5` / `#10B981` |
| Infraestructura | Rojo claro | Rojo | `#FEE2E2` / `#EF4444` |
| Servicios Externos | Púrpura claro | Púrpura | `#EDE9FE` / `#8B5CF6` |

### 3. Pasos para construir

**Paso 1 — Crear las 5 capas (paquetes UML grandes):**
- Arrastra 5 shapes "Package" de UML y colócalos de arriba hacia abajo
- Nombra cada uno: `Capa de Presentación`, `Paquete de Seguridad`, `Capa de Lógica de Negocio`, `Capa de Dominio`, `Capa de Infraestructura`
- A la derecha coloca un 6to paquete: `Servicios Externos`

**Paso 2 — Dentro de Capa de Presentación:**
- Arrastra 8 paquetes pequeños dentro, nombrados: Auth, Users, Products, Categories, Cart, Coupons, Shipping, Orders
- Dentro de cada uno pon rectángulos con los nombres: Controller y DTOs

**Paso 3 — Dentro de Paquete de Seguridad:**
- Coloca 5 rectángulos: AuthGuard, RolesGuard, @Roles, @CurrentUser, ApiResponse

**Paso 4 — Dentro de Capa de Lógica de Negocio:**
- Arrastra 8 sub-paquetes: Subsistema de Autenticación, Subsistema de Usuarios, etc.
- Dentro de cada uno lista los Use Cases como rectángulos

**Paso 5 — Dentro de Capa de Dominio:**
- Arrastra 8 sub-paquetes: Paquete Auth, Paquete User, etc.
- Dentro pon las entidades y las interfaces (IRepository)

**Paso 6 — Dentro de Capa de Infraestructura:**
- 3 sub-paquetes: Repositorios, Supabase, Errores
- En Repositorios lista los 8 SupabaseRepository
- En Supabase pon: SupabaseService, client, adminClient
- En Errores pon: throwSupabaseError

**Paso 7 — Servicios Externos:**
- 4 sub-paquetes: Base de Datos (cilindro PostgreSQL), Autenticación (Supabase Auth), Almacenamiento (Supabase Storage), Mensajería (WhatsApp)

**Paso 8 — Flechas de dependencia:**
- Usa **flechas discontinuas** (dashed) con punta abierta entre capas:
  - `Presentación` - - - → `Seguridad` (usa)
  - `Presentación` - - - → `Lógica de Negocio` (depende de)
  - `Lógica de Negocio` - - - → `Dominio` (depende de)
  - `Infraestructura` - - - → `Dominio` (implementa)
  - `Infraestructura` - - - → `Servicios Externos` (conecta con)

### 4. Layout recomendado (tamaño canvas 1920x1400)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Capa de Presentación                         │
│  ┌──────┐ ┌──────┐ ┌────────┐ ┌──────────┐                    │
│  │ Auth │ │Users │ │Products│ │Categories│                     │
│  └──────┘ └──────┘ └────────┘ └──────────┘                     │
│  ┌──────┐ ┌───────┐ ┌────────┐ ┌──────┐                       │
│  │ Cart │ │Coupons│ │Shipping│ │Orders│                        │
│  └──────┘ └───────┘ └────────┘ └──────┘                        │
└────────────────────────┬────────────────────────────────────────┘
          ┌──────────────┤                    ┌───────────────────┐
          │         - - -▼- - - - - - - - -   │Paquete Seguridad  │
          │                                   │ AuthGuard         │
          │                                   │ RolesGuard        │
          │                                   │ @Roles            │
          │                                   │ @CurrentUser      │
          │                                   │ ApiResponse       │
          │                                   └───────────────────┘
     - - -▼- - - - - -
┌─────────────────────────────────────────────────────────────────┐
│               Capa de Lógica de Negocio                        │
│  ┌──────────────┐ ┌────────────┐ ┌──────────────┐             │
│  │Subsistema    │ │Subsistema  │ │Subsistema    │             │
│  │Autenticación │ │Usuarios    │ │Productos     │             │
│  └──────────────┘ └────────────┘ └──────────────┘             │
│  ┌──────────────┐ ┌────────────┐ ┌──────────────┐             │
│  │Subsistema    │ │Subsistema  │ │Subsistema    │             │
│  │Carrito       │ │Cupones     │ │Envíos        │             │
│  └──────────────┘ └────────────┘ └──────────────┘             │
│  ┌──────────────┐ ┌────────────┐                              │
│  │Subsistema    │ │Subsistema  │                              │
│  │Órdenes       │ │Categorías  │                              │
│  └──────────────┘ └────────────┘                              │
└────────────────────────┬────────────────────────────────────────┘
                    - - -▼- - - - - -
┌─────────────────────────────────────────────────────────────────┐
│                     Capa de Dominio                             │
│  ┌────────┐ ┌──────┐ ┌────────┐ ┌──────────┐ ┌───────┐       │
│  │  Auth  │ │ User │ │Product │ │ Category │ │  Cart │       │
│  └────────┘ └──────┘ └────────┘ └──────────┘ └───────┘       │
│  ┌────────┐ ┌────────┐ ┌───────┐                              │
│  │ Coupon │ │Shipping│ │ Order │                               │
│  └────────┘ └────────┘ └───────┘                               │
└───────────────────────────┬─────────────────────────────────────┘
                     - - - -▲- - - - (implementa)
┌───────────────────────────┴─────────────────────────────────────┐
│                  Capa de Infraestructura                        │
│  ┌──────────────────────┐ ┌──────────────┐ ┌────────────────┐  │
│  │Paquete Repositorios  │ │Paq. Supabase │ │Paq. de Errores │  │
│  │  SupabaseAuthRepo    │ │SupabaseServic│ │throwSupabaseErr│  │
│  │  SupabaseUserRepo    │ │  client      │ └────────────────┘  │
│  │  SupabaseProductRepo │ │  adminClient │                     │
│  │  SupabaseCategoryRepo│ └──────┬───────┘                     │
│  │  SupabaseCartRepo    │        │                             │
│  │  SupabaseCouponRepo  │        │                             │
│  │  SupabaseShippingRepo│        │                             │
│  │  SupabaseOrderRepo   │        │                             │
│  └──────────────────────┘        │                             │
└──────────────────────────────────┼─────────────────────────────┘
                              - - -▼- - - -
                    ┌──────────────────────────────┐
                    │      Servicios Externos       │
                    │ ┌──────────┐ ┌─────────────┐ │
                    │ │PostgreSQL│ │Supabase Auth│ │
                    │ │ Supabase │ │    JWT      │ │
                    │ └──────────┘ └─────────────┘ │
                    │ ┌──────────┐ ┌─────────────┐ │
                    │ │ Storage  │ │  WhatsApp   │ │
                    │ │ Bucket   │ │    API      │ │
                    │ └──────────┘ └─────────────┘ │
                    └──────────────────────────────┘
```
