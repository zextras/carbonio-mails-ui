# Add from External — Attachment Provider Integration

## Overview

`carbonio-mails-ui` exposes a generic integration point that lets any Carbonio module register itself as a file source in the mail composer's attachment dropdown.

When a provider is registered it appears as an extra item in the **Add attachments** menu, next to the built-in "Add from local" and "Add from Files" options. If no provider is registered the menu is unchanged — the feature is completely invisible until something registers against it.

---

## How it works

The integration is built on the [`registerActions`](https://github.com/zextras/carbonio-shell-ui) / `useActions` mechanism provided by `@zextras/carbonio-shell-ui`.

```
External module                       carbonio-mails-ui
─────────────────                     ──────────────────────────────────────
registerActions({                     useActions(context, type)
  type: 'mails-add-attachment-        ↳ calls each factory with context
        provider',                    ↳ renders returned items in dropdown
  action: (context) => { … }         ↳ onClick → provider.execute()
})
```

### Context object

`carbonio-mails-ui` passes the following context to every action factory at render time:

```typescript
type AddAttachmentProviderContext = {
  /**
   * Call this with the files the user selected.
   * The mail composer takes ownership from here: it validates the total
   * message size and either attaches the files directly or offers the
   * user a smartlink fallback.
   */
  onFilesSelected: (files: File[]) => void;
};
```

### Action shape

The factory must return an object that satisfies the shell `Action` interface plus a mandatory `id`:

```typescript
type AddAttachmentProvider = {
  id: string;      // unique, stable identifier for this provider
  label: string;   // dropdown item label (should be translated)
  icon?: string;   // Carbonio Design System icon name
  execute: () => void;
};
```

### Integration type constant

```typescript
const ADD_ATTACHMENT_PROVIDER_TYPE = 'mails-add-attachment-provider';
```

Use this exact string as the `type` when calling `registerActions`.

---

## Registering a provider — step by step

### 1. Call `registerActions` during module bootstrap

Register your action once, typically inside the module's bootstrap/init function (called by the shell when the module loads).

```typescript
import { registerActions, t } from '@zextras/carbonio-shell-ui';

type MyProviderContext = {
  onFilesSelected: (files: File[]) => void;
};

registerActions<MyProviderContext>({
  id: 'my-module-add-attachment',
  type: 'mails-add-attachment-provider',
  action: (context: MyProviderContext) => ({
    id: 'my-module-add-attachment',
    label: t('attachment.add_from_my_module', 'Add from My Module'),
    icon: 'CloudUploadOutline',
    execute: () => {
      openMyFilePicker((selectedFiles: File[]) => {
        context.onFilesSelected(selectedFiles);
      });
    }
  })
});
```

### 2. Implement `openMyFilePicker`

Your picker must eventually produce an array of standard browser [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) objects and pass them to `onFilesSelected`. How files are fetched is entirely up to the provider.

```typescript
function openMyFilePicker(onFiles: (files: File[]) => void): void {
  // Open your module's UI (modal, panel, etc.)
  // Once the user confirms their selection, download the files and call back.

  showFileSelectorModal({
    onConfirm: async (selectedItems: MyFileDescriptor[]) => {
      const files = await Promise.all(
        selectedItems.map(async (item) => {
          const blob = await fetch(item.downloadUrl).then((r) => r.blob());
          return new File([blob], item.name, { type: item.mimeType });
        })
      );
      onFiles(files);
    }
  });
}
```

> **Note:** Files are downloaded to the browser's memory before being passed to the mail composer, which then uploads them to the Carbonio mail server. This round-trip is intentional — it keeps the integration decoupled from internal mail server APIs. For typical document and image sizes this is not a concern.

---

## Full example — Nextcloud module

```typescript
// src/bootstrap.ts  (inside carbonio-nextcloud-ui)

import { registerActions, t } from '@zextras/carbonio-shell-ui';
import { openNextcloudPicker } from './nextcloud-picker';

type MailsAttachmentContext = {
  onFilesSelected: (files: File[]) => void;
};

export function registerMailIntegration(): void {
  registerActions<MailsAttachmentContext>({
    id: 'nextcloud-add-attachment',
    type: 'mails-add-attachment-provider',
    action: (context: MailsAttachmentContext) => ({
      id: 'nextcloud-add-attachment',
      label: t('nextcloud.add_attachment', 'Add from Nextcloud'),
      icon: 'CloudUploadOutline',
      execute: () => {
        openNextcloudPicker({
          onConfirm: async (nodes: NextcloudNode[]) => {
            const files = await Promise.all(
              nodes.map(async (node) => {
                const blob = await downloadFromNextcloud(node.id);
                return new File([blob], node.name, { type: node.mimeType });
              })
            );
            context.onFilesSelected(files);
          }
        });
      }
    })
  });
}
```

```typescript
// src/app.tsx  (inside carbonio-nextcloud-ui)

import { registerMailIntegration } from './bootstrap';

export default function App(): null {
  useEffect(() => {
    registerMailIntegration();
  }, []);

  return null;
}
```

---

## Relevant source files

| File | Role |
|---|---|
| `src/views/app/detail-panel/edit/edit-utils-hooks/use-add-from-external.ts` | Hook that calls `useActions` and returns the registered providers |
| `src/views/app/detail-panel/edit/edit-utils-hooks/constants.ts` | Defines `ADD_ATTACHMENT_PROVIDER_TYPE` |
| `src/views/app/detail-panel/edit/parts/add-attachments-dropdown.tsx` | Renders providers as dropdown items |
| `src/views/app/detail-panel/edit/edit-utils-hooks/use-local-attachment-or-smartlink.tsx` | Handles size validation and smartlink fallback once files are received |
