# Preview Save Attachment Providers Integration

## Overview

`carbonio-mails-ui` exposes a generic integration point that lets any Carbonio module register itself as a save destination in the mail **preview** panel's attachment cards.

When a provider is registered it appears as an extra item in the per-attachment actions dropdown alongside Download, Delete, and the other available options. If no provider is registered the dropdown is unchanged — the feature is completely invisible until something registers against it.

> **Naming rationale:** The type string and all related identifiers are scoped to `preview` (the read/preview panel) rather than just `mails`. This keeps the door open for future, distinct integration points in other surfaces — for example, the editor's "add from external storage" integration uses a different type string and a different hook.

---

## How it works

The integration is built on the [`registerActions`](https://github.com/zextras/carbonio-shell-ui) / `useActions` mechanism provided by `@zextras/carbonio-shell-ui`.

```
External module                         carbonio-mails-ui (preview)
─────────────────                       ──────────────────────────────────────────────────
registerActions({                       usePreviewSaveAttachmentProviders({ filename, ... })
  type: 'mails-preview-save-           ↳ calls useActions(context, type)
        attachment-provider',           ↳ each factory receives context
  action: (context) => { … }           ↳ returns Action[] rendered as dropdown items
})                                      ↳ onClick → provider.execute()
```

### Context object

`carbonio-mails-ui` passes the following context to every action factory at render time:

```typescript
type PreviewSaveAttachmentProviderContext = {
  /** Original filename of the attachment. */
  filename: string;
  /** MIME type of the attachment (e.g. "application/pdf"). */
  contentType: string;
  /** File size in bytes. */
  size: number;
  /**
   * Direct download URL for the attachment.
   * The provider uses this to fetch the file and upload it to their storage.
   */
  downloadUrl: string;
};
```

### Action shape

The factory must return an object that satisfies the shell `Action` interface plus a mandatory `id`:

```typescript
type PreviewSaveAttachmentProvider = {
  id: string;      // unique, stable identifier for this provider
  label: string;   // dropdown item label (should be translated)
  icon?: string;   // Carbonio Design System icon name
  execute: () => void;
};
```

### Integration type constant

```typescript
const PREVIEW_SAVE_ATTACHMENT_PROVIDER_TYPE = 'mails-preview-save-attachment-provider';
```

Use this exact string as the `type` when calling `registerActions`.

---

## Registering a provider — step by step

### 1. Call `registerActions` during module bootstrap

Register your action once, typically inside the module's bootstrap/init function (called by the shell when the module loads).

```typescript
import { registerActions, t } from '@zextras/carbonio-shell-ui';

type PreviewSaveAttachmentProviderContext = {
  filename: string;
  contentType: string;
  size: number;
  downloadUrl: string;
};

registerActions<PreviewSaveAttachmentProviderContext>({
  id: 'my-module-preview-save-attachment',
  type: 'mails-preview-save-attachment-provider',
  action: (context: PreviewSaveAttachmentProviderContext) => ({
    id: 'my-module-preview-save-attachment',
    label: t('attachment.save_to_my_module', 'Save to My Module'),
    icon: 'CloudUploadOutline',
    execute: () => {
      saveToExternalStorage(context.downloadUrl, context.filename);
    }
  })
});
```

### 2. Implement `saveToExternalStorage`

Your function fetches the file from the provided URL and uploads it to your storage backend.

```typescript
async function saveToExternalStorage(downloadUrl: string, filename: string): Promise<void> {
  const blob = await fetch(downloadUrl).then((r) => r.blob());
  const file = new File([blob], filename, { type: blob.type });
  await uploadToMyStorage(file);
}
```

> **Note:** The file is temporarily downloaded to the browser's memory before being uploaded to your storage. This round-trip is intentional — it keeps the integration decoupled from internal mail server APIs. For typical document and image sizes this is not a concern.

---

## Full example — external storage module

```typescript
// src/bootstrap.ts  (inside carbonio-external-storage-ui)

import { registerActions, t } from '@zextras/carbonio-shell-ui';
import { openExternalFolderPicker } from './external-folder-picker';

type PreviewSaveAttachmentProviderContext = {
  filename: string;
  contentType: string;
  size: number;
  downloadUrl: string;
};

export function registerMailPreviewIntegration(): void {
  registerActions<PreviewSaveAttachmentProviderContext>({
    id: 'external-storage-preview-save-attachment',
    type: 'mails-preview-save-attachment-provider',
    action: (context: PreviewSaveAttachmentProviderContext) => ({
      id: 'external-storage-preview-save-attachment',
      label: t('external_storage.save_attachment', 'Save to External Storage'),
      icon: 'CloudUploadOutline',
      execute: () => {
        openExternalFolderPicker({
          onConfirm: async (destinationFolderId: string) => {
            const blob = await fetch(context.downloadUrl).then((r) => r.blob());
            const file = new File([blob], context.filename, { type: context.contentType });
            await uploadToExternalFolder(destinationFolderId, file);
          }
        });
      }
    })
  });
}
```

```typescript
// src/app.tsx  (inside carbonio-external-storage-ui)

import { registerMailPreviewIntegration } from './bootstrap';

export default function App(): null {
  useEffect(() => {
    registerMailPreviewIntegration();
  }, []);

  return null;
}
```

---

## Relevant source files

| File | Role |
|---|---|
| `src/views/app/detail-panel/preview/preview-utils-hooks/use-preview-save-attachment-providers.ts` | Hook that calls `useActions` and returns the registered providers |
| `src/views/app/detail-panel/preview/preview-utils-hooks/constants.ts` | Defines `PREVIEW_SAVE_ATTACHMENT_PROVIDER_TYPE` |
| `src/views/app/detail-panel/preview/attachments-block.tsx` | Renders providers as dropdown items in each attachment card |
