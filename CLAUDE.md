# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Carbonio Mails UI is the mail module for the Zextras Carbonio webmail platform. It is a React-based microfrontend that runs inside the Carbonio Shell (`@zextras/carbonio-shell-ui`). It uses Emotion for styling and the Carbonio Design System (`@zextras/carbonio-design-system`) for UI components.

## Common Commands

```bash
npm install                  # Install dependencies
npm run start -- -h <host>   # Watch mode (host = Carbonio server for proxying)
npm run build                # Production build via carbonio-ui-sdk
npm run lint                 # ESLint (errors + warnings)
npm run lint-fix             # ESLint auto-fix
npm run lint-errors          # ESLint errors only (no warnings)
npm run type-check           # TypeScript type checking (tsc --noEmit)
npm run lint-check           # lint-errors + type-check combined

# Unit tests (vitest, jsdom, TZ=Europe/Rome)
npm test                              # Run all unit tests once
npx vitest run --project=unit <path>  # Run a single test file
npx vitest --project=unit <path>      # Watch mode for a single test file

# Browser tests (vitest + Playwright)
npm run browser-test                  # Watch mode with Vitest UI
```

## Architecture

### Entry Point & Shell Integration

`src/app.tsx` is the module entry point. The app registers itself with the Carbonio Shell via components in `src/app-utils/` (routes, views, actions, integrations, search). The Shell manages cross-module concerns (routing, folders, tags, settings, notifications).

### State Management

Two Zustand stores, both using `devtools` middleware:

- **Emails Store** (`src/store/emails/store.ts`): Manages conversations, messages, search results, and populated items. Built from composable slices in `src/store/emails/slices/` (conversations, messages, populated-items, search). Uses a task queue (`task-management/`) to serialize async state updates and prevent race conditions. The `sync-data-handler/` processes real-time notifications (created/modified/deleted) from the Shell.

- **Editors Store** (`src/store/editor/store.ts`): Manages mail compose editors. Editor generation/transformation logic in `editor-generators.ts` and `editor-transformations.ts`. Hooks in `src/store/editor/hooks/` (send, save-draft, attachments, etc.).

### API Layer

`src/api/` contains SOAP API wrappers using `legacySoapFetch` from `@zextras/carbonio-ui-soap-lib`. Files follow the naming convention `<action>-soap-api.ts`. The `send-msg.ts` and `save-draft-soap-api.ts` are the key compose-related APIs.

### Views Structure

- `src/views/app/folder-panel/` - Mail list views (conversations and messages)
- `src/views/app/detail-panel/` - Preview and edit panels
- `src/views/sidebar/` - Folder tree, sync data handler, folder actions
- `src/views/search/` - Search interface
- `src/views/settings/` - Mail settings (filters, signatures, certificates, etc.)

### Key Patterns

- **Normalizations** (`src/normalizations/`): Transform raw SOAP API responses into normalized internal types (conversations, messages, filters).
- **UI Actions** (`src/ui-actions/`): Action definitions for context menus, modals (move, delete, tag, etc.).
- **Hooks/Actions** (`src/hooks/actions/`): React hooks for mail operations (reply, forward, restore, etc.).
- **Types** (`src/types/`): TypeScript types organized by domain (editor, messages, conversations, soap, attachments, etc.).

### Path Aliases (tsconfig)

- `@test-mocks/*` -> `__mocks__/*`
- `@test-utils/*` -> `src/__test__/mocks/*`
- `@browser-test-utils/*` -> `src/__test__/browser/*`
- `@test-setup` -> `src/__test__/test-setup.tsx`
- Bare imports (e.g., `store/emails/store`) resolve from `src/` via `baseUrl`.

## Testing

- **Framework**: Vitest with jsdom environment (unit) and Playwright (browser)
- **Test utilities**: `@testing-library/react` + `@testing-library/user-event`
- **MSW**: `msw` for HTTP mocking (handlers in `src/__test__/mocks/network/msw/`)
- **Test setup**: `src/__test__/vitest-setup.tsx` configures MSW server, resets stores between tests
- **Generators**: `src/__test__/` contains test data generators for messages, conversations, etc.
- Test files live in `tests/` subdirectories next to the code they test (e.g., `src/api/tests/`, `src/hooks/tests/`)

## File Header

Every source file must include the SPDX license header (enforced by eslint-plugin-notice):
```ts
/*
 * SPDX-FileCopyrightText: <YEAR> Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
```

## Import Ordering

ESLint enforces import order: builtins/externals first (with `react` before other externals), then internal imports, separated by blank lines, alphabetized case-insensitively.
