# Aveiq

Aveiq is an elite talent network that connects the top 0.1% of India's AI and full-stack engineers with ambitious startups. Every engineer is screened on real shipped work, technical depth, and ownership — and matched to companies in under 72 hours.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [TanStack Start v1](https://tanstack.com/start) (React 19 + SSR/SSG) |
| Build Tool | [Vite 7](https://vitejs.dev) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Language | TypeScript 5.8 (strict mode) |
| Package Manager | [Bun](https://bun.sh) |
| Backend | Lovable Cloud (Supabase) — Auth, Postgres, Realtime |
| UI Components | Radix UI primitives + custom shadcn-style components |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | Lucide React |

---

## Prerequisites

- [Bun](https://bun.sh/docs/installation) >= 1.0 (recommended — project uses `bun.lock`)
- Git
- A Lovable Cloud project (backend is pre-configured; see [Environment Variables](#environment-variables))

> If you prefer Node.js, you can use `npm` instead of `bun`, but Bun is the project's default package manager.

---

## Local Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd <project-folder>
```

### 2. Install dependencies

```bash
bun install
```

> Or: `npm install` if you're using Node.js.

### 3. Configure environment variables

The project uses a `.env` file for both client-side (`VITE_*`) and server-side (`SUPABASE_*`) configuration.

Create a `.env` file in the project root and add the following variables (replace with your own Lovable Cloud / Supabase credentials if you're forking the project):

```dotenv
# Supabase / Lovable Cloud credentials (server-side)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-anon-key"

# Supabase / Lovable Cloud credentials (client-side, exposed to browser)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_PROJECT_ID="your-project-id"
```

> **Note:** The `.env` file in this repo is pre-configured for the connected Lovable Cloud project. If you're working from a Lovable-managed preview, these values are already injected automatically.

### 4. Run the development server

```bash
bun run dev
```

The app will be available at `http://localhost:3001` (or whatever port Vite assigns — check your terminal output).

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev | `bun run dev` | Start the Vite dev server with HMR and SSR |
| Build (production) | `bun run build` | Create an optimized production build |
| Build (development) | `bun run build:dev` | Create a development-mode build |
| Preview | `bun run preview` | Preview the production build locally |
| Lint | `bun run lint` | Run ESLint across the codebase |
| Format | `bun run format` | Auto-format code with Prettier |

---

## Project Structure

```
├── src/
│   ├── routes/               # File-based routes (TanStack Router)
│   │   ├── index.tsx         # Homepage / landing page
│   │   ├── login.tsx         # Auth login page
│   │   ├── signup.tsx        # Auth signup page
│   │   ├── _authenticated/   # Protected routes (requires login)
│   │   │   ├── dashboard.tsx
│   │   │   ├── apply.tsx
│   │   │   ├── hire.tsx
│   │   │   ├── interview.tsx
│   │   │   ├── jobs.$jobId.tsx
│   │   │   ├── roles.tsx
│   │   │   └── ...
│   │   ├── blog.tsx          # Public content pages
│   │   ├── careers.tsx
│   │   ├── enterprise.tsx
│   │   ├── security.tsx
│   │   └── ...
│   ├── components/           # Reusable React components
│   ├── lib/                  # Utilities, server functions, business logic
│   │   └── *.functions.ts    # TanStack server functions (RPC)
│   ├── integrations/         # Third-party integrations (Supabase clients, auth middleware)
│   ├── hooks/                # Custom React hooks
│   ├── assets/               # Static assets (images, fonts)
│   ├── router.tsx            # Router configuration
│   ├── server.ts             # SSR entry wrapper (Cloudflare Worker compatible)
│   ├── start.ts              # TanStack Start instance + middleware
│   └── styles.css            # Global styles + Tailwind CSS v4 theme tokens
├── supabase/                 # Supabase config (config.toml)
├── .env                      # Environment variables
├── vite.config.ts            # Vite configuration (via @lovable.dev/vite-tanstack-config)
├── tsconfig.json             # TypeScript configuration
├── bunfig.toml               # Bun configuration
└── package.json
```

---

## Authentication

The app uses **Supabase Auth** (via Lovable Cloud) with:

- Email/password sign-up and login
- **Google OAuth** social login
- Email verification required before first sign-in (no auto-confirm)
- Row-Level Security (RLS) on all database tables

Auth state is managed via the Supabase browser client at `src/integrations/supabase/client.ts`.

Protected routes live under `src/routes/_authenticated/` and redirect unauthenticated users to `/login`.

---

## Backend & Database

This project is connected to **Lovable Cloud**, which provides:

- **PostgreSQL** database with RLS policies
- **Authentication** system (sign-up, login, OAuth, sessions)
- **Realtime** subscriptions (optional, for live data)
- **File Storage** (if enabled)

### Server Functions

Server-side logic is written as **TanStack server functions** (`createServerFn`) in `src/lib/*.functions.ts`. These are typed RPC calls that run on the server and can access:

- Authenticated Supabase client (via `requireSupabaseAuth` middleware)
- Admin Supabase client (via `supabaseAdmin` — bypasses RLS, server-only)
- Environment variables via `process.env.*`

### Key Middleware

- `attachSupabaseAuth` — automatically attaches the user's bearer token to every server function call
- `requireSupabaseAuth` — rejects unauthenticated requests with a 401

---

## How to Test

Currently, the project does **not** have an automated test suite configured. Quality is ensured via:

1. **Type checking** — TypeScript runs in `strict` mode. Run `bun run build` or `bun run build:dev` to catch type errors.
2. **Linting** — `bun run lint` runs ESLint with TypeScript, React Hooks, and Prettier rules.
3. **Code formatting** — `bun run format` enforces consistent style.

### Adding Tests (optional)

If you'd like to add unit or integration tests, install a test framework:

```bash
# Example: Vitest + React Testing Library
bun add -d vitest @testing-library/react @testing-library/jest-dom jsdom
```

Then add a `test` script to `package.json` and create test files alongside your components or in a `__tests__/` directory.

---

## Deployment

This app is built for deployment on **Lovable's managed platform** (Cloudflare Workers under the hood).

### Preview (local)
```bash
bun run build
bun run preview
```

### Production
Publishing is handled through the Lovable editor:
1. Make sure all changes are saved and the build passes (`bun run build`)
2. Use the **Publish** button in the Lovable interface to deploy to production

The production build is a static + edge SSR bundle compatible with Cloudflare Workers.

---

## Troubleshooting

### `Cannot find module '@/*'` or similar import errors

This is usually a stale TypeScript module resolution cache after renaming files. Restart the dev server:

```bash
# Kill the dev server, then:
bun run dev
```

### `Unauthorized` or 401 errors on server functions

Ensure `attachSupabaseAuth` is registered in `src/start.ts` inside `functionMiddleware`. Also verify the user is signed in and their session hasn't expired.

### Build fails with `window is not defined`

A client-only module is being imported at module scope in a shared file. Move the import inside a client-only function, or rename the file to `*.client.ts`.

### Environment variables are undefined in client code

Only `VITE_*` prefixed variables are exposed to the browser. Server-side variables (like `SUPABASE_SERVICE_ROLE_KEY`) must be read inside a `createServerFn` `.handler()` — never at module scope in shared files.

---

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run `bun run lint` and `bun run build` to verify everything compiles
4. Open a pull request

---

## License

Private — All rights reserved.
