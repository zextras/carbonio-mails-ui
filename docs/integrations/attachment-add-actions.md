# Integration: Composer "Add Attachments" dropdown

> Part of the [carbonio-mails-ui integration system](./index.md). Read that document first for
> the general pattern, design principles, and testing guidelines.

This integration point lets any external Carbonio module add a custom entry to the email
composer's **"Add Attachments"** dropdown.

---

## Architecture

```
Bootstrap phase (before React mounts)
  carbonio-mails-ui:
    registerFunctions({ id: 'register-attachment-add-action', fn: registerAttachmentAddAction })
  ↓
External module bootstrap (carbonio-files-ui, carbonio-nextcloud, …):
    getIntegratedFunction('register-attachment-add-action')
    → registerAttachmentAddAction({ id, label, icon, onClick })
         → writes to Zustand store (useAttachmentAddActionStore)

React render phase:
  AddAttachmentsDropdown
    ├─ useRegisterFilesAttachmentAddIntegrations()   (built-in Files items)
    ├─ useAttachmentAddActionStore(...)               (all registered items)
    └─ renders dropdown items dynamically, injecting AttachmentAddActionContext at click time
```

---

## Shell function: `register-attachment-add-action`

Exposed at module-load time in `src/app-utils/register-shell-integrations.ts`.

```ts
import { getIntegratedFunction } from '@zextras/carbonio-shell-ui';

const [registerIntegration, isAvailable] =
  getIntegratedFunction('register-attachment-add-action');
if (isAvailable) {
  registerIntegration({ id, label, icon, onClick });
}
```

---

## Types

Defined in `src/types/integrations/attachment-add-action.ts`.

### `AttachmentAddActionConfig`

The object passed to the registration function.

```ts
type AttachmentAddActionConfig = {
  /**
   * Unique identifier. Convention: '<module-name>:<action>'
   * e.g. 'carbonio-nextcloud:attach'.
   * Registering the same id twice overwrites the previous entry.
   */
  id: string;

  /** Display label shown in the dropdown. Translate in the registering module. */
  label: string;

  /** Carbonio Design System icon name. */
  icon: string;

  /** Called when the user clicks this dropdown item. */
  onClick: (context: AttachmentAddActionContext) => void;
};
```

### `AttachmentAddActionContext`

Passed by the composer to the integration's `onClick` at click time.

```ts
type AttachmentAddActionContext = {
  /** The id of the active editor instance. */
  editorId: string;

  /** Returns current editor content (plain text and rich text). */
  getText: () => { plainText: string; richText: string };

  /**
   * Attach a pre-uploaded file to the email.
   * The attachmentId must be a valid server-side reference.
   */
  onAttachmentAdded: (attachment: UploadedAttachment) => void;

  /**
   * Prepend one or more links into the email body.
   * In rich text, each link is rendered as an <a> element.
   * An optional label is used as the anchor text; falls back to the URL.
   */
  onLinksInserted: (links: Array<{ url: string; label?: string }>) => void;

  /**
   * Upload browser File objects to the mail server.
   * Always resolves with the succeeded uploads only — compare result.length
   * against input.length to detect partial failures.
   */
  uploadFiles: (files: File[]) => Promise<UploadedAttachment[]>;

  /** Current total email size in bytes (body + existing attachments). */
  currentEditorSize: number;

  /** Maximum allowed email size in bytes (zimbraMtaMaxMessageSize). */
  maxAllowedSize: number;
};
```

### `UploadedAttachment`

```ts
type UploadedAttachment = {
  attachmentId: string;  // server-side attachment reference
  name: string;
  contentType: string;
  size: number;          // bytes
};
```

---

## Internal components

### Store — `src/store/attachment-add-actions/store.ts`

`Map<string, AttachmentAddActionConfig>` — preserves insertion order, O(1) lookup by id.

### Registration function — `src/integrations/attachment-add-action-functions.ts`

Validates the config (required string fields, function onClick) and delegates to the store.
This is the function exposed as `register-attachment-add-action` via the shell.

### Built-in Files hook — `src/integrations/carbonio-files-ui-attachment-add-integration.tsx`

`useRegisterFilesAttachmentAddIntegrations()` — called from `AddAttachmentsDropdown`. Registers
two built-in entries (`carbonio-files-ui:attach`, `carbonio-files-ui:link`) using React hooks
for modal and snackbar feedback. This is the reference implementation for integrations that
need React context.

### Dropdown — `src/views/app/detail-panel/edit/parts/add-attachments-dropdown.tsx`

Reads from `useAttachmentAddActionStore`, maps each config to a `DropdownItem`, and injects
`AttachmentAddActionContext` (including `uploadFiles`) at click time.

---

## Examples

### Attaching browser File objects (e.g. from a third-party storage picker)

```ts
onClick: (ctx) => {
  openPicker(async (files: File[]) => {
    const uploaded = await ctx.uploadFiles(files);
    uploaded.forEach(att => ctx.onAttachmentAdded(att));

    const failed = files.length - uploaded.length;
    createSnackbar({
      severity: failed === 0 ? 'info' : 'warning',
      label: failed === 0
        ? t('message.snackbar.all_att_added', 'Attachments added successfully')
        : t('message.snackbar.some_att_add_fails', 'Some attachments could not be added'),
    });
  });
}
```

### Inserting a public link instead of attaching

```ts
onClick: async (ctx) => {
  const file = await openMyPicker();
  if (!file) return;
  const url = await createPublicLink(file.id);
  ctx.onLinksInserted([{ url, label: file.name }]);
}
```

### Size-aware attachment with smartlink fallback

```ts
onClick: async (ctx) => {
  const files = await openMyPicker();
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  if (ctx.currentEditorSize + totalSize < ctx.maxAllowedSize) {
    const uploaded = await ctx.uploadFiles(files);
    uploaded.forEach(att => ctx.onAttachmentAdded(att));
  } else {
    const links = await Promise.all(files.map(f => createPublicLink(f.id)));
    ctx.onLinksInserted(links.map((url, i) => ({ url, label: files[i].name })));
  }
}
```

### Modules with server-side files (e.g. carbonio-files-ui)

If your module can obtain a server-side attachment reference directly, skip `uploadFiles`:

```ts
onClick: async (ctx) => {
  const [uploadTo] = getIntegratedFunction('upload-to-target-and-get-target-id');
  const { attachmentId } = await uploadTo({ nodeId, targetModule: 'MAILS' });
  ctx.onAttachmentAdded({ attachmentId, name, contentType, size });
}
```

---

## Key files

| File | Purpose |
|------|---------|
| `src/types/integrations/attachment-add-action.ts` | Public types (`AttachmentAddActionConfig`, `AttachmentAddActionContext`, `UploadedAttachment`) |
| `src/store/attachment-add-actions/store.ts` | Zustand registry |
| `src/integrations/attachment-add-action-functions.ts` | Registration function (shell-exposed) |
| `src/integrations/carbonio-files-ui-attachment-add-integration.tsx` | Built-in Files integration (reference implementation) |
| `src/app-utils/register-shell-integrations.ts` | Exposes `register-attachment-add-action` at startup |
| `src/views/app/detail-panel/edit/parts/add-attachments-dropdown.tsx` | Renders the dropdown; provides `AttachmentAddActionContext` |
