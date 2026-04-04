# Tech Stack

## Build System
- **Turborepo** with task pipeline (build depends on `^build`, lint depends on `^lint`)
- **pnpm** v9 workspaces as package manager

## Frameworks & Libraries
- **Next.js** 14 (App Router) — both apps
- **React** 18
- **TypeScript** 5 (strict mode)
- **Tailwind CSS** 3
- **ESLint** + **Prettier**

## TypeScript Config
- Extends `@repo/config/tsconfig.base.json`
- `strict: true`, `moduleResolution: "bundler"`, `target: ES2017`

## Prettier Config
- Double quotes, semicolons, 2-space indent, trailing commas (es5), 100 char print width

## Common Commands

Run from repo root:

```bash
pnpm dev          # Start all apps in dev mode
pnpm build        # Build all packages and apps
pnpm lint         # Lint all packages and apps
pnpm type-check   # Type-check all packages and apps
```

Run for a specific app/package:

```bash
pnpm --filter web dev
pnpm --filter dashboard dev
pnpm --filter @repo/ui build
```
