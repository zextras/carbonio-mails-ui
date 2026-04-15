# Composer Integrations

This document describes the generic integration system that allows any Carbonio module to add
custom entries to the email composer's **"Add Attachments"** dropdown.

---

## Overview

Prior to this feature, the only supported attachment sources were hard-coded into the composer:
local files and carbonio-files-ui. The integration system inverts that dependency — carbonio-mails-ui
exposes a registration function, and any module can call it at startup to plug in its own source.

### Design principles

- **Inversion of control** — external modules push their integration to the composer; the composer
  does not import or know about any specific module.
- **Multiple registrations** — any number of modules can register independently; each entry
  appears as its own dropdown item in registration order.
- **Graceful degradation** — integrations are only shown when they have been registered. If no
  external module registers, only "Add from local" and "Add original attachments" are shown.
- **No shell changes** — the mechanism is built entirely on top of the existing
  `registerFunctions` / `getIntegratedFunction` shell API; the shell package is not modified.

---

## Architecture

```
Bootstrap phase (before React mounts)
  carbonio-mails-ui calls registerFunctions({ id: 'register-composer-integration', fn })
  ↓
External module bootstrap (carbonio-files-ui, carbonio-nextcloud, …)
  getIntegratedFunction('register-composer-integration')
  → registerComposerIntegration({ id, label, icon, onClick })
       → writes to Zustand store (useComposerIntegrationStore)

React render phase
  AddAttachmentsDropdown
    ├─ useRegisterFilesComposerIntegrations()   (built-in Files items)
    ├─ useComposerIntegrationStore(...)          (all registered items)
    └─ renders dropdown items dynamically
```

---

## Public API

### Shell function: `register-composer-integration`

Exposed at module-load time in `src/app-utils/register-shell-integrations.ts`. External modules
retrieve it via the carbonio-shell-ui function registry:

```ts
import { getIntegratedFunction } from '@zextras/carbonio-shell-ui';

const [registerIntegration, isAvailable] = getIntegratedFunction('register-composer-integration');
if (isAvailable) {
  registerIntegration({ id, label, icon, onClick });
}
```

---

### Types

Defined in `src/types/integrations/composer-integration.ts`.

#### `ComposerIntegrationConfig`

The object passed to the registration function.

```ts
type ComposerIntegrationConfig = {
  /**
   * Unique identifier. Convention: '<module-name>:<action>'
   * e.g. 'carbonio-nextcloud:attach'.
   * Registering the same id twice overwrites the previous entry.
   */
  id: string;

  /**
   * Display label shown in the dropdown.
   * The registering module is responsible for translating this string.
   */
  label: string;

  /** Carbonio Design System icon name. */
  icon: string;

  /**
   * Called when the user clicks this dropdown item.
   * Use the provided ComposerIntegrationContext to communicate results back to the composer.
   */
  onClick: (context: ComposerIntegrationContext) => void;
};
```

#### `ComposerIntegrationContext`

Passed by the composer to the integration's `onClick` handler at click time.

```ts
type ComposerIntegrationContext = {
  /** The id of the active editor instance. */
  editorId: string;

  /** Returns the current editor content (plain text and rich text). */
  getText: () => { plainText: string; richText: string };

  /**
   * Attach a pre-uploaded file to the email.
   * The file must already exist on the server (attachmentId must be valid).
   */
  onAttachmentAdded: (attachment: UploadedAttachment) => void;

  /**
   * Prepend one or more links into the email body.
   * In rich text, each link is rendered as an <a> element.
   * An optional label is used as the anchor text; falls back to the URL.
   */
  onLinksInserted: (links: Array<{ url: string; label?: string }>) => void;

  /** Current total email size in bytes (body + existing attachments). */
  currentEditorSize: number;

  /** Maximum allowed email size in bytes (zimbraMtaMaxMessageSize). */
  maxAllowedSize: number;
};
```

#### `UploadedAttachment`

```ts
type UploadedAttachment = {
  attachmentId: string;  // server-side attachment reference
  name: string;
  contentType: string;
  size: number;          // in bytes
};
```

---

## Internal components

### Zustand store — `src/store/composer-integrations/store.ts`

Holds the registry of all registered integrations. Uses `Map<string, ComposerIntegrationConfig>`
to preserve insertion order and allow O(1) lookup by id.

```ts
import { useComposerIntegrationStore } from 'store/composer-integrations/store';

// Register imperatively (outside React, e.g. from registerComposerIntegration)
useComposerIntegrationStore.getState().register(config);

// Unregister
useComposerIntegrationStore.getState().unregister(id);

// Subscribe in a React component
const integrations = useComposerIntegrationStore(
  (state) => Array.from(state.integrations.values())
);

// Reset all entries (tests only)
useComposerIntegrationStore.getState().reset();
```

### Registration function — `src/integrations/composer-integration-functions.ts`

Validates the config and delegates to the store. This is the function exposed as
`register-composer-integration` via the shell.

### Built-in Files hook — `src/integrations/carbonio-files-ui-composer-integration.tsx`

A React hook (`useRegisterFilesComposerIntegrations`) called from `AddAttachmentsDropdown`. It
registers the built-in carbonio-files-ui integration items using React hooks (`useModal`,
`useIntegratedFunction`, `useSnackbar`) and cleans them up on unmount.

This hook is the reference implementation for integrations that need React context (modals,
snackbars). External modules that only perform async uploads can use plain imperative code
in their `onClick` without needing a hook.

### Dropdown — `src/views/app/detail-panel/edit/parts/add-attachments-dropdown.tsx`

Reads from `useComposerIntegrationStore` and maps each registered config to a `DropdownItem`,
injecting the `ComposerIntegrationContext` at click time. The local-file item and
original-attachments item remain hardcoded as they are internal to the composer.

---

## How to write an integration (external module)

### Simple case — upload and attach

```ts
// In your module's register-shell-integrations.ts (or equivalent bootstrap file)
import { getIntegratedFunction, t } from '@zextras/carbonio-shell-ui';

export const registerMailsIntegrations = (): void => {
  const [registerIntegration, isAvailable] =
    getIntegratedFunction('register-composer-integration');

  if (!isAvailable) return;

  registerIntegration({
    id: 'my-module:attach',
    label: t('composer.attachment.mymodule', 'Add from MyModule'),
    icon: 'CloudOutline',
    onClick: async (ctx) => {
      // 1. Open your file picker (your own UI, not the composer's)
      const file = await openMyPicker();
      if (!file) return;

      // 2. Upload the file to the mail server
      const { attachmentId } = await uploadToMailServer(file);

      // 3. Tell the composer to attach it
      ctx.onAttachmentAdded({
        attachmentId,
        name: file.name,
        contentType: file.type,
        size: file.size
      });
    }
  });
};
```

### Insert a public link instead

```ts
registerIntegration({
  id: 'my-module:link',
  label: t('composer.attachment.mymodule_link', 'Share link from MyModule'),
  icon: 'Link2',
  onClick: async (ctx) => {
    const file = await openMyPicker();
    if (!file) return;

    const url = await createPublicLink(file.id);

    ctx.onLinksInserted([{ url, label: file.name }]);
  }
});
```

### Size-aware attachment with fallback

```ts
registerIntegration({
  id: 'my-module:smart',
  label: t('composer.attachment.mymodule_smart', 'Attach or link from MyModule'),
  icon: 'CloudOutline',
  onClick: async (ctx) => {
    const file = await openMyPicker();
    if (!file) return;

    if (ctx.currentEditorSize + file.size < ctx.maxAllowedSize) {
      // Attach directly
      const { attachmentId } = await uploadToMailServer(file);
      ctx.onAttachmentAdded({ attachmentId, name: file.name, contentType: file.type, size: file.size });
    } else {
      // Fall back to a public link
      const url = await createPublicLink(file.id);
      ctx.onLinksInserted([{ url, label: file.name }]);
    }
  }
});
```

### Multiple registrations from one module

A single module can register as many items as it needs — each with a unique id:

```ts
registerIntegration({ id: 'my-module:attach', label: '...', icon: '...', onClick: ... });
registerIntegration({ id: 'my-module:link',   label: '...', icon: '...', onClick: ... });
```

---

## Testing

### Store unit tests

```ts
import { useComposerIntegrationStore } from 'store/composer-integrations/store';

beforeEach(() => useComposerIntegrationStore.getState().reset());

it('registers an integration', () => {
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
  expect(
    Array.from(useComposerIntegrationStore.getState().integrations.keys())
  ).toEqual(['a', 'b', 'c']);
});
```

### Dropdown component tests

Replace shell function mocks with direct store population:

```ts
import { useComposerIntegrationStore } from 'store/composer-integrations/store';

beforeEach(() => {
  useComposerIntegrationStore.getState().register({
    id: 'test:attach',
    label: 'Add from Test',
    icon: 'DriveOutline',
    onClick: vi.fn()
  });
});

afterEach(() => {
  useComposerIntegrationStore.getState().reset();
});

it('renders the registered integration item', () => {
  render(<AddAttachmentsDropdown editorId="editor-1" />);
  // open the dropdown
  userEvent.click(screen.getByRole('button', { name: /add attachments/i }));
  expect(screen.getByText('Add from Test')).toBeInTheDocument();
});
```

---

## Key files

| File | Purpose |
|------|---------|
| `src/types/integrations/composer-integration.ts` | Public type definitions |
| `src/store/composer-integrations/store.ts` | Zustand registry store |
| `src/integrations/composer-integration-functions.ts` | Registration function (exposed via shell) |
| `src/integrations/carbonio-files-ui-composer-integration.tsx` | Built-in Files integration (React hook) |
| `src/app-utils/register-shell-integrations.ts` | Exposes `register-composer-integration` at startup |
| `src/views/app/detail-panel/edit/parts/add-attachments-dropdown.tsx` | Data-driven dropdown rendering |
