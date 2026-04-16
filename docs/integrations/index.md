# Carbonio Mails UI — Integration System

This document describes the generic integration architecture used by `carbonio-mails-ui` to let
external Carbonio modules extend the mail UI without forking or directly importing internal code.

---

## Available integration points

| Integration point | Shell function ID | Document |
|-------------------|-------------------|----------|
| Composer "Add Attachments" dropdown | `register-composer-integration` | [composer-add-attachments.md](./composer-add-attachments.md) |
| Attachment hover bar "Save to …" actions | `register-attachment-save-action` | *(coming soon)* |

---

## Design principles

These apply to every integration point in this module.

- **Inversion of control** — external modules push their registrations to the mail module; the
  mail module never imports or knows about any specific external module.
- **Multiple registrations** — any number of modules can register independently; each entry is
  tracked by a unique id (last-write-wins on duplicate ids).
- **Graceful degradation** — integration points only render registered entries. If no external
  module registers, the UI falls back to built-in behaviour only.
- **No shell package changes** — the mechanism is built entirely on top of the existing
  `registerFunctions` / `getIntegratedFunction` shell API; no changes to the shell package are
  required.

---

## General pattern

Every integration point follows the same lifecycle:

```
Bootstrap phase (before React mounts)
  carbonio-mails-ui:
    registerFunctions({ id: '<integration-id>', fn: registerXxx })
  ↓
External module bootstrap:
    const [register, isAvailable] = getIntegratedFunction('<integration-id>')
    if (isAvailable) register({ id, label, icon, onClick })
        → writes to Zustand store

React render phase:
  Target component
    ├─ useRegisterBuiltInXxx()     (built-in entries, registered as a React hook)
    ├─ useXxxStore(...)            (reads all registered entries)
    └─ renders UI dynamically, injecting a Context object at interaction time
```

### Registration function

Each integration point exposes one registration function via the shell, e.g.:

```ts
import { getIntegratedFunction } from '@zextras/carbonio-shell-ui';

const [register, isAvailable] = getIntegratedFunction('<integration-id>');
if (isAvailable) {
  register({
    id: 'my-module:action',   // '<module>:<action>' convention
    label: t('...', '...'),   // translated by the registering module
    icon: 'SomeCdsIcon',
    onClick: (ctx) => { /* use ctx to interact with the UI */ }
  });
}
```

### Zustand store

Each integration point has its own Zustand store (a `Map<string, Config>` to preserve insertion
order). External modules do not interact with the store directly — they go through the shell
registration function. Built-in integrations may call `store.getState().register()` directly
from within a React hook.

### Context object

At interaction time (e.g. user click) the target component builds a **context object** and
passes it to the registered `onClick`. The context exposes everything the integration needs to
produce a result — attachment references, editor state, download URLs, upload helpers, etc. —
without the integration needing any internal imports.

---

## How to write an integration (skeleton)

```ts
import { useEffect } from 'react';
import { getIntegratedFunction, t, useIntegratedFunction } from '@zextras/carbonio-shell-ui';

const MY_PICKER = 'my-module.integrations.my-picker';

export const useRegisterMyModuleIntegration = (): void => {
  const [openPicker, isPickerAvailable] = useIntegratedFunction(MY_PICKER);

  useEffect(() => {
    if (!isPickerAvailable) return undefined;

    const [register, isRegisterAvailable] = getIntegratedFunction('<integration-id>');
    if (!isRegisterAvailable) return undefined;

    register({
      id: 'my-module:action',
      label: t('my-module.action.label', 'My Action'),
      icon: 'MyIcon',
      onClick: (ctx) => {
        // Use ctx to interact with the target UI.
        // See the integration-specific doc for the full context type.
      }
    });

    // No cleanup needed — registrations are permanent for the session.
    // If this hook may unmount (e.g. inside a conditional component),
    // return a cleanup function:
    // return () => store.getState().unregister('my-module:action');
  }, [isPickerAvailable, openPicker]);
};
```

Key rules:
- The `getIntegratedFunction` call must be **inside** `useEffect`, not at the top level of the
  hook, so it runs after the registration function is guaranteed to be available.
- `useIntegratedFunction` (reactive) watches availability and re-runs the effect when the
  dependency module mounts or unmounts.
- The `id` must be globally unique — use the `'<module>:<action>'` convention.

---

## General testing patterns

### Store unit tests

Each integration point exports a `resetXxxStore()` helper for tests.

```ts
import { useComposerIntegrationStore, resetComposerIntegrationStore }
  from 'store/composer-integrations/store';

beforeEach(() => resetComposerIntegrationStore());

it('registers an entry', () => {
  useComposerIntegrationStore.getState().register({
    id: 'test:item', label: 'Test', icon: 'StarOutline', onClick: vi.fn()
  });
  expect(useComposerIntegrationStore.getState().integrations.size).toBe(1);
});

it('overwrites duplicate ids', () => {
  const first = vi.fn();
  const second = vi.fn();
  useComposerIntegrationStore.getState().register({ id: 'x', label: '', icon: '', onClick: first });
  useComposerIntegrationStore.getState().register({ id: 'x', label: '', icon: '', onClick: second });
  expect(useComposerIntegrationStore.getState().integrations.get('x')?.onClick).toBe(second);
});

it('preserves insertion order', () => {
  ['a', 'b', 'c'].forEach((id) =>
    useComposerIntegrationStore.getState().register({ id, label: id, icon: '', onClick: vi.fn() })
  );
  expect(Array.from(useComposerIntegrationStore.getState().integrations.keys()))
    .toEqual(['a', 'b', 'c']);
});
```

### Component tests

Populate the store directly rather than mocking shell functions:

```ts
beforeEach(() => {
  useComposerIntegrationStore.getState().register({
    id: 'test:attach',
    label: 'Add from Test',
    icon: 'DriveOutline',
    onClick: vi.fn()
  });
});

afterEach(() => resetComposerIntegrationStore());
```
