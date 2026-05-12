
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

## ✨ Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| **Auth** | Login/Register con Supabase Auth, rutas protegidas y redirect automático |
| **Dashboard** | KPIs de ingresos, proyectos activos, tareas pendientes y estadísticas mensuales |
| **Clientes** | CRUD completo con estados (activo/pendiente/inactivo), vista de detalle y KPIs |
| **Proyectos** | CRUD con asignación a clientes, presupuesto, fechas y estados (activo/pausado/completado) |
| **Tareas** | Tablero Kanban con 3 columnas (pendiente/en progreso/hechas), prioridades y fechas límite |
| **Pagos** | CRUD de facturas con montos, métodos de pago, estados y proyección de cobros |

## 🧱 Stack

| Capa | Tecnología |
|------|-----------|
| **Framework** | React 19 con TypeScript 6 |
| **Build** | Vite 8 + Rolldown |
| **Routing** | React Router DOM v7 |
| **Forms** | React Hook Form |
| **Backend** | Supabase (Auth + PostgreSQL) |
| **Íconos** | Lucide React |
| **Estilos** | CSS Modules + Design Tokens |

## 📁 Estructura del proyecto

```
src/
├── components/
│   ├── auth/            # ProtectedRoute, PublicOnlyRoute
│   ├── layout/          # Layout, Navbar, Sidebar
│   ├── shared/          # ErrorBoundary, Loader, Modal, PageHeader, StatCard
│   └── ui/              # Componentes base reutilizables
├── features/
│   ├── auth/            # types, services, hooks (signIn/signUp)
│   ├── clients/         # types, services, hooks, components (form, card)
│   ├── payments/        # types, services, hooks, components (form, row, view)
│   ├── projects/        # types, services, hooks, components (form, card)
│   └── tasks/           # types, services, hooks, components (form, card, column)
├── pages/
│   ├── auth/            # Login, Register
│   ├── clients/         # ClientsPage
│   ├── dashboard/       # DashboardPage
│   ├── not-found/       # NotFoundPage (404)
│   ├── payments/        # PaymentsPage
│   ├── projects/        # ProjectsPage
│   └── tasks/           # TaskPage (Kanban)
├── router/              # AppRouter (definición de rutas)
├── services/            # Cliente de Supabase
└── styles/              # tokens.css, global.css
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

## 🚀 Arranque rápido

```bash
# 1. Clonar e instalar
pnpm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editá .env con tus credenciales de Supabase:
#   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
#   VITE_SUPABASE_ANON_KEY=tu-anon-key

# 3. Desarrollo
pnpm dev

# 4. Build
pnpm build

# 5. Preview del build
pnpm preview
```

### Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo con HMR |
| `pnpm build` | TypeScript check + build de producción |
| `pnpm preview` | Preview del build local |
| `pnpm lint` | ESLint sobre todo el proyecto |

## 🎨 Sistema de diseño

El diseño sigue el principio **Precision Minimalist**: cada elemento en pantalla justifica su existencia.

- **Paleta**: Violeta como primary (`#7c3aed`), Zinc como neutral
- **Tipografía**: Inter (400/500/600/700)
- **Radios**: `6px` (sm), `8px` (md), `12px` (lg), `16px` (xl)
- **Sombras**: Sutiles, multi-capa (card, elevated, modal)
- **Espaciado**: Escala de 4px (`--spacing-1` a `--spacing-16`)

Los tokens viven en `src/styles/tokens.css`. No se usan librerías externas de UI — todo es CSS Modules.

## 🛡️ Seguridad

- **La contraseña** viaja directamente de React Hook Form → Supabase Auth SDK. Nunca se loguea, almacena en localStorage ni se envía a terceros.
- **Errores**: Todos los errores de API se manejan visualmente con mensajes genéricos. No hay `console.*` en producción.
- **Auth**: Las rutas protegidas redirigen a login si no hay sesión. Las rutas públicas redirigen al dashboard si ya hay sesión.
- **Supabase**: Se usa la anon key (pública por diseño) con Row Level Security (RLS) del lado de Supabase.

## 🧭 Rutas

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Login |
| `/register` | Público | Registro |
| `/dashboard` | Protegido | KPIs y estadísticas |
| `/clients` | Protegido | CRUD de clientes |
| `/projects` | Protegido | CRUD de proyectos |
| `/tasks` | Protegido | Tablero Kanban |
| `/payments` | Protegido | CRUD de pagos |
| `*` | Cualquiera | Página 404 |
