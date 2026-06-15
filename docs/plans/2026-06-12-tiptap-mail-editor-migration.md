# Migrazione editor mail compose da TinyMCE a TipTap v3

**Date:** 2026-06-12
**Status:** Approved
**Author:** luca.stauble + Claude
**Jira Issue:** N/A

## Context

L'editor della mail compose utilizza attualmente il componente `Composer` esportato da `@zextras/carbonio-ui-text-composer` (che incapsula TinyMCE 6.8.4). L'integrazione è in modalità **uncontrolled**: il body del messaggio vive dentro l'editor e lo store Zustand vi accede tramite un pattern custom chiamato **textProvider** — una coppia di closure (`getCurrentText` / `setCurrentText`) registrata nel campo `editors[id].textProvider` al mount dell'editor. Questo pattern genera boilerplate (ref, closure, doppia sincronizzazione store/editor) e complicazioni nei test (necessità di mockare `Composer` e simulare `init_instance_callback`).

L'obiettivo è sostituire TinyMCE con **TipTap v3** in modalità **controlled letterale** (lo store editor è l'unica sorgente di verità, l'editor riceve `value` e fa `onChange`), eliminando il pattern textProvider e tutti i suoi corollari. La migrazione è limitata all'editor della **compose mail**: l'editor delle firme nei settings (`src/views/settings/signature-settings.tsx`) continua a usare `Composer` e resta fuori scope.

Vincoli decisi:
- TipTap **v3**.
- HTML output: gli attributi `data-mce-*` (TinyMCE-specific) non vanno preservati; la classe `signature-div` invece **deve essere preservata** come marker delle firme.
- Modalità **controlled letterale**: lo store guida ogni render dell'editor; si valutano `immediatelyRender` e `shouldRerenderOnTransaction` per le performance.
- Toolbar **custom** costruita con `@zextras/carbonio-design-system`.
- Componente TipTap **separato** consumato da `RichTextEditorContainer`.
- **Eliminazione totale** di tutto il pattern textProvider (tipi, store action, hook, parametri `syncTextProvider`).
- `tinymce` rimosso dalle dipendenze esplicite; `@zextras/carbonio-ui-text-composer` resta (serve a signature-settings).
- Sostituzione **diretta** su `devel`, no feature flag.
- React **18.3.1** (verificato in package.json).
- **Parity 1:1** con le funzionalità esistenti, niente nuove feature in questa fase.

## Decision

Scelta: **Soluzione 1 — Controlled letterale store-driven, con save-draft incapsulato in `setText`**.

`TipTapEditor` è un componente controlled puro (`value` / `onChange`). Ogni keystroke chiama `onChange` → `setText` dello store. `setText` viene allineato al pattern di `setSubject`: invoca internamente `setter(id, val) + setDirty() + debouncedSaveDraft()`. In questo modo l'API dello store resta uniforme, `RichTextEditorContainer` diventa un thin adapter, e l'unica sorgente di verità è lo store.

Performance: TipTap v3 ha `shouldRerenderOnTransaction: false` di default — l'oggetto `editor` non scatena re-render React ad ogni transaction. Gli stati attivi della toolbar (es. bold attivo) sono osservati granularmente via `useEditorState`. `immediatelyRender: true` (default) va bene, non abbiamo SSR.

Per evitare caret-jump in controlled letterale: `TipTapEditor` ha un `useEffect` con **diff-guard** che chiama `editor.commands.setContent(value.richText, { emitUpdate: false })` solo se `value.richText !== editor.getHTML()`. Dato che `onChange` aggiorna lo store con l'HTML appena estratto dall'editor, al re-render successivo il diff è uguale e nessun `setContent` viene invocato.

## Implementation Steps

### 1. Dipendenze npm

- **Rimuovere** da `dependencies` in `package.json`: `tinymce: 6.8.4`.
- **Mantenere**: `@zextras/carbonio-ui-text-composer: 1.2.0` (necessario a `signature-settings.tsx`).
- **Aggiungere** a `dependencies` (versione `^3.0.0`):
  - Core: `@tiptap/react`, `@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit`.
  - Estensioni: `@tiptap/extension-underline`, `@tiptap/extension-link`, `@tiptap/extension-image`, `@tiptap/extension-text-align`, `@tiptap/extension-text-style`, `@tiptap/extension-color`, `@tiptap/extension-highlight`, `@tiptap/extension-font-family`, `@tiptap/extension-table`, `@tiptap/extension-table-row`, `@tiptap/extension-table-cell`, `@tiptap/extension-table-header`, `@tiptap/extension-placeholder`, `@tiptap/extension-list-item`, `@tiptap/extension-bullet-list`, `@tiptap/extension-ordered-list`, `@tiptap/extension-blockquote`, `@tiptap/extension-code-block`.
- **Font-size**: TipTap v3 non offre extension ufficiale `font-size`. Implementare custom extension basata su `TextStyle` in `src/views/app/detail-panel/edit/parts/tiptap/extensions/font-size.ts`.

### 2. Nuovo componente `TipTapEditor`

Path: `src/views/app/detail-panel/edit/parts/tiptap/tiptap-editor.tsx`.

Props:
```ts
type TipTapEditorProps = {
  value: { plainText: string; richText: string };
  onChange: (value: { plainText: string; richText: string }) => void;
  onFileSelect: (files: File[]) => void;
  onPaste?: (event: ClipboardEvent) => boolean | void;
  accountSettingsPrefs: { locale: string; font: string; fontSize: string; color: string };
  disabled?: boolean;
  editorRef?: React.Ref<Editor>;
};
```

Internals:
- `useEditor({ extensions, content: value.richText, immediatelyRender: true, shouldRerenderOnTransaction: false, onUpdate, editorProps: { handleDrop, handlePaste, attributes: { spellcheck: 'true' } }, editable: !disabled })`.
- `onUpdate({ editor })` → calcola `html = editor.getHTML()` e `text = editor.getText()`, invoca `onChange({ richText: html, plainText: text })`.
- `useEffect([value.richText])` con diff-guard: `if (editor && value.richText !== editor.getHTML()) editor.commands.setContent(value.richText, { emitUpdate: false })`.
- Applicazione iniziale dei user-preference styles via `editor.chain().selectAll().setFontFamily(font).setFontSize(fontSize).setColor(color).run()` al mount (effect con dependency su `editor`).
- `forwardRef` per esporre l'istanza `editor` ai consumer (es. smartlink modal, change-signatures-dropdown se servisse).

### 3. Schema TipTap — preservare `signature-div` e immagini inline

- **Custom extension `SignatureBlock`** in `src/views/app/detail-panel/edit/parts/tiptap/extensions/signature-block.ts`:
  - `Node.create({ name: 'signatureBlock', group: 'block', content: 'block+', defining: true, parseHTML: () => [{ tag: 'div.signature-div' }], renderHTML: () => ['div', { class: 'signature-div' }, 0] })`.
- **Custom Image extension wrapper** in `src/views/app/detail-panel/edit/parts/tiptap/extensions/inline-image.ts`:
  - Estende `Image` base per preservare attributi `src` con schema `cid:`, attributo `data-cid`, `style` inline (`width`/`height`).
  - `addAttributes`: aggiunge `dataCid` con `parseHTML: el => el.getAttribute('data-cid')`, `renderHTML: attrs => ({ 'data-cid': attrs.dataCid })`.
- **Link extension**: configurare `Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer' } })`.
- Eventuali attributi `data-mce-*` presenti in bozze legacy vengono scartati dal parser (comportamento accettato — non vanno preservati).

### 4. Toolbar CDS

Path: `src/views/app/detail-panel/edit/parts/tiptap/tiptap-toolbar.tsx`.

- Costruita con `IconButton`, `Tooltip`, `Dropdown`, `Container`, `Padding` di `@zextras/carbonio-design-system`.
- Gruppi di bottoni (parity con TinyMCE attuale):
  - **Font**: family (dropdown), size (dropdown), styles (dropdown: h1–h6, p, pre, blockquote).
  - **Formatting**: bold, italic, underline, strikethrough, removeFormat.
  - **Color**: forecolor (palette con `react-colorful`), backcolor (highlight).
  - **Align/Direction**: alignLeft, alignCenter, alignRight, alignJustify, outdent, indent, ltr, rtl.
  - **Lists**: bulletList, orderedList.
  - **Insert**: link (modale CDS), table (dropdown con insertRow/insertColumn/deleteRow/deleteColumn/deleteTable/mergeCells/splitCell), insertfile, image (file picker → `onFileSelect`), charmap (modale CDS), emoticons (palette CDS o `emoji-picker-element` lazy).
  - **View**: visualBlocks (toggle CSS class sul body editor), code (textarea con `editor.getHTML()` + commit via `setContent` su blur).
- Stati attivi dei bottoni via `useEditorState({ editor, selector: ctx => ({ isBold: ctx.editor.isActive('bold'), isItalic: ctx.editor.isActive('italic'), /* ... */ }) })` — re-render granulare senza far re-renderizzare l'intero editor.

### 5. Refactor `RichTextEditorContainer`

Path: `src/views/app/detail-panel/edit/parts/rich-text-editor-container.tsx`.

Diventa thin adapter:
```tsx
const { text, setText } = useEditorText(editorId);
const { savedAttachments, addInlineAttachments } = useEditorAttachments(editorId);
const accountSettingsPrefs = useAccountSettingsPrefs();

const value = useMemo(() => ({
  plainText: text.plainText,
  richText: replaceCidUrlWithServiceUrl(text.richText, savedAttachments)
}), [text, savedAttachments]);

const handleChange = useCallback((next) => setText(next), [setText]);

return (
  <TipTapEditor
    value={value}
    onChange={handleChange}
    onFileSelect={onInlineAttachmentsSelected}
    onPaste={createPasteHandler({ addInlineAttachments, editorId })}
    accountSettingsPrefs={accountSettingsPrefs}
  />
);
```

Rimuovere: `composerRef`, `initialValue.current`, `onComposerInit`, `onTextChange` (il debounce vive ora in `setText` via hook), `saveEditor`, `onComposerClose`, registrazione di `setTextProvider`, import di `Composer` e `tinymce`. Il container non importa più `useSaveDraftFromEditor` né `useEditorSetDirty` per il flow di scrittura: entrambi sono incapsulati in `setText`.

Per l'inserimento di `<img>` da upload inline: `onInlineAttachmentsSelected` continua a esistere, ma costruisce l'HTML aggiornato e lo passa a `setText` (oppure, in alternativa, invoca `editorRef.current.chain().focus().setImage({ src: cidUrl, dataCid }).run()` — in quest'ultimo caso TipTap genera `onUpdate` e quindi `setText` viene già chiamato dall'editor).

### 6. Rimozione totale del pattern textProvider

- **`src/types/editor/index.ts`**:
  - Eliminare il type `EditorTextProvider`.
  - Eliminare il type `EditorSetTextOptions`.
  - Rimuovere il campo `textProvider?: EditorTextProvider` da `MailsEditorV2`.
- **`src/store/editor/store.ts`**:
  - Eliminare l'azione `setTextProvider` (firma + implementation + tipo in `EditorsStateTypeV2`).
- **`src/store/editor/hooks/editor.ts`**:
  - Eliminare l'hook `useEditorTextProvider`.
  - Riscrivere `useEditorText` (vedi sotto), allineato a `setSubject`:
    ```ts
    export const useEditorText = (
      id: MailsEditorV2['id']
    ): { text: MailsEditorV2['text']; setText: (text: MailsEditorV2['text']) => void } => {
      const { debouncedSaveDraft } = useSaveDraftFromEditor(id);
      const value = useEditorsStore((state) => state.editors[id].text);
      const setter = useEditorsStore.getState().setText;
      const { setDirty } = useEditorSetDirty(id);

      return useMemo(
        () => ({
          text: value,
          setText: (val: MailsEditorV2['text']): void => {
            setter(id, val);
            setDirty();
            debouncedSaveDraft();
          }
        }),
        [id, debouncedSaveDraft, setter, value, setDirty]
      );
    };
    ```
  - Eliminare il parametro `options.syncTextProvider`.
- **`src/store/editor/editor-generators.ts`**: rimuovere ogni inizializzazione di `textProvider`.
- **Call site con `syncTextProvider: false`**: grep su `syncTextProvider` e rimuovere il secondo argomento (dopo il refactor è chiamata semplice `setText(val)`).
- **Effetti collaterali da verificare**: alcuni call site (es. `change-signatures-dropdown`, smartlink insert) attualmente godono di `immediateSaveDraft` implicito. Dopo il refactor, `setText` invoca `debouncedSaveDraft`. Casi accettabili:
  - Change signatures dropdown → debounced OK.
  - Smartlink insertion → debounced OK.
  - Inline image upload → debounced OK.
  - Send flow (`use-send-handlers`, `use-save-draft`) → chiama già `immediateSaveDraft` esplicitamente, invariato.
  Se un call site richiede davvero un save immediato dopo `setText`, aggiungere chiamata esplicita a `immediateSaveDraft` accanto (pattern già presente nel codebase).

### 7. Smartlink modal

Path: `src/views/app/detail-panel/edit/parts/smartlink-modal/*`.

Nessun cambio strutturale necessario: la modale lavora su HTML stringa (`insertAboveSignature` in `ui-actions/utils.tsx`) e chiama `setText` con l'HTML modificato. Il diff-guard di `TipTapEditor` rileva la differenza e riapplica `setContent`. `insertAboveSignature` cerca `<div class="signature-div">` — la classe è preservata dalla custom extension `SignatureBlock`, quindi funziona invariata.

### 8. Change signatures dropdown

Path: `src/views/app/detail-panel/edit/parts/change-signatures-dropdown.tsx`.

Nessun cambio strutturale: continua a usare `getMailBodyWithSignature` + `setText`. La firma viene riconosciuta tramite la classe `signature-div`.

### 9. Switch Rich ↔ Plain

Path: `src/views/app/detail-panel/edit/parts/text-editor-container.tsx`.

Nessuna modifica: `useEditorIsRichText` decide quale componente renderizzare; `RichTextEditorContainer` ora rende `TipTapEditor` ma l'interfaccia esterna è invariata.

### 10. CID inline images

- `replaceCidUrlWithServiceUrl` rimane usata in `RichTextEditorContainer` per derivare il `value.richText` mostrato all'editor.
- Al salvataggio (in `editor-transformations.ts` / save-draft flow), `composeCidUrlFromContentId` converte URL servizio → `cid:` come oggi.
- La custom `InlineImage` extension preserva qualsiasi `src` (incluso `cid:`) e l'attributo `data-cid`.

### 11. Pulizia file

- **Eliminare**: `src/constants/tinymce-content-styles.ts`. Sostituire con `src/views/app/detail-panel/edit/parts/tiptap/tiptap-content-styles.ts` (CSS scoped all'editor TipTap, applicato via `editorProps.attributes.class` o tramite `<style>` montato accanto a `<EditorContent>`).
- **Riscrivere**: `src/views/app/detail-panel/edit/parts/editor-paste-handler.ts` come ProseMirror plugin (`handlePaste` in `editorProps`) o utility consumata da TipTap.
- **Revisionare**: `src/views/app/detail-panel/edit/parts/editor-utils.ts` per rimuovere parti TinyMCE-specific.
- **Rimuovere import**: `tinymce` e `@zextras/carbonio-ui-text-composer` da `rich-text-editor-container.tsx` e tutti i file della sottocartella `tiptap/`.

### 12. Test

- **`rich-text-editor-container.browser-test.tsx`**: riscritto contro il vero TipTap. Interazioni reali via Playwright (digitazione, paste, drag&drop).
- **`inline-images-on-external-text-change.test.tsx`**: il mock di `@zextras/carbonio-ui-text-composer` viene sostituito da un mock di `TipTapEditor` (componente locale, semplice) oppure test diretto sull'editor reale con asserzioni su `editorRef.current.getHTML()`.
- **`text-editor-container.test.tsx`**: aggiornare le assertion sul componente renderizzato (`TipTapEditor` invece di `Composer`).
- **`plain-text-editor-container.test.tsx`**: invariato.
- **Nuovi test mirati per `TipTapEditor`**: rendering controlled, diff-guard (no caret jump al replay dello stesso content), preservazione `signature-div` in roundtrip parse→serialize, toolbar bold/italic toggling, link insertion, table insertion.
- **Cleanup mocks**: grep su `vi.mock('@zextras/carbonio-ui-text-composer'` e adattare ogni occorrenza.
- **Test del refactor `useEditorText`** in `src/store/editor/tests/hooks.test.ts`: aggiornare assertion sulle invocazioni (`debouncedSaveDraft` invece di `immediateSaveDraft`, niente più `textProvider`).

### 13. Tipi e cleanup finale

- Aggiornare `MailsEditorV2` (rimozione `textProvider`).
- `src/__test__/` — generatori di editor mock: rimuovere assegnazioni a `textProvider` se presenti.
- `npm run type-check` deve passare clean.
- `npm run lint` deve passare clean (header SPDX nei nuovi file, import order).

## Alternatives Considered

### Soluzione 2: Controlled letterale con buffer locale + commit debounced allo store

`RichTextEditorContainer` avrebbe mantenuto una `useState` locale come specchio del testo durante il typing, committando allo store + save-draft con debounce di 2000ms. Lo store sarebbe rimasto autoritativo solo per aggiornamenti esterni (firma, smartlink, init).

**Scartata** perché reintroduce un buffer intermedio (in posizione diversa rispetto al textProvider), creando doppia sorgente di verità (locale + store) e edge case di sync (focus race con cambio firma, flush al click "Send", chiusura editor con buffer non flushed). Contraddice in parte l'obiettivo di semplificazione che giustifica la rimozione di textProvider.

### Soluzione 3: Migrazione in 2 fasi (compat layer prima, cleanup dopo)

Fase 1 — introdurre `TipTapEditor` con API mimicking di `Composer` (preserva `initialValue`, `onInit`, ref) e mantenere temporaneamente il pattern textProvider. Fase 2 — refactor a controlled letterale ed eliminazione di textProvider in una PR successiva.

**Scartata** perché va contro la richiesta esplicita di "controlled letterale" già nella prima fase, paga il costo di mantenere temporaneamente la complessità di textProvider, raddoppia merge/review/QA cycle e allunga il tempo wall-clock complessivo.
