# Requirements Document

## Introduction

A scalable Turborepo monorepo for a freelance project containing two Next.js applications (public client website and admin dashboard) and three shared packages (UI components, utility functions, and shared configs). The monorepo uses TypeScript throughout, Tailwind CSS for styling, and is optimized for concurrent development, code sharing, and long-term maintainability.

## Glossary

- **Monorepo**: A single repository containing multiple related packages and applications
- **Turborepo**: A high-performance build system for JavaScript/TypeScript monorepos
- **Workspace**: An individual package or application within the monorepo
- **Web_App**: The Next.js public-facing client website located at `apps/web`
- **Dashboard_App**: The Next.js admin dashboard located at `apps/dashboard`
- **UI_Package**: The shared React component library located at `packages/ui`
- **Utils_Package**: The shared utility functions library located at `packages/utils`
- **Config_Package**: The shared ESLint and TypeScript configuration package located at `packages/config`
- **Pipeline**: Turborepo task dependency graph defined in `turbo.json`
- **Path_Alias**: TypeScript path mapping that allows importing modules using short identifiers (e.g., `@repo/ui`)
- **Environment_Variable**: A runtime configuration value scoped to a specific application

---

## Requirements

### Requirement 1: Monorepo Initialization and Structure

**User Story:** As a developer, I want a clean Turborepo monorepo scaffold, so that all apps and packages are organized consistently and the build system is properly configured.

#### Acceptance Criteria

1. THE Monorepo SHALL contain a root `package.json` with workspaces configured to include `apps/*` and `packages/*`
2. THE Monorepo SHALL contain a `turbo.json` at the root defining the Pipeline for `build`, `dev`, `lint`, and `type-check` tasks
3. THE Monorepo SHALL use `pnpm` as the package manager with a `pnpm-workspace.yaml` file declaring all workspace globs
4. THE Monorepo SHALL contain exactly two applications: `apps/web` and `apps/dashboard`
5. THE Monorepo SHALL contain exactly three packages: `packages/ui`, `packages/utils`, and `packages/config`
6. WHEN a developer runs the root-level `dev` script, THE Turborepo SHALL execute the `dev` task concurrently across all workspaces that define it

---

### Requirement 2: TypeScript Configuration

**User Story:** As a developer, I want TypeScript configured consistently across all workspaces, so that type safety is enforced everywhere and path aliases resolve correctly.

#### Acceptance Criteria

1. THE Config_Package SHALL export a base `tsconfig.base.json` containing shared compiler options including `strict: true`, `moduleResolution: bundler`, and `jsx: preserve`
2. WHEN a workspace extends the base config, THE workspace `tsconfig.json` SHALL reference `@repo/config/tsconfig.base.json` via the `extends` field
3. THE Web_App SHALL define a `tsconfig.json` that extends the base config and declares a Path_Alias `@/*` mapping to `./src/*`
4. THE Dashboard_App SHALL define a `tsconfig.json` that extends the base config and declares a Path_Alias `@/*` mapping to `./src/*`
5. THE UI_Package SHALL define a `tsconfig.json` that extends the base config and sets `declaration: true` to emit type definitions
6. IF a TypeScript compilation error exists in any workspace, THEN THE `type-check` Pipeline task SHALL exit with a non-zero code and report the error

---

### Requirement 3: ESLint and Formatting Configuration

**User Story:** As a developer, I want shared linting and formatting rules, so that code style is consistent across all workspaces without duplicating configuration.

#### Acceptance Criteria

1. THE Config_Package SHALL export a base ESLint configuration compatible with Next.js and TypeScript projects
2. WHEN a workspace runs its `lint` script, THE ESLint SHALL apply the shared rules from Config_Package
3. THE Monorepo SHALL include a root-level Prettier configuration file (`.prettierrc`) that applies to all workspaces
4. THE Monorepo SHALL include a root-level `.eslintignore` and `.prettierignore` excluding `node_modules`, `.next`, and `dist` directories
5. IF a linting error is detected in any workspace, THEN THE `lint` Pipeline task SHALL exit with a non-zero code and report the file and line number

---

### Requirement 4: Shared UI Package

**User Story:** As a developer, I want a shared UI component library, so that both apps can consume identical, styled components without duplicating code.

#### Acceptance Criteria

1. THE UI_Package SHALL export at minimum three components: `Button`, `Input`, and `Card`
2. THE UI_Package `package.json` SHALL declare an `exports` field mapping the package entry point so consuming workspaces can import via `@repo/ui`
3. WHEN a component is imported from `@repo/ui`, THE component SHALL be typed with explicit TypeScript prop interfaces
4. THE UI_Package SHALL include Tailwind CSS class usage within component implementations
5. THE UI_Package `package.json` SHALL list `react` and `react-dom` as `peerDependencies` to avoid duplicate React instances
6. THE Web_App SHALL import and render at least one component from `@repo/ui` in its default page
7. THE Dashboard_App SHALL import and render at least one component from `@repo/ui` in its default page

---

### Requirement 5: Shared Utils Package

**User Story:** As a developer, I want a shared utilities library, so that common helper functions are written once and reused across all apps.

#### Acceptance Criteria

1. THE Utils_Package SHALL export at minimum two utility functions as named exports
2. THE Utils_Package `package.json` SHALL declare an `exports` field so consuming workspaces can import via `@repo/utils`
3. WHEN a utility function is exported from Utils_Package, THE function SHALL have explicit TypeScript parameter and return type annotations
4. THE Web_App SHALL import and use at least one function from `@repo/utils`
5. THE Dashboard_App SHALL import and use at least one function from `@repo/utils`

---

### Requirement 6: Tailwind CSS Configuration

**User Story:** As a developer, I want Tailwind CSS configured for both apps with shared content paths, so that utility classes work correctly and unused styles are purged in production.

#### Acceptance Criteria

1. THE Web_App SHALL include a `tailwind.config.ts` that specifies content paths covering `./src/**/*.{ts,tsx}` and the UI_Package source files
2. THE Dashboard_App SHALL include a `tailwind.config.ts` that specifies content paths covering `./src/**/*.{ts,tsx}` and the UI_Package source files
3. WHEN Tailwind CSS processes a build, THE build output SHALL only include CSS classes referenced in the content paths
4. THE Web_App and Dashboard_App SHALL each include a global CSS file that imports Tailwind's `base`, `components`, and `utilities` layers

---

### Requirement 7: Environment Variable Handling

**User Story:** As a developer, I want per-app environment variable files, so that each application can have its own runtime configuration without leaking values between apps.

#### Acceptance Criteria

1. THE Web_App SHALL include a `.env.example` file documenting all expected environment variables with placeholder values
2. THE Dashboard_App SHALL include a `.env.example` file documenting all expected environment variables with placeholder values
3. THE Monorepo root `.gitignore` SHALL exclude `.env`, `.env.local`, `.env.*.local` files from version control
4. WHEN the Web_App reads an environment variable prefixed with `NEXT_PUBLIC_`, THE Next.js runtime SHALL expose it to the browser bundle
5. IF a required environment variable is absent at build time, THEN THE Web_App or Dashboard_App SHALL log a descriptive warning identifying the missing variable name

---

### Requirement 8: Concurrent Development Server

**User Story:** As a developer, I want both apps to run simultaneously with a single command, so that I can develop and test cross-app interactions without managing multiple terminals.

#### Acceptance Criteria

1. WHEN a developer runs `pnpm dev` from the monorepo root, THE Turborepo SHALL start the `dev` task in Web_App and Dashboard_App concurrently
2. THE Web_App dev server SHALL listen on port `3000` by default
3. THE Dashboard_App dev server SHALL listen on port `3001` by default
4. WHILE both dev servers are running, THE Turborepo SHALL prefix each app's log output with its workspace name for identification
5. IF one app's dev server exits with an error, THEN THE Turborepo SHALL report the failure without terminating the other running dev server

---

### Requirement 9: Build Pipeline Optimization

**User Story:** As a developer, I want Turborepo's caching and dependency-aware pipeline, so that only changed workspaces are rebuilt and build times are minimized.

#### Acceptance Criteria

1. THE Pipeline SHALL declare that the `build` task in Web_App and Dashboard_App depends on the `build` task of all local package dependencies (`^build`)
2. THE Pipeline SHALL declare `build` outputs as `.next/**` and `dist/**` so Turborepo can cache and restore them
3. WHEN no source files have changed since the last build, THE Turborepo SHALL restore the cached build output and skip re-execution
4. THE Pipeline SHALL declare `dev` as a persistent task so Turborepo does not attempt to cache its output
5. THE Monorepo root `.gitignore` SHALL exclude the `.turbo` cache directory from version control
