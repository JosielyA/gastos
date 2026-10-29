# Gastos

Aplicación web para controlar tus **ingresos y egresos** en **USD y bolívares**, con tasas de cambio **BCV** y **paralelo (Binance)**, cuentas (bancos y billeteras), deudas, lista de deseos, presupuestos y gastos recurrentes. Multi-usuario por invitación.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS + shadcn/ui** (mobile-first)
- **Supabase** (Postgres + Auth) — gratis
- **Recharts** (gráficos) · **DolarApi** (tasas de cambio)
- Despliegue: **Vercel** (gratis)

## Configuración inicial

### 1. Crear el proyecto en Supabase

1. Entra en [supabase.com](https://supabase.com) y crea un proyecto gratis.
2. Ve a **SQL Editor** y ejecuta el contenido de [`supabase/schema.sql`](supabase/schema.sql). Esto crea las tablas, políticas de seguridad (RLS) y el trigger que crea el perfil y las categorías por defecto de cada usuario.

### 2. Obtener las claves

En **Project Settings → API** copia:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (necesaria para invitar usuarios; nunca la expongas al cliente)

### 3. Crear tu usuario administrador

Como el registro es **solo por invitación**, tu primera cuenta (la de administrador) se crea así:

- Ve a **Authentication → Users → Add user** y crea tu usuario con tu correo y contraseña. El **primer usuario** registrado se convierte automáticamente en **admin** (gracias al trigger). Luego inicia sesión con ese correo.
- (Alternativa) También puedes desactivar temporalmente "Allow new users to sign up", registrarte desde la app y volver a activarlo.

### 4. Desactivar el registro público

En **Authentication → Providers** (o *Sign In / Providers*) desactiva **"Allow new users to sign up"**. Así nadie puede registrarse sin invitación.

### 5. (Opcional) Login con Google

1. En **Authentication → Providers** activa **Google**.
2. Crea credenciales OAuth en [Google Cloud Console](https://console.cloud.google.com/apis/credentials): un *OAuth client ID* de tipo **Web application**.
3. Authorized redirect URIs: `https://TU_PROYECTO.supabase.co/auth/v1/callback`.
4. Pega el Client ID y Secret en Supabase.

> Nota: con el registro deshabilitado, el login con Google solo funciona para correos que ya estén invitados/registrados.

### 6. Variables de entorno

Copia `.env.example` a `.env.local` y completa:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 7. Ejecutar en local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Despliegue en Vercel

1. Sube el proyecto a GitHub y conéctalo en [vercel.com](https://vercel.com).
2. Agrega las mismas variables de entorno en **Settings → Environment Variables**.
3. En `NEXT_PUBLIC_SITE_URL` pon la URL de producción (p. ej. `https://tu-app.vercel.app`).
4. En Supabase → **Authentication → URL Configuration**, agrega tu URL de Vercel a *Site URL* y a *Redirect URLs* (incluyendo `https://tu-app.vercel.app/auth/callback`).

## Funciones

- **Dashboard**: patrimonio en USD y Bs, tasas de cambio, resumen mensual, deudas próximas y metas.
- **Movimientos**: ingresos/egresos en USD o Bs con su equivalencia a tasa BCV y paralelo.
- **Cuentas**: bancos y billeteras (con atajos para Banesco, BNC, Provincial, Bybit, Binance y Zinli).
- **Deudas**: con o sin fecha de pago, abonos y estado.
- **Deseos**: wishlist con o sin precio, prioridad y meta de ahorro.
- **Ajustes**: categorías, presupuestos por mes, recurrentes, usuarios (admin), respaldo (exportar/importar JSON), modo oscuro.

## Estructura

```
src/
├─ app/
│  ├─ (app)/            → pantallas protegidas (dashboard, movimientos, cuentas, deudas, deseos, ajustes)
│  ├─ actions/          → Server Actions (mutaciones)
│  ├─ api/              → /api/rates, /api/export, /api/import
│  ├─ auth/callback/    → intercambio de código de Supabase (OAuth/invitación)
│  └─ login/            → inicio de sesión
├─ components/          → componentes de UI y de la app
├─ lib/                 → clientes de Supabase, auth, datos, tasas, formato
└─ proxy.ts             → renovación de sesión y protección de rutas
supabase/schema.sql     → esquema de base de datos
```
