# Project Structure

## Overview

Turborepo monorepo with two apps and three shared packages.

```
/
├── apps/
│   ├── web/          # Public-facing Next.js app (port 3000)
│   └── dashboard/    # Internal dashboard Next.js app (port 3001)
├── packages/
│   ├── ui/           # Shared React component library (@repo/ui)
│   ├── utils/        # Shared utility functions (@repo/utils)
│   └── config/       # Shared configs: tsconfig, eslint (@repo/config)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Apps (`apps/*`)

Each app follows Next.js 14 App Router conventions:

```
apps/<name>/
├── src/app/
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Root page
│   └── globals.css   # Global styles
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json     # Extends @repo/config/tsconfig.base.json
└── package.json
```

## Shared Packages

### `@repo/ui` (`packages/ui`)
- React components exported from `src/index.ts`
- Components use `"use client"` directive where needed
- Styled with Tailwind CSS utility classes
- Each component exports its props interface

### `@repo/utils` (`packages/utils`)
- Pure utility functions (e.g. `formatDate`, `cn`)
- No framework dependencies

### `@repo/config` (`packages/config`)
- `tsconfig.base.json` — base TS config for all packages/apps
- `eslint-config/index.js` — shared ESLint config

## Conventions

- Internal packages are referenced as `workspace:*` dependencies
- Package names use `@repo/` scope
- New shared components go in `packages/ui/src/`, exported via `src/index.ts`
- New shared utilities go in `packages/utils/src/index.ts`
- Apps import shared code via `@repo/ui` and `@repo/utils`
- Environment variables prefixed with `NEXT_PUBLIC_` for client-side access; validate presence at startup with `console.warn`
