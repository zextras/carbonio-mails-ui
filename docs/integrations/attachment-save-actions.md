# Integration: Attachment hover bar "Save to …" actions

> Part of the [carbonio-mails-ui integration system](./index.md). Read that document first for
> the general pattern, design principles, and testing guidelines.

This integration point lets any external Carbonio module add a custom entry to the attachment
hover bar's **"Save to …"** action — displayed as a direct icon button (one action registered)
or a dropdown (two or more actions registered).

---

## Architecture

```
Bootstrap phase (before React mounts)
  carbonio-mails-ui:
    registerFunctions({ id: 'register-attachment-save-action', fn: registerAttachmentSaveAction })
  ↓
External module bootstrap (carbonio-files-ui, carbonio-nextcloud, …):
    getIntegratedFunction('register-attachment-save-action')
    → registerAttachmentSaveAction({ id, label, icon, onClick })
         → writes to Zustand store (useAttachmentSaveActionStore)

React render phase:
  AttachmentsBlock
    ├─ useRegisterFilesAttachmentSaveIntegration()   (built-in Files action)
    ├─ useAttachmentSaveActionStore(...)              (all registered actions)
    └─ renders direct button (1 action) or Dropdown (2+ actions)
```

---

## Shell function: `register-attachment-save-action`

Exposed at module-load time in `src/app-utils/register-shell-integrations.ts`.

```ts
import { getIntegratedFunction } from '@zextras/carbonio-shell-ui';

const [registerAction, isAvailable] =
  getIntegratedFunction('register-attachment-save-action');
if (isAvailable) {
  registerAction({ id, label, icon, onClick });
}
```

---

## Types

Defined in `src/types/integrations/attachment-save-action.ts`.

### `AttachmentSaveActionConfig`

The object passed to the registration function.

```ts
type AttachmentSaveActionConfig = {
  /**
   * Unique identifier. Convention: '<module-name>:<action>'
   * e.g. 'carbonio-nextcloud:save'.
   * Registering the same id twice overwrites the previous entry.
   */
  id: string;

  /**
   * Display label — shown as a tooltip (single action) or as dropdown item text.
   * Translate in the registering module.
   */
  label: string;

  /** Carbonio Design System icon name. */
  icon: string;

  /** Called when the user clicks this save action. */
  onClick: (context: AttachmentSaveActionContext) => void;
};
```

### `AttachmentSaveActionContext`

Passed by the attachments component to the integration's `onClick` at click time.

```ts
type AttachmentSaveActionContext = {
  /** The id of the mail message containing this attachment. */
  messageId: string;

  /**
   * The MIME part name (att.name).
   * Used for server-side operations such as the CopyToFiles SOAP call.
   */
  partName: string;

  /** Display filename of the attachment. */
  filename: string;

  /** MIME content type of the attachment. */
  contentType: string;

  /** Attachment size in bytes. */
  size: number;

  /**
   * Authenticated download URL.
   * Useful if you need to hand a URL to an external system rather than
   * downloading the bytes in the browser.
   */
  downloadUrl: string;

  /**
   * Downloads the attachment from the mail server and returns it as a browser
   * File object. Use this when your integration needs to upload the bytes to a
   * third-party storage service (e.g. Nextcloud, S3).
   *
   * Backed by `downloadAttachmentAsFile` — a plain `fetch` with
   * `credentials: 'include'` against the authenticated mail server URL.
   *
   * Rejects on network failure.
   */
  getFile(): Promise<File>;
};
```

---

## Internal components

### Store — `src/store/attachment-save-actions/store.ts`

`Map<string, AttachmentSaveActionConfig>` — preserves insertion order, O(1) lookup by id.

### Registration function — `src/integrations/attachment-save-action-functions.ts`

Validates the config (required string fields, function onClick) and delegates to the store.
This is the function exposed as `register-attachment-save-action` via the shell.

### Built-in Files hook — `src/integrations/carbonio-files-ui-attachment-save-integration.tsx`

`useRegisterFilesAttachmentSaveIntegration()` — called from `AttachmentsBlock`. Registers
`carbonio-files-ui:save` ("Save to Files", icon "DriveOutline"). Inside `onClick(ctx)`: opens
the node picker and calls the `CopyToFiles` SOAP API with `ctx.messageId` and `ctx.partName`.
This is the reference implementation for actions that can use a **server-side copy** (no
browser download needed).

### Attachments component — `src/views/app/detail-panel/preview/attachments-block.tsx`

Reads `useAttachmentSaveActionStore`, builds an `AttachmentSaveActionContext` via
`makeSaveContext` (including `getFile` backed by `downloadAttachmentAsFile`), then renders:
- **1 action** — a `Button` with the action's icon and a `Tooltip` with its label.
- **2+ actions** — a `Dropdown` wrapping a "SaveOutline" button; each item maps to one action.

---

## Examples

### Server-side save (no browser download)

If your module can instruct the mail server to copy the attachment directly to a destination
(like carbonio-files-ui does with the `CopyToFiles` SOAP call), use `ctx.messageId` and
`ctx.partName` and skip `getFile()`:

```ts
onClick: (ctx) => {
  legacySoapFetch('CopyToMyStorage', {
    mid: ctx.messageId,
    part: ctx.partName,
    destination: myFolderId,
  });
}
```

### Client-side upload to third-party storage (e.g. Nextcloud)

Use `ctx.getFile()` when your integration must download the bytes in the browser and then
re-upload them to an external system:

```ts
onClick: async (ctx) => {
  const file = await ctx.getFile();
  await nextcloudClient.upload(file);
}
```

---

## Key files

| File | Purpose |
|------|---------|
| `src/types/integrations/attachment-save-action.ts` | Public types (`AttachmentSaveActionConfig`, `AttachmentSaveActionContext`) |
| `src/store/attachment-save-actions/store.ts` | Zustand registry |
| `src/integrations/attachment-save-action-functions.ts` | Registration function (shell-exposed) |
| `src/integrations/carbonio-files-ui-attachment-save-integration.tsx` | Built-in Files integration (reference: server-side copy) |
| `src/api/download-attachment-api.ts` | `downloadAttachmentAsFile` — backs `ctx.getFile()` |
| `src/app-utils/register-shell-integrations.ts` | Exposes `register-attachment-save-action` at startup |
| `src/views/app/detail-panel/preview/attachments-block.tsx` | Renders hover bar save button/dropdown; provides `AttachmentSaveActionContext` |
