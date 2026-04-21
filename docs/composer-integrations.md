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
  carbonio-mails-ui calls registerFunctions({ id: 'register-attachment-add-action', fn })
  ↓
External module bootstrap (carbonio-files-ui, carbonio-nextcloud, …)
  getIntegratedFunction('register-attachment-add-action')
  → registerAttachmentAddAction({ id, label, icon, onClick })
       → writes to Zustand store (useAttachmentAddActionStore)

React render phase
  AddAttachmentsDropdown
    ├─ useRegisterFilesAttachmentAddIntegrations()   (built-in Files items)
    ├─ useAttachmentAddActionStore(...)          (all registered items)
    └─ renders dropdown items dynamically, injecting AttachmentAddActionContext at click time
```

---

## Public API

### Shell function: `register-attachment-add-action`

Exposed at module-load time in `src/app-utils/register-shell-integrations.ts`. External modules
retrieve it via the carbonio-shell-ui function registry:

```ts
import { getIntegratedFunction } from '@zextras/carbonio-shell-ui';

const [registerIntegration, isAvailable] = getIntegratedFunction('register-attachment-add-action');
if (isAvailable) {
  registerIntegration({ id, label, icon, onClick });
}
```

---

### Types

Defined in `src/types/integrations/attachment-add-action.ts`.

#### `AttachmentAddActionConfig`

The object passed to the registration function.

```ts
type AttachmentAddActionConfig = {
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
   * Use the provided AttachmentAddActionContext to communicate results back to the composer.
   */
  onClick: (context: AttachmentAddActionContext) => void;
};
```

#### `AttachmentAddActionContext`

Passed by the composer to the integration's `onClick` handler at click time.
All interactions with the composer go through this object.

```ts
type AttachmentAddActionContext = {
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

  /**
   * Upload one or more browser File objects to the mail server attachment service.
   * Returns a promise that always resolves with the successfully uploaded files as
   * UploadedAttachment records, ready to pass to onAttachmentAdded.
   * Files that fail to upload are omitted; compare result.length against input.length
   * to detect partial failures.
   *
   * Use this when your integration delivers browser File objects (e.g. from a native
   * file picker or a third-party storage module) rather than server-side references.
   */
  uploadFiles: (files: File[]) => Promise<UploadedAttachment[]>;

  /** Current total email size in bytes (body + existing attachments). */
  currentEditorSize: number;

  /** Maximum allowed email size in bytes (mtaMaxMessageSize setting). */
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

### Zustand store — `src/store/attachment-add-actions/store.ts`

Holds the registry of all registered integrations. Uses `Map<string, AttachmentAddActionConfig>`
to preserve insertion order and allow O(1) lookup by id.

```ts
import { useAttachmentAddActionStore } from 'store/attachment-add-actions/store';

// Register imperatively (outside React, e.g. from registerAttachmentAddAction)
useAttachmentAddActionStore.getState().register(config);

// Unregister
useAttachmentAddActionStore.getState().unregister(id);

// Subscribe in a React component
const integrations = useAttachmentAddActionStore(
  (state) => Array.from(state.integrations.values())
);

// Reset all entries (tests only)
useAttachmentAddActionStore.getState().reset();
```

### Registration function — `src/integrations/attachment-add-action-functions.ts`

Validates the config and delegates to the store. This is the function exposed as
`register-attachment-add-action` via the shell.

### Built-in Files hook — `src/integrations/carbonio-files-ui-attachment-add-integration.tsx`

A React hook (`useRegisterFilesAttachmentAddIntegrations`) called from `AddAttachmentsDropdown`. It
registers the built-in carbonio-files-ui integration items using React hooks (`useModal`,
`useIntegratedFunction`, `useSnackbar`) and cleans them up on unmount.

This hook is the reference implementation for integrations that need React context (modals,
snackbars). External modules that only perform async uploads can use plain imperative code
in their `onClick` without needing a hook.

### Dropdown — `src/views/app/detail-panel/edit/parts/add-attachments-dropdown.tsx`

Reads from `useAttachmentAddActionStore` and maps each registered config to a `DropdownItem`,
injecting the `AttachmentAddActionContext` at click time. The local-file item and
original-attachments item remain hardcoded as they are internal to the composer.

The `uploadFiles` implementation is provided here: it wraps the internal upload API and resolves
once all uploads have settled, returning only the succeeded results.

---

## How to write an integration (external module)

### Attaching browser File objects (e.g. from a third-party storage picker)

The most common pattern for modules that deliver browser `File` objects: use `ctx.uploadFiles()`
to hand them to the mail server and receive back ready-to-use `UploadedAttachment` records.

```ts
import { getIntegratedFunction, t, useIntegratedFunction } from '@zextras/carbonio-shell-ui';
import { useSnackbar } from '@zextras/carbonio-design-system';
import { useEffect } from 'react';

const MY_PICKER_INTEGRATION = 'my-module.integrations.select-files';

export const useRegisterMyModuleAttachmentAddIntegration = (): void => {
  const createSnackbar = useSnackbar();
  const [openPicker, isPickerAvailable] = useIntegratedFunction(MY_PICKER_INTEGRATION);

  useEffect(() => {
    if (!isPickerAvailable) return;

    const [registerIntegration, isAvailable] =
      getIntegratedFunction('register-attachment-add-action');
    if (!isAvailable) return;

    registerIntegration({
      id: 'my-module:attach',
      label: t('composer.attachment.mymodule', 'Add from MyModule'),
      icon: 'CloudDownloadOutline',
      onClick: (ctx) => {
        openPicker(async (files: File[]) => {
          const uploaded = await ctx.uploadFiles(files);

          uploaded.forEach(att => ctx.onAttachmentAdded(att));

          const failed = files.length - uploaded.length;
          createSnackbar({
            key: 'my-module-attachment',
            severity: failed === 0 ? 'info' : 'warning',
            label: failed === 0
              ? t('message.snackbar.all_att_added', 'Attachments added successfully')
              : t('message.snackbar.some_att_add_fails', 'Some attachments could not be added'),
            autoHideTimeout: 4000,
            hideButton: true
          });
        });
      }
    });
  }, [createSnackbar, isPickerAvailable, openPicker]);
};
```

### Insert a public link instead of attaching

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

### Size-aware attachment with smartlink fallback

```ts
registerIntegration({
  id: 'my-module:smart',
  label: t('composer.attachment.mymodule_smart', 'Attach or link from MyModule'),
  icon: 'CloudOutline',
  onClick: async (ctx) => {
    const files = await openMyPicker();
    if (!files.length) return;

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    if (ctx.currentEditorSize + totalSize < ctx.maxAllowedSize) {
      // Files fit — upload and attach directly
      const uploaded = await ctx.uploadFiles(files);
      uploaded.forEach(att => ctx.onAttachmentAdded(att));
    } else {
      // Files too large — fall back to public links
      const links = await Promise.all(files.map(f => createPublicLink(f.id)));
      ctx.onLinksInserted(links.map((url, i) => ({ url, label: files[i].name })));
    }
  }
});
```

### Modules with server-side files (e.g. carbonio-files-ui)

If your module already has files on a server and can obtain a server-side attachment reference
directly (without going through the browser), skip `uploadFiles` and call `onAttachmentAdded`
directly with the reference:

```ts
onClick: async (ctx) => {
  const [uploadTo] = getIntegratedFunction('upload-to-target-and-get-target-id');
  const { attachmentId } = await uploadTo({ nodeId, targetModule: 'MAILS' });
  ctx.onAttachmentAdded({ attachmentId, name, contentType, size });
}
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
import { useAttachmentAddActionStore } from 'store/attachment-add-actions/store';

beforeEach(() => useAttachmentAddActionStore.getState().reset());

it('registers an integration', () => {
  useAttachmentAddActionStore.getState().register({
    id: 'test:item', label: 'Test', icon: 'StarOutline', onClick: vi.fn()
  });
  expect(useAttachmentAddActionStore.getState().integrations.size).toBe(1);
});

it('overwrites duplicate ids', () => {
  const first = vi.fn();
  const second = vi.fn();
  useAttachmentAddActionStore.getState().register({ id: 'x', label: '', icon: '', onClick: first });
  useAttachmentAddActionStore.getState().register({ id: 'x', label: '', icon: '', onClick: second });
  expect(useAttachmentAddActionStore.getState().integrations.get('x')?.onClick).toBe(second);
});

it('preserves insertion order', () => {
  ['a', 'b', 'c'].forEach((id) =>
    useAttachmentAddActionStore.getState().register({ id, label: id, icon: '', onClick: vi.fn() })
  );
  expect(
    Array.from(useAttachmentAddActionStore.getState().integrations.keys())
  ).toEqual(['a', 'b', 'c']);
});
```

### Dropdown component tests

Replace shell function mocks with direct store population:

```ts
import { useAttachmentAddActionStore } from 'store/attachment-add-actions/store';

beforeEach(() => {
  useAttachmentAddActionStore.getState().register({
    id: 'test:attach',
    label: 'Add from Test',
    icon: 'DriveOutline',
    onClick: vi.fn()
  });
});

afterEach(() => {
  useAttachmentAddActionStore.getState().reset();
});

it('renders the registered integration item', () => {
  render(<AddAttachmentsDropdown editorId="editor-1" />);
  userEvent.click(screen.getByRole('button', { name: /add attachments/i }));
  expect(screen.getByText('Add from Test')).toBeInTheDocument();
});

it('provides uploadFiles in the context', async () => {
  const onClick = vi.fn();
  useAttachmentAddActionStore.getState().register({
    id: 'test:upload',
    label: 'Upload Test',
    icon: 'CloudOutline',
    onClick
  });
  render(<AddAttachmentsDropdown editorId="editor-1" />);
  userEvent.click(screen.getByRole('button', { name: /add attachments/i }));
  userEvent.click(screen.getByText('Upload Test'));
  const ctx = onClick.mock.calls[0][0];
  expect(typeof ctx.uploadFiles).toBe('function');
});
```

---

## Key files

| File | Purpose |
|------|---------|
| `src/types/integrations/attachment-add-action.ts` | Public type definitions (`AttachmentAddActionConfig`, `AttachmentAddActionContext`, `UploadedAttachment`) |
| `src/store/attachment-add-actions/store.ts` | Zustand registry store |
| `src/integrations/attachment-add-action-functions.ts` | Registration function (exposed via shell) |
| `src/integrations/carbonio-files-ui-attachment-add-integration.tsx` | Built-in Files integration (React hook, reference implementation) |
| `src/app-utils/register-shell-integrations.ts` | Exposes `register-attachment-add-action` at startup |
| `src/views/app/detail-panel/edit/parts/add-attachments-dropdown.tsx` | Data-driven dropdown; provides `AttachmentAddActionContext` including `uploadFiles` |
