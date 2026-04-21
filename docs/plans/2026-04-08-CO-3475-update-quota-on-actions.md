# CO-3475: Update quota data after quota-impacting actions

**Date:** 2026-04-08
**Status:** Approved
**Author:** Luca Stauble + Claude
**Jira Issue:** [CO-3475](https://zextras.atlassian.net/browse/CO-3475)

## Context

As a user, I want quota information updated right after any action that impacts my quota (send email, save draft, permanently delete messages, delete attachments). Currently, quota data is only refreshed via the Shell's periodic polling (NoOp), so changes are not reflected immediately after these actions.

Quota is managed by the Shell (`useAccountStore.usedQuota`). The storages module registers an integrated function `storages-refresh-quota` that can be called to refresh the quota. The mails-ui module needs to signal when a quota-impacting action occurs.

Move and trash actions do NOT impact quota since they only move messages between existing folders.

## Decision

Use the existing event-bus pattern to dispatch a custom event after quota-impacting actions, with a centralized listener that calls the `storages-refresh-quota` integrated function.

This approach was chosen because:

- It follows the existing event-bus architecture (`DraftTrashedEvent` pattern)
- It keeps a clean module boundary by delegating actual quota refresh to the storages module
- It's centralized and extensible — new actions only need to dispatch the event
- No extra SOAP calls from mails-ui

## Implementation Steps

### 1. Create the event class

**File:** `src/event-bus/events/quota-changed.ts`

- Create `QuotaChangedEvent` class extending `CustomEvent` with no payload
- Static `EventName = 'carbonio:mails:eventbus:quota-changed'`
- Follow the exact pattern of `DraftTrashedEvent`

### 2. Register the event in the event-bus types

**File:** `src/event-bus/types.ts`

- Import `QuotaChangedEvent`
- Add `[QuotaChangedEvent.EventName]: QuotaChangedEvent` to `EventsBusEventsMap`

### 3. Create a plain (non-hook) publish utility

**File:** `src/event-bus/publish-event.ts`

- Create `publishEvent(event: EventsBusEvents): void` — a plain function that calls `window.dispatchEvent(new CustomEvent(event.type, { detail: event.detail }))`
- This mirrors `useEventPublish` but is callable from non-React code (action files)

### 4. Dispatch `QuotaChangedEvent` from quota-impacting actions

**Quota-impacting actions:**

- **`src/api/send-msg.ts`** — call `publishEvent(new QuotaChangedEvent())` after the successful response handling (after `getMessageEmailStoreAction` / `getConvEmailStoreAction` calls, before the return)

- **`src/store/emails/actions/save-draft-action.ts`** — call `publishEvent(new QuotaChangedEvent())` after successful draft save and store update

- **`src/store/emails/actions/msg-action-action.ts`** — call `publishEvent(new QuotaChangedEvent())` only when `operation === 'delete'` (permanent delete), after the SOAP call succeeds

- **`src/store/emails/actions/conv-action-action.ts`** — call `publishEvent(new QuotaChangedEvent())` only when `operation === 'delete'` (permanent delete), after the SOAP call succeeds and store is updated

- **`src/store/emails/actions/delete-attachments-action.ts`** — call `publishEvent(new QuotaChangedEvent())` after successful attachment deletion and store update

**NOT dispatched for:** move, trash, flag, read/unread, tag, spam (these do not change quota)

### 5. Create the listener component

**File:** `src/views/sidebar/quota-refresh-handler.tsx`

- React component that renders `null`
- Uses `useEventSubscribe` to listen for `QuotaChangedEvent.EventName`
- On event, calls `getIntegratedFunction('storages-refresh-quota')` and invokes the returned function if available
- Handles the case where the function is not registered (graceful degradation)

### 6. Mount the listener in the app

**File:** `src/app.tsx`

- Import and render `<QuotaRefreshHandler />` alongside the other initialization components inside `<AuthGuard>`

### 7. Tests

- **`src/event-bus/events/tests/quota-changed.test.ts`** — test that `QuotaChangedEvent` creates a properly typed CustomEvent with the correct event name
- **`src/event-bus/tests/publish-event.test.ts`** — test that `publishEvent` dispatches events on `window`
- **Action tests** — for each action file, verify that `QuotaChangedEvent` is dispatched after success (and for msg/conv actions, only when `operation === 'delete'`)
- **`src/views/sidebar/tests/quota-refresh-handler.test.tsx`** — test that the component calls `storages-refresh-quota` when a `QuotaChangedEvent` is received, and handles unavailability gracefully

## Alternatives Considered

### Direct SOAP call (NoOp) after actions

After each action, call `legacySoapFetch('NoOp')` to trigger a quota refresh via the SOAP response header. Rejected because it adds unnecessary network calls from mails-ui and couples the module to the SOAP quota extraction mechanism.

### Direct `dispatchUserQuotaChangeEvent` from soap-lib

Call `dispatchUserQuotaChangeEvent(quota)` from `@zextras/carbonio-ui-soap-lib` directly after actions. Rejected because it requires knowing the actual quota number, which would need a separate SOAP call to obtain.

### Direct function call in actions (no event bus)

Call a `refreshQuota()` utility directly in each action. Rejected because it tightly couples each action to the refresh mechanism and is harder to maintain when adding new actions.
