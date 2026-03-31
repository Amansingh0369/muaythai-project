# Design Document: Turborepo Monorepo Setup

## Overview

This document describes the technical design for a Turborepo-based monorepo containing two Next.js applications (`apps/web` and `apps/dashboard`) and three shared packages (`packages/ui`, `packages/utils`, `packages/config`). The monorepo uses `pnpm` workspaces, TypeScript throughout, Tailwind CSS for styling, and Turborepo's task pipeline for optimized concurrent development and caching.

The primary goals are:
- Consistent tooling and configuration across all workspaces
- Maximum code reuse via shared packages
- Fast feedback loops via Turborepo's incremental build cache
- Clean developer experience with a single command for dev and build

## Architecture

```mermaid
graph TD
  Root["Root (pnpm workspace + turbo.json)"]
  Root --> AppsWeb["apps/web (Next.js, port 3000)"]
  Root --> AppsDash["apps/dashboard (Next.js, port 3001)"]
  Root --> PkgUI["packages/ui (@repo/ui)"]
  Root --> PkgUtils["packages/utils (@repo/utils)"]
  Root --> PkgConfig["packages/config (@repo/config)"]

  AppsWeb --> PkgUI
  AppsWeb --> PkgUtils
  AppsWeb --> PkgConfig

  AppsDash --> PkgUI
  AppsDash --> PkgUtils
  AppsDash --> PkgConfig

  PkgUI --> PkgConfig
  PkgUtils --> PkgConfig
```

### Turborepo Pipeline Dependency Graph

```mermaid
graph LR
  subgraph build
    config-build["config#build"] --> ui-build["ui#build"]
    config-build --> utils-build["utils#build"]
    ui-build --> web-build["web#build"]
    ui-build --> dash-build["dashboard#build"]
    utils-build --> web-build
    utils-build --> dash-build
  end
```

The `^build` dependency declaration in `turbo.json` ensures packages are built before the apps that consume them. `dev` is declared as a persistent task and runs concurrently without caching.

## Components and Interfaces

### Root Workspace

- `package.json` — declares `workspaces: ["apps/*", "packages/*"]`, root-level scripts (`dev`, `build`, `lint`, `type-check`)
- `pnpm-workspace.yaml` — declares workspace globs
- `turbo.json` — defines the Pipeline for `build`, `dev`, `lint`, `type-check`
- `.prettierrc` — shared Prettier config
- `.eslintignore` / `.prettierignore` — excludes `node_modules`, `.next`, `dist`
- `.gitignore` — excludes `.env*`, `.turbo`, `node_modules`, `.next`, `dist`

### apps/web

- Next.js 14+ App Router application
- `tsconfig.json` extending `@repo/config/tsconfig.base.json`, path alias `@/*` → `./src/*`
- `tailwind.config.ts` with content paths for own source and `packages/ui/src`
- `src/app/globals.css` importing Tailwind layers
- `.env.example` documenting expected variables
- Imports and renders components from `@repo/ui` and functions from `@repo/utils`
- Dev server on port 3000

### apps/dashboard

- Next.js 14+ App Router application
- Same TypeScript and Tailwind setup as `apps/web`
- Dev server on port 3001
- `.env.example` documenting expected variables
- Imports and renders components from `@repo/ui` and functions from `@repo/utils`

### packages/config

- `tsconfig.base.json` — shared TypeScript compiler options (`strict: true`, `moduleResolution: bundler`, `jsx: preserve`)
- `eslint-config/index.js` — base ESLint config for Next.js + TypeScript
- `package.json` with `exports` mapping for both configs

### packages/ui

- React component library: `Button`, `Input`, `Card`
- Each component has explicit TypeScript prop interfaces
- Tailwind CSS classes used in implementations
- `package.json` with `exports` field, `react`/`react-dom` as `peerDependencies`
- `tsconfig.json` extending base config with `declaration: true`

### packages/utils

- Named utility function exports (e.g., `formatDate`, `cn` class merger)
- Explicit TypeScript parameter and return type annotations
- `package.json` with `exports` field mapping to `@repo/utils`

## Data Models

### turbo.json Pipeline Schema

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "type-check": {
      "dependsOn": ["^type-check"]
    }
  }
}
```

### pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### packages/config tsconfig.base.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  }
}
```

### packages/ui Component Interface Examples

```typescript
// Button
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

// Input
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

// Card
export interface CardProps {
  children: React.ReactNode;
  className?: string;
}
```

### packages/utils Function Signatures

```typescript
export function formatDate(date: Date, locale?: string): string;
export function cn(...classes: (string | undefined | null | false)[]): string;
```

### Environment Variable Schema (per app)

Each app's `.env.example` documents variables in the form:

```
# Public variables (exposed to browser)
NEXT_PUBLIC_API_URL=https://api.example.com

# Server-only variables
DATABASE_URL=postgresql://user:password@localhost:5432/db
```

