# Diagrama de Paquetes — Modelo Arquitectónico del Backend MoonPhases

## Diagrama General de Paquetes

El backend sigue una **arquitectura Clean Architecture** (Arquitectura Limpia) con **8 módulos de dominio**, cada uno organizado en 3 capas internas: `domain`, `application` e `infrastructure`.

```mermaid
graph TB
    subgraph "🌙 back-moon-p [Backend MoonPhases]"

        subgraph "📡 Capa de Presentación [Controllers + DTOs]"
            AC["auth.controller"]
            UC["users.controller"]
            PC["products.controller"]
            CC["categories.controller"]
            CRC["cart.controller"]
            CPC["coupons.controller"]
            SC["shipping.controller"]
            OC["orders.controller"]
        end

        subgraph "⚙️ Capa de Aplicación [Use Cases]"
            AUC["Auth Use Cases"]
            UUC["Users Use Cases"]
            PUC["Products Use Cases"]
            CAUC["Categories Use Cases"]
            CRUC["Cart Use Cases"]
            CPUC["Coupons Use Cases"]
            SUC["Shipping Use Cases"]
            OUC["Orders Use Cases"]
        end

        subgraph "🏛️ Capa de Dominio [Entities + Interfaces]"
            AD["Auth Interfaces"]
            UD["User Entity + Interface"]
            PD["Product Entity + Interface"]
            CAD["Category Entity + Interface"]
            CRD["CartItem Entity + Interface"]
            CPD["Coupon Entity + Interface"]
            SD["ShippingAddress Entity + Interface"]
            OD["Order Entity + Interface"]
        end

        subgraph "🔌 Capa de Infraestructura [Repositories]"
            AR["SupabaseAuthRepository"]
            UR["SupabaseUserRepository"]
            PR["SupabaseProductRepository"]
            CAR["SupabaseCategoryRepository"]
            CRR["SupabaseCartRepository"]
            CPR["SupabaseCouponRepository"]
            SR["SupabaseShippingRepository"]
            OR["SupabaseOrderRepository"]
        end

        subgraph "🛡️ Paquete Común [common/]"
            GU["Guards: AuthGuard, RolesGuard"]
            DE["Decorators: @Roles, @CurrentUser"]
            EX["Exceptions: throwSupabaseError"]
            DTO["ApiResponse DTO"]
        end

        subgraph "☁️ Supabase Service"
            SS["SupabaseService: client + adminClient"]
        end
    end

    subgraph "🗄️ Servicios Externos"
        SB[("Supabase PostgreSQL + Auth + Storage")]
    end

    AC --> AUC
    UC --> UUC
    PC --> PUC
    CC --> CAUC
    CRC --> CRUC
    CPC --> CPUC
    SC --> SUC
    OC --> OUC

    AUC --> AD
    UUC --> UD
    PUC --> PD
    CAUC --> CAD
    CRUC --> CRD
    CPUC --> CPD
    SUC --> SD
    OUC --> OD

    AR -.->|implementa| AD
    UR -.->|implementa| UD
    PR -.->|implementa| PD
    CAR -.->|implementa| CAD
    CRR -.->|implementa| CRD
    CPR -.->|implementa| CPD
    SR -.->|implementa| SD
    OR -.->|implementa| OD

    AR --> SS
    UR --> SS
    PR --> SS
    CAR --> SS
    CRR --> SS
    CPR --> SS
    SR --> SS
    OR --> SS

    SS --> SB

    AC --> GU
    UC --> GU
    PC --> GU
    CRC --> GU
    CPC --> GU
    SC --> GU
    OC --> GU

    AC --> DE
    UC --> DE
    PC --> DE
    CRC --> DE
    CPC --> DE
    SC --> DE
    OC --> DE

    AR --> EX
    UR --> EX
    PR --> EX
    CAR --> EX
    CRR --> EX
    CPR --> EX
    SR --> EX
    OR --> EX
```

---

## Diagrama Detallado por Módulo

Cada módulo de dominio sigue exactamente la misma estructura interna de 3 capas:

```mermaid
graph TB
    subgraph "📦 Estructura interna de cada módulo"
        direction TB

        subgraph "module.ts [Orquestador NestJS]"
            MOD["Registra: Controller + Providers\nConfigura: Imports + Exports\nInyección de Dependencias vía Token"]
        end

        subgraph "Capa 1: Presentación"
            CTRL["controller.ts\n• Define endpoints HTTP\n• Valida entrada con DTOs\n• Aplica Guards de seguridad\n• Retorna ApiResponse"]
            DTOS["dto/\n• DTOs con class-validator\n• Create, Update, Filter"]
        end

        subgraph "Capa 2: Aplicación"
            UC1["use-case.ts\n• Orquesta lógica de negocio\n• Inyecta repositorio vía interfaz\n• Lanza excepciones HTTP\n• 1 use case = 1 operación"]
        end

        subgraph "Capa 3: Dominio [Núcleo Puro]"
            ENT["entity.ts\n• Propiedades del negocio\n• Métodos de dominio\n• Sin dependencias externas"]
            INT["repository.interface.ts\n• Contrato abstracto\n• Token de inyección\n• Define operaciones CRUD"]
        end

        subgraph "Capa 4: Infraestructura"
            REPO["supabase-*.repository.ts\n• Implementa la interfaz\n• Usa SupabaseService\n• Mapper toEntity()\n• throwSupabaseError()"]
        end

        MOD --> CTRL
        MOD --> UC1
        MOD --> REPO
        CTRL --> DTOS
        CTRL --> UC1
        UC1 --> INT
        REPO -.->|implementa| INT
        REPO --> ENT
    end
```

---

## Diagrama de Dependencias entre Módulos

```mermaid
graph LR
    subgraph "Módulos Independientes"
        AUTH["📦 AuthModule"]
        USERS["📦 UsersModule"]
        CATS["📦 CategoriesModule"]
    end

    subgraph "Módulos con Dependencias"
        PRODS["📦 ProductsModule"]
        CART["📦 CartModule"]
        COUPS["📦 CouponsModule"]
        SHIP["📦 ShippingModule"]
        ORDERS["📦 OrdersModule"]
    end

    subgraph "Infraestructura"
        SUPA["☁️ SupabaseModule"]
        COMMON["🛡️ Common"]
        CONFIG["⚙️ ConfigModule"]
    end

    CART -->|importa| PRODS
    COUPS -->|importa| CART
    COUPS -->|importa| PRODS
    ORDERS -->|importa| CART
    ORDERS -->|importa| PRODS
    ORDERS -->|importa| COUPS
    ORDERS -->|importa| SHIP

    AUTH --> SUPA
    USERS --> SUPA
    PRODS --> SUPA
    CATS --> SUPA
    CART --> SUPA
    COUPS --> SUPA
    SHIP --> SUPA
    ORDERS --> SUPA

    SUPA --> CONFIG
```

---

## Diagrama de cada Módulo — Contenido Detallado

### 📦 AuthModule (CU01)
```mermaid
graph TB
    subgraph "AuthModule"
        subgraph "dto/"
            LD["LoginDto"]
            RD["RegisterDto"]
            RTD["RefreshTokenDto"]
        end
        subgraph "application/"
            LUC["LoginUseCase"]
            RUC["RegisterUseCase"]
            LOUC["LogoutUseCase"]
            RSUC["RefreshSessionUseCase"]
        end
        subgraph "domain/"
            ARI["IAuthRepository\n+ AUTH_REPOSITORY token"]
        end
        subgraph "infrastructure/"
            SAR["SupabaseAuthRepository"]
        end
        ACTRL["AuthController\n• POST /auth/login\n• POST /auth/register\n• POST /auth/logout\n• POST /auth/refresh"]
    end
    ACTRL --> LUC & RUC & LOUC & RSUC
    LUC & RUC & LOUC & RSUC --> ARI
    SAR -.->|implementa| ARI
```

### 📦 UsersModule
```mermaid
graph TB
    subgraph "UsersModule"
        subgraph "dto/"
            UUD["UpdateUserDto"]
        end
        subgraph "application/"
            GUPC["GetUserProfileUseCase"]
            UUPC["UpdateUserProfileUseCase"]
        end
        subgraph "domain/"
            UE["User entity\n+ fullName()"]
            URI["IUserRepository\n+ USER_REPOSITORY token"]
        end
        subgraph "infrastructure/"
            SUR["SupabaseUserRepository\n+ toEntity()"]
        end
        UCTRL["UsersController\n• GET /users/profile\n• PATCH /users/profile"]
    end
    UCTRL --> GUPC & UUPC
    GUPC & UUPC --> URI
    SUR -.->|implementa| URI
    SUR --> UE
```

### 📦 ProductsModule (CU04)
```mermaid
graph TB
    subgraph "ProductsModule"
        subgraph "dto/"
            CPD2["CreateProductDto"]
            UPD["UpdateProductDto\n extends PartialType"]
            FPD["FilterProductsDto"]
        end
        subgraph "application/"
            CPUC2["CreateProductUseCase"]
            GPUC["GetProductUseCase"]
            LPUC["ListProductsUseCase"]
            UPUC["UpdateProductUseCase"]
            DPUC["DeleteProductUseCase\n+ soft-delete logic"]
            UPIUC["UploadProductImagesUseCase"]
            DPIUC["DeleteProductImageUseCase"]
        end
        subgraph "domain/"
            PE["Product entity\n+ isInStock()"]
            PIE["ProductImage entity"]
            PRI["IProductRepository\n+ PRODUCT_REPOSITORY token\n+ hasOrderHistory()\n+ addImage() / removeImage()"]
        end
        subgraph "infrastructure/"
            SPR["SupabaseProductRepository\n+ toEntity()\n+ toImageEntity()"]
        end
        PCTRL["ProductsController\n• GET /products\n• GET /products/:id\n• POST /products\n• PATCH /products/:id\n• DELETE /products/:id\n• POST /products/:id/images\n• DELETE /products/:id/images/:imageId"]
    end
    PCTRL --> CPUC2 & GPUC & LPUC & UPUC & DPUC & UPIUC & DPIUC
    CPUC2 & GPUC & LPUC & UPUC & DPUC & UPIUC & DPIUC --> PRI
    SPR -.->|implementa| PRI
    SPR --> PE & PIE
```

### 📦 CartModule (CU02)
```mermaid
graph TB
    subgraph "CartModule"
        subgraph "dto/"
            ACD["AddToCartDto"]
            UCID["UpdateCartItemDto"]
        end
        subgraph "application/"
            ATCUC["AddToCartUseCase\n+ stock validation\n+ duplicate merge"]
            GCUC["GetCartUseCase"]
            RFCUC["RemoveFromCartUseCase"]
            UCIUC["UpdateCartItemUseCase"]
            CCUC["ClearCartUseCase"]
        end
        subgraph "domain/"
            CIE["CartItem entity"]
            CRI2["ICartRepository\n+ CART_REPOSITORY token\n+ findExistingItem()"]
        end
        subgraph "infrastructure/"
            SCR["SupabaseCartRepository\n+ toEntity()"]
        end
        CRCTRL["CartController\n• GET /cart\n• POST /cart/items\n• PATCH /cart/items/:id\n• DELETE /cart/items/:id\n• DELETE /cart"]
    end
    CRCTRL --> ATCUC & GCUC & RFCUC & UCIUC & CCUC
    ATCUC & GCUC & RFCUC & UCIUC & CCUC --> CRI2
    SCR -.->|implementa| CRI2
    ATCUC -->|verifica stock| PRI2["IProductRepository"]
```

### 📦 CouponsModule (CU05 + CU06)
```mermaid
graph TB
    subgraph "CouponsModule"
        subgraph "dto/"
            CCD["CreateCouponDto"]
            VCD["ValidateCouponDto"]
        end
        subgraph "application/"
            CCUC2["CreateCouponUseCase\n+ duplicate code check"]
            LCUC["ListCouponsUseCase"]
            VCUC["ValidateCouponUseCase\n+ expiration check\n+ minimum amount\n+ category match\n+ cart total calc"]
        end
        subgraph "domain/"
            CE["Coupon entity\n+ isValid()\n+ isExpired()\n+ hasStock()"]
            CPRI["ICouponRepository\n+ COUPON_REPOSITORY token\n+ decrementQuantity()"]
        end
        subgraph "infrastructure/"
            SCPR["SupabaseCouponRepository\n+ toEntity()\n+ RPC decrement"]
        end
        CPCTRL["CouponsController\n• POST /coupons\n• GET /coupons\n• POST /coupons/validate"]
    end
    CPCTRL --> CCUC2 & LCUC & VCUC
    CCUC2 & LCUC & VCUC --> CPRI
    SCPR -.->|implementa| CPRI
    VCUC -->|calcula total carrito| CARTDEP["ICartRepository"]
    VCUC -->|verifica categoría| PRODDEP["IProductRepository"]
```

### 📦 OrdersModule (CU03 + CU07 + CU08)
```mermaid
graph TB
    subgraph "OrdersModule"
        subgraph "dto/"
            COD["CreateOrderDto"]
            UOSD["UpdateOrderStatusDto\n IsIn: EN PROCESO, CONFIRMADO,\nENVIADO, FINALIZADO, CANCELADO"]
        end
        subgraph "application/"
            COUC["CreateOrderUseCase\n+ 11-step checkout flow\n+ WhatsApp URL builder\n+ unique code generator"]
            GOUC["GetOrderUseCase"]
            LOUC2["ListOrdersUseCase"]
            GOUDUC["GetOrderDetailUseCase\n+ ownership check"]
            LAOUC["ListAllOrdersUseCase"]
            UOSUC["UpdateOrderStatusUseCase\n+ blocks FINALIZADO/CANCELADO\n+ records order_history"]
        end
        subgraph "domain/"
            OE["Order entity"]
            OIE["OrderItem entity\n+ subtotal getter"]
            ORI["IOrderRepository\n+ ORDER_REPOSITORY token\n+ getStatusIdByName()\n+ addHistory()\n+ existsByOrderCode()"]
        end
        subgraph "infrastructure/"
            SOR["SupabaseOrderRepository\n+ toEntity()\n+ toItemEntity()\n+ joins status/product"]
        end
        OCTRL["OrdersController\n• POST /orders\n• GET /orders\n• GET /orders/:id\n• GET /orders/admin/all\n• PATCH /orders/admin/:id/status"]
    end
    OCTRL --> COUC & GOUC & LOUC2 & GOUDUC & LAOUC & UOSUC
    COUC & GOUC & LOUC2 & GOUDUC & LAOUC & UOSUC --> ORI
    SOR -.->|implementa| ORI
    COUC -->|obtiene carrito| CDEP["ICartRepository"]
    COUC -->|verifica stock| PDEP["IProductRepository"]
    COUC -->|valida dirección| SDEP["IShippingRepository"]
    COUC -->|valida cupón| VCDEP["ValidateCouponUseCase"]
    COUC -->|decrementa cupón| CPDEP["ICouponRepository"]
```

### 📦 ShippingModule
```mermaid
graph TB
    subgraph "ShippingModule"
        subgraph "dto/"
            CSAD["CreateShippingAddressDto"]
        end
        subgraph "application/"
            ASAUC["AddShippingAddressUseCase"]
            LSAUC["ListShippingAddressesUseCase"]
            DSAUC["DeleteShippingAddressUseCase"]
        end
        subgraph "domain/"
            SAE["ShippingAddress entity"]
            SRI["IShippingRepository\n+ SHIPPING_REPOSITORY token"]
        end
        subgraph "infrastructure/"
            SSR["SupabaseShippingRepository\n+ toEntity()"]
        end
        SCTRL["ShippingController\n• GET /shipping/addresses\n• POST /shipping/addresses\n• DELETE /shipping/addresses/:id"]
    end
    SCTRL --> ASAUC & LSAUC & DSAUC
    ASAUC & LSAUC & DSAUC --> SRI
    SSR -.->|implementa| SRI
```

### 📦 CategoriesModule
```mermaid
graph TB
    subgraph "CategoriesModule"
        subgraph "application/"
            LCAUC["ListCategoriesUseCase"]
        end
        subgraph "domain/"
            CATE["Category entity"]
            CATRI["ICategoryRepository\n+ CATEGORY_REPOSITORY token"]
        end
        subgraph "infrastructure/"
            SCATR["SupabaseCategoryRepository\n+ toEntity()"]
        end
        CATCTRL["CategoriesController\n• GET /categories"]
    end
    CATCTRL --> LCAUC
    LCAUC --> CATRI
    SCATR -.->|implementa| CATRI
```

---

## Paquete Común — Detalle

```mermaid
graph TB
    subgraph "📦 common/"
        subgraph "guards/"
            AG["AuthGuard\n• Valida JWT Bearer\n• Inyecta userId en request\n• Usa SupabaseService.client"]
            RG["RolesGuard\n• Lee @Roles() metadata\n• Consulta rol del usuario en BD\n• ForbiddenException si no cumple"]
        end
        subgraph "decorators/"
            RD2["@Roles(...roles)\n• SetMetadata para RolesGuard"]
            CUD["@CurrentUser(field?)\n• Extrae AuthUser del request\n• Tipado: userId, email, role"]
        end
        subgraph "exceptions/"
            TSE["throwSupabaseError(error)\n• 23505 → ConflictException 409\n• 23503 → BadRequestException 400\n• PGRST116 → NotFoundException 404\n• default → InternalServerError 500"]
        end
        subgraph "dto/"
            APR["ApiResponse T\n• ok(data, message)\n• created(data, message)\n• empty(message)"]
        end
    end
```

---

## Guía para recrear en Draw.io

### Convenciones de colores sugeridas

| Capa | Color de fondo | Color del borde |
|---|---|---|
| **Presentación** (Controllers + DTOs) | `#DBEAFE` (azul claro) | `#3B82F6` (azul) |
| **Aplicación** (Use Cases) | `#FEF3C7` (amarillo claro) | `#F59E0B` (amarillo) |
| **Dominio** (Entities + Interfaces) | `#D1FAE5` (verde claro) | `#10B981` (verde) |
| **Infraestructura** (Repositories) | `#FEE2E2` (rojo claro) | `#EF4444` (rojo) |
| **Común** (Guards, Decorators) | `#E5E7EB` (gris claro) | `#6B7280` (gris) |
| **Supabase** | `#EDE9FE` (púrpura claro) | `#8B5CF6` (púrpura) |
| **Externo** (BD) | `#F3F4F6` | `#374151` |

### Tipos de flechas

| Flecha | Significado | Estilo en Draw.io |
|---|---|---|
| `───────►` | **Dependencia directa** (usa/llama) | Línea sólida con punta |
| `- - - - ►` | **Implementa interfaz** | Línea discontinua con triángulo vacío |
| `═══════►` | **Importa módulo NestJS** | Línea gruesa sólida |

### Pasos para recrear

1. **Crear un frame principal** titulado `back-moon-p`
2. **Crear 4 filas horizontales** (Presentación, Aplicación, Dominio, Infraestructura)
3. **Colocar 8 paquetes** UML por fila (uno por módulo)
4. **Colocar paquetes transversales** a la derecha: `common/` y `SupabaseService`
5. **Dibujar flechas** sólidas hacia abajo (capa superior → capa inferior)
6. **Dibujar flechas** discontinuas hacia arriba (Infrastructure → Domain, implementa interfaz)
7. **Dibujar flechas** horizontales entre módulos (dependencias inter-módulo)

### Estructura UML de paquete en Draw.io

Para cada módulo usa el shape **Package** de UML:

```
┌─────────────────────────────┐
│ «paquete»                   │
│ NombreMódulo                │
├─────────────────────────────┤
│  ┌──────────────────────┐   │
│  │ domain/              │   │
│  │  • Entity            │   │
│  │  • IRepository       │   │
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │ application/         │   │
│  │  • UseCase1          │   │
│  │  • UseCase2          │   │
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │ infrastructure/      │   │
│  │  • SupabaseRepo      │   │
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │ dto/                 │   │
│  │  • CreateDto         │   │
│  │  • UpdateDto         │   │
│  └──────────────────────┘   │
│  controller.ts              │
│  module.ts                  │
└─────────────────────────────┘
```
