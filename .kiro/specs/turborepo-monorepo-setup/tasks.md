# Implementation Plan: Turborepo Monorepo Setup

## Overview

Scaffold a Turborepo monorepo with two Next.js apps (`apps/web`, `apps/dashboard`) and three shared packages (`packages/ui`, `packages/utils`, `packages/config`), wired together with pnpm workspaces, TypeScript, Tailwind CSS, and an optimized Turborepo pipeline.

## Tasks

- [x] 1. Initialize root workspace files
  - Create `package.json` with `workspaces: ["apps/*", "packages/*"]` and root scripts (`dev`, `build`, `lint`, `type-check`)
  - Create `pnpm-workspace.yaml` declaring `apps/*` and `packages/*` globs
  - Create `turbo.json` with `build` (`dependsOn: ["^build"]`, `outputs: [".next/**", "dist/**"]`), `dev` (`cache: false`, `persistent: true`), `lint`, and `type-check` tasks
  - Create `.gitignore` excluding `.env*`, `.env.local`, `.env.*.local`, `.turbo`, `node_modules`, `.next`, `dist`
  - Create `.prettierrc` with shared Prettier config
  - Create `.eslintignore` and `.prettierignore` excluding `node_modules`, `.next`, `dist`
  - _Requirements: 1.1, 1.2, 1.3, 3.3, 3.4, 7.3, 9.4, 9.5_

- [x] 2. Create `packages/config`
  - [x] 2.1 Scaffold `packages/config` package
    - Create `package.json` with name `@repo/config` and `exports` mapping for `./tsconfig.base.json` and `./eslint-config`
    - Create `tsconfig.base.json` with `strict: true`, `moduleResolution: bundler`, `jsx: preserve`, and other shared compiler options
    - Create `eslint-config/index.js` exporting a base ESLint config compatible with Next.js and TypeScript
    - _Requirements: 2.1, 3.1_

- [x] 3. Create `packages/utils`
  - [x] 3.1 Scaffold `packages/utils` package
    - Create `package.json` with name `@repo/utils`, `exports` field pointing to the entry point
    - Create `tsconfig.json` extending `@repo/config/tsconfig.base.json`
    - Implement `formatDate(date: Date, locale?: string): string` and `cn(...classes): string` as named exports with explicit TypeScript annotations
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 3.2 Write unit tests for utils functions
    - Test `formatDate` with various locales and edge cases
    - Test `cn` with undefined, null, and false values
    - _Requirements: 5.1, 5.3_

- [x] 4. Create `packages/ui`
  - [x] 4.1 Scaffold `packages/ui` package
    - Create `package.json` with name `@repo/ui`, `exports` field, and `react`/`react-dom` as `peerDependencies`
    - Create `tsconfig.json` extending `@repo/config/tsconfig.base.json` with `declaration: true`
    - _Requirements: 4.2, 4.5, 2.5_

  - [x] 4.2 Implement `Button`, `Input`, and `Card` components
    - Write each component with explicit TypeScript prop interfaces (`ButtonProps`, `InputProps`, `CardProps`)
    - Use Tailwind CSS classes in all component implementations
    - Export all three components from the package entry point
    - _Requirements: 4.1, 4.3, 4.4_

  - [ ]* 4.3 Write unit tests for UI components
    - Test rendering and prop variations for `Button`, `Input`, and `Card`
    - _Requirements: 4.1, 4.3_

- [x] 5. Create `apps/web`
  - [x] 5.1 Scaffold `apps/web` Next.js application
    - Initialize Next.js 14+ App Router project at `apps/web`
    - Create `package.json` with name `web`, adding `@repo/ui`, `@repo/utils`, and `@repo/config` as dependencies
    - Create `tsconfig.json` extending `@repo/config/tsconfig.base.json` with path alias `@/*` → `./src/*`
    - Create `tailwind.config.ts` with content paths for `./src/**/*.{ts,tsx}` and `../../packages/ui/src/**/*.{ts,tsx}`
    - Create `src/app/globals.css` importing Tailwind `base`, `components`, and `utilities` layers
    - Create `.env.example` documenting `NEXT_PUBLIC_API_URL` and `DATABASE_URL` with placeholder values
    - Configure dev server to listen on port 3000
    - _Requirements: 1.4, 2.3, 6.1, 6.4, 7.1, 7.4, 8.2_

  - [x] 5.2 Integrate shared packages in `apps/web` default page
    - Import and render at least one component from `@repo/ui` in `src/app/page.tsx`
    - Import and use at least one function from `@repo/utils` in `src/app/page.tsx`
    - Add a warning log for any missing required environment variables at startup
    - _Requirements: 4.6, 5.4, 7.5_

- [x] 6. Create `apps/dashboard`
  - [x] 6.1 Scaffold `apps/dashboard` Next.js application
    - Initialize Next.js 14+ App Router project at `apps/dashboard`
    - Create `package.json` with name `dashboard`, adding `@repo/ui`, `@repo/utils`, and `@repo/config` as dependencies
    - Create `tsconfig.json` extending `@repo/config/tsconfig.base.json` with path alias `@/*` → `./src/*`
    - Create `tailwind.config.ts` with content paths for `./src/**/*.{ts,tsx}` and `../../packages/ui/src/**/*.{ts,tsx}`
    - Create `src/app/globals.css` importing Tailwind `base`, `components`, and `utilities` layers
    - Create `.env.example` documenting expected variables with placeholder values
    - Configure dev server to listen on port 3001
    - _Requirements: 1.4, 2.4, 6.2, 6.4, 7.2, 8.3_

  - [x] 6.2 Integrate shared packages in `apps/dashboard` default page
    - Import and render at least one component from `@repo/ui` in `src/app/page.tsx`
    - Import and use at least one function from `@repo/utils` in `src/app/page.tsx`
    - Add a warning log for any missing required environment variables at startup
    - _Requirements: 4.7, 5.5, 7.5_

- [x] 7. Checkpoint — Ensure all workspaces build and type-check cleanly
  - Run `pnpm build` from the root and confirm all workspaces succeed in dependency order
  - Run `pnpm type-check` and confirm zero TypeScript errors across all workspaces
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 1.6, 2.6, 9.1, 9.2_

- [x] 8. Verify pipeline caching and concurrent dev
  - [x] 8.1 Validate Turborepo cache behavior
    - Run `pnpm build` twice with no source changes and confirm the second run restores from cache (exit 0, no re-execution)
    - _Requirements: 9.3_

  - [x] 8.2 Validate concurrent dev server configuration
    - Confirm `turbo.json` `dev` task is marked `persistent: true` and `cache: false`
    - Confirm each app's `package.json` `dev` script passes the correct port flag (`--port 3000` / `--port 3001`)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.4_

- [x] 9. Final checkpoint — Ensure all tests pass
  - Run `pnpm lint` from the root and confirm zero lint errors across all workspaces
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 3.2, 3.5_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- The `^build` dependency in `turbo.json` guarantees packages build before the apps that consume them
