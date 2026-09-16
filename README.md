
<p align="center">
  <img src="./public/icon.png" alt="ClientFlow" width="80" height="80" />
</p>

<h1 align="center">ClientFlow</h1>

<p align="center">
  CRM minimalista para freelancers — gestioná clientes, proyectos, tareas y pagos desde un solo lugar.
  <br />
  <strong·Precision Minimalist Design</strong> · Inspirado en Linear, Stripe y Notion
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.x-7c3aed?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript" alt="TypeScript 6" />
  <img src="https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Supabase-Auth-3ECF8E?logo=supabase" alt="Supabase Auth" />
</p>

---

ClientFlow es un producto SaaS freemium: un plan Free limitado (3 clientes / 5 proyectos) y un plan Pro pago (mensual o anual) sin límites, cobrado a través de Polar como Merchant of Record.

## ✨ Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| **Landing / Pricing / Legal** | `/`, `/pricing`, `/terms`, `/privacy` — superficie pública, nunca requiere sesión |
| **Auth** | Login/Register con Supabase Auth, sesión reactiva vía `onAuthStateChange`, rutas protegidas |
| **Billing** | Plan Free/Pro, checkout y portal de cliente vía Polar, límites aplicados en Postgres |
| **Dashboard** | KPIs de ingresos, proyectos activos, tareas pendientes, estadísticas mensuales y onboarding para cuentas nuevas |
| **Clientes** | CRUD completo con estados (activo/pendiente/inactivo), vista de detalle y KPIs |
| **Proyectos** | CRUD con asignación a clientes, presupuesto, fechas, estados (activo/pausado/completado) y hub de detalle |
| **Tareas** | Tablero Kanban con 3 columnas (pendiente/en progreso/hechas), prioridades y fechas límite |
| **Pagos** | CRUD de facturas con montos, métodos de pago, estados, selector de mes y proyección de cobros |

## 🧱 Stack

| Capa | Tecnología |
|------|-----------|
| **Framework** | React 19 con TypeScript 6 |
| **Build** | Vite 8 + Rolldown |
| **Routing** | React Router DOM v7 |
| **Forms** | React Hook Form |
| **Backend** | Supabase (Auth + PostgreSQL + RLS) |
| **Backend serverless** | Vercel Functions (`api/**`) para checkout/portal/webhook de billing |
| **Pagos** | Polar (Merchant of Record) vía `@polar-sh/sdk` |
| **Íconos** | Lucide React |
| **Gráficos** | d3 |
| **Estilos** | CSS Modules + Design Tokens |
| **Tests** | Vitest 5 + Testing Library (cliente) · pgTAP (base de datos) |

## 📁 Estructura del proyecto

```
src/
├── components/
│   ├── auth/            # ProtectedRoute, PublicOnlyRoute
│   ├── layout/          # Layout, Navbar, Sidebar
│   ├── marketing/       # PublicNav, PublicFooter, ScrollReveal (landing/pricing)
│   ├── shared/          # ErrorBoundary, Loader, Modal, PageHeader, StatCard, OnboardingChecklist
│   └── ui/              # Componentes base reutilizables
├── features/
│   ├── auth/            # types, services, context (AuthProvider), hooks (signIn/signUp), pendingPlan
│   ├── billing/         # types, services, domain (entitlements/subscription), ports, context, hooks, components
│   ├── clients/         # types, services, hooks, components (form, card)
│   ├── payments/        # types, services, hooks, components (form, row, view)
│   ├── projects/        # types, services, hooks, components (form, card)
│   └── tasks/           # types, services, hooks, components (form, card, column)
├── pages/
│   ├── landing/         # LandingPage (/, público)
│   ├── pricing/         # PricingPage (/pricing, público)
│   ├── legal/           # TermsPage, PrivacyPage (/terms, /privacy, público)
│   ├── auth/             # Login, Register
│   ├── clients/         # ClientsPage
│   ├── dashboard/       # DashboardPage
│   ├── not-found/       # NotFoundPage (404)
│   ├── payments/        # PaymentsPage
│   ├── projects/        # ProjectsPage, ProjectHubPage
│   ├── settings/billing/# BillingSettingsPage (/settings/billing)
│   └── tasks/           # TaskPage (Kanban)
├── router/              # AppRouter (definición de rutas)
├── services/            # Cliente de Supabase
└── styles/              # tokens.css, global.css

api/
├── billing/             # checkout.ts, portal.ts, webhook.ts (Vercel Functions)
└── _lib/                # env, auth, supabaseAdmin, billingRepo, http, rawBody, polar/PolarBillingProvider

supabase/
├── migrations/          # schema, RLS, entitlements RPC, limit trigger, apply_subscription_change RPC
└── tests/               # pgTAP suites (RLS, entitlements, limit trigger, billing)
```

### Arquitectura

Cada feature sigue el mismo patrón: `types.ts` → `services.ts` → `hooks/` → `components/`. Las páginas orquestan features y componentes compartidos. Los datos viajan **unidireccionalmente**: Supabase → services → hooks → pages → components.

```
Supabase API
    ↓
features/*/services.ts   ← llamadas a la API
    ↓
features/*/hooks/*.ts    ← lógica de formularios y estado
    ↓
pages/*/Page.tsx          ← orquestación
   ↙      ↘
components/     features/*/components/
(shared)        (específicos del dominio)
```

## 🚀 Desarrollo local

```bash
# 1. Clonar e instalar
pnpm install

# 2. Configurar variables de entorno (ver tabla completa más abajo)
cp .env.example .env
# Editá .env con tus credenciales de Supabase y, si vas a probar billing,
# las de Polar sandbox.

# 3. Levantar Supabase local (requiere Docker + Supabase CLI)
supabase start

# 4. Correr la suite de pgTAP contra ese Supabase local
pnpm test:db

# 5. Desarrollo del cliente
pnpm dev

# 6. Probar las Vercel Functions de billing localmente (api/**)
#    vite dev NO sirve /api/*, hace falta el runtime de Vercel:
vercel dev

# 7. Preview del build
pnpm preview
```

`pnpm build` existe (`tsc -b && vite build`) pero **no se corre en local** por convención de este equipo — el build real ocurre en Vercel al deployar.

### Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo Vite con HMR (solo cliente, no sirve `api/**`) |
| `pnpm build` | TypeScript check + build de producción |
| `pnpm preview` | Preview del build local |
| `pnpm lint` | ESLint sobre todo el proyecto (incluye reglas de React Compiler) |
| `pnpm test` | Suite de Vitest (cliente `src/**` + servidor `api/**`) |
| `pnpm test:watch` | Vitest en modo watch |
| `pnpm test:db` | Suite de pgTAP (`supabase test db`) contra el Supabase local — requiere `supabase start` primero |

## 🎨 Sistema de diseño

El diseño sigue el principio **Precision Minimalist**: cada elemento en pantalla justifica su existencia.

- **Paleta**: Violeta como primary (`#7c3aed`), Zinc como neutral
- **Tipografía**: Inter (400/500/600/700)
- **Radios**: `6px` (sm), `8px` (md), `12px` (lg), `16px` (xl)
- **Sombras**: Sutiles, multi-capa (card, elevated, modal)
- **Espaciado**: Escala de 4px (`--spacing-1` a `--spacing-16`)

Los tokens viven en `src/styles/tokens.css`. No se usan librerías externas de UI — todo es CSS Modules.

## 💳 Billing

Plan Free (3 clientes / 5 proyectos) y Pro (mensual o anual, sin límites). Arquitectura hexagonal: el dominio no conoce a Polar.

- **Puerto** (`src/features/billing/ports/BillingProvider.ts`): interfaz `BillingProvider` (`ensureCustomer`, `createCheckout`, `createPortalSession`, `parseWebhook`, `fetchSubscription`) — sin imports del SDK de Polar.
- **Adaptador** (`api/_lib/polar/PolarBillingProvider.ts`, solo servidor): implementa el puerto contra `@polar-sh/sdk`. Cambiar de proveedor de pagos implicaría escribir un adaptador nuevo, no tocar el dominio ni el cliente.
- **Reducer de dominio** (`src/features/billing/domain/subscription.ts`): `applySubscriptionEvent(row, sub, now)`, función pura que decide la transición de estado (`active`/`past_due`/`canceled`/`revoked`) a partir del estado actual + el evento normalizado, rechazando entregas de webhook fuera de orden o duplicadas.
- **Entitlements**: la función `get_entitlements()` (RPC de Postgres) es la única fuente de verdad de plan/límites/uso — el cliente nunca calcula límites localmente, solo hace un pre-check optimista con `canCreate()`/`remaining()` (`src/features/billing/domain/entitlements.ts`) antes de golpear la API.
- **Límite real**: un trigger `check_plan_limit()` en Postgres (`BEFORE INSERT` en `clientes`/`proyectos`) es el enforcement de verdad — devuelve `P0001 LIMIT_EXCEEDED`, que el cliente mapea a `UpgradePrompt` (`src/services/supabaseErrors.ts`).
- **Flujo de webhook** (`api/billing/webhook.ts`): verifica firma → si ya se procesó ese evento, no-op (200) → si es más nuevo, "fetch-then-apply" (vuelve a pedirle el estado actual de la suscripción a Polar, nunca confía ciegamente en el payload) → reducer → `apply_subscription_change()` (RPC atómica en Postgres) → 200. Todo evento queda auditado en `billing_events`.
- **Checkout/portal** (`api/billing/{checkout,portal}.ts`): autenticación por Bearer token (JWT de Supabase), 403 si `VITE_BILLING_ENABLED` es `false` en el servidor, éxito redirige a la URL hospedada de Polar.
- **Feature flag**: `VITE_BILLING_ENABLED` apaga toda la superficie de billing (Sidebar, `/settings/billing`, CTAs de checkout) en el cliente Y el servidor (`checkout.ts`/`portal.ts` devuelven 403 aunque alguien pegue el endpoint directo).

## 🛡️ Seguridad

- **La contraseña** viaja directamente de React Hook Form → Supabase Auth SDK. Nunca se loguea, almacena en localStorage ni se envía a terceros.
- **Errores**: Todos los errores de API se manejan visualmente con mensajes genéricos. No hay `console.*` en producción.
- **Auth**: Sesión reactiva vía `AuthProvider` (`supabase.auth.onAuthStateChange`, montado una sola vez en la raíz de la app). Las rutas protegidas redirigen a `/login` si no hay sesión; las rutas de solo-visitante (`/login`, `/register`) redirigen a `/dashboard` si ya hay sesión.
- **Supabase**: Se usa la anon key (pública por diseño) con Row Level Security (RLS) del lado de Supabase — cada tabla tiene una policy `{table}_own` (`auth.uid() = user_id`). El service-role key (`SUPABASE_SERVICE_ROLE_KEY`) solo existe server-side, en `api/_lib/supabaseAdmin.ts`.
- **Pagos**: Polar actúa como Merchant of Record — ClientFlow nunca ve ni almacena números de tarjeta. Los webhooks se verifican por firma (`POLAR_WEBHOOK_SECRET`) antes de procesarse.

## 🧭 Rutas

### Públicas

| Ruta | Descripción |
|------|-------------|
| `/` | Landing — nunca redirige a un visitante ya autenticado, solo cambia sus CTAs |
| `/pricing` | Planes, toggle mensual/anual, CTA de checkout según estado de auth |
| `/terms`, `/privacy` | Borradores legales (con aviso visible, pendientes de revisión legal real) |
| `/login`, `/register` | Redirigen a `/dashboard` si ya hay sesión |

### Protegidas (requieren sesión)

| Ruta | Descripción |
|------|-------------|
| `/dashboard` | KPIs, estadísticas y onboarding para cuentas nuevas |
| `/clients` | CRUD de clientes |
| `/projects` | CRUD de proyectos |
| `/projects/:id` | Hub de detalle de un proyecto |
| `/tasks` | Tablero Kanban |
| `/payments` | CRUD de pagos, con selector de mes |
| `/settings/billing` | Plan actual, uso, upgrade/downgrade, portal de Polar (oculta si `VITE_BILLING_ENABLED=false`) |

### Cualquiera

| Ruta | Descripción |
|------|-------------|
| `*` | Página 404, con link de vuelta a `/` |

## 🔑 Variables de entorno

Ver `.env.example` para la plantilla completa. Las que empiezan con `VITE_` se bundlean en el cliente (nunca poner secretos ahí); el resto son server-only, leídas por `api/**` en runtime de Vercel.

| Variable | Dónde | Descripción |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | Cliente | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Cliente | Anon key pública de Supabase |
| `VITE_BILLING_ENABLED` | Cliente | Flag maestro de la superficie de billing (`true`/`false`) |
| `POLAR_SERVER` | Servidor | `sandbox` o `production` |
| `POLAR_ACCESS_TOKEN` | Servidor | Access token de la organización Polar |
| `POLAR_WEBHOOK_SECRET` | Servidor | Secreto para verificar la firma del webhook (se genera al registrar el endpoint en el dashboard de Polar) |
| `POLAR_PRODUCT_PRO_MONTHLY` | Servidor | ID del producto Pro mensual en Polar |
| `POLAR_PRODUCT_PRO_YEARLY` | Servidor | ID del producto Pro anual en Polar |
| `SUPABASE_URL` | Servidor | URL del proyecto Supabase (para el cliente service-role) |
| `SUPABASE_SERVICE_ROLE_KEY` | Servidor | Service-role key — nunca exponer al cliente |

## 🔄 CI (`.github/workflows/ci.yml`)

| Job | Cuándo corre | Qué hace |
|-----|--------------|----------|
| `quality` | Todo push/PR a `main` | `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm tsc -b` → `pnpm test` |
| `db` | Todo push/PR a `main` | `supabase start` + `supabase test db` (suite pgTAP completa) |
| `drift` | Solo push a `main`, después de `quality` | `supabase db diff --linked --schema public` contra el proyecto real — falla si hay drift entre las migraciones versionadas y la base viva |

## 🚢 Deploy

Orden obligatorio (ver `docs/DESING.md`/design del cambio `saas-conversion` para el detalle completo):

1. **Migraciones primero**: `supabase db push` de todo lo pendiente (incluye `apply_subscription_change` y el trigger de límites, que se mergean a main **deshabilitados** por seguridad).
2. **Deploy del código** a Vercel (cliente + `api/**`).
3. **Registrar el webhook** de Polar apuntando a `https://<tu-deploy>/api/billing/webhook`, copiar el secreto a `POLAR_WEBHOOK_SECRET` en Vercel, redeploy.
4. **Verificar end-to-end** en sandbox (checkout → webhook → plan Pro) antes de tocar producción.
5. **Habilitar el trigger de límites** en Postgres (estaba deshabilitado desde el paso 1 a propósito, para no romper cuentas existentes con más de 3 clientes antes de que el resto del flujo esté probado).
6. **Flip** `VITE_BILLING_ENABLED=true` en Vercel, redeploy.

### Checklist de lanzamiento (producción real)

- [ ] Organización Polar de **producción** creada (separada de la sandbox)
- [ ] Productos Pro mensual/anual creados en la org de producción, IDs actualizados en Vercel
- [ ] `POLAR_SERVER=production` en Vercel
- [ ] `POLAR_ACCESS_TOKEN` de producción generado y cargado
- [ ] Webhook de producción registrado, `POLAR_WEBHOOK_SECRET` de producción cargado
- [ ] Fecha de rotación de tokens agendada (Polar no expira tokens automáticamente — rotarlos es responsabilidad manual)
- [ ] `supabase db push` corrido contra el proyecto de producción, sin drift pendiente
- [ ] Flujos de cancelación / `past_due` / downgrade verificados manualmente en sandbox antes del switch — ver `docs/BILLING_QA.md`
