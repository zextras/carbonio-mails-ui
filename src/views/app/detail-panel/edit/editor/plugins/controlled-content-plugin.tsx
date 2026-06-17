/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useRef } from 'react';

import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { AccountSettingsPrefs } from '@zextras/carbonio-ui-soap-lib';
import { $getRoot, $insertNodes, type EditorState, type LexicalEditor } from 'lexical';

import { editorUtils } from '../parts/editor-utils';
import { TINYMCE_BASE_CONTENT_STYLES } from 'constants/tinymce-content-styles';
import { applyUserPreferenceStyles, UserPreferenceStyle } from 'helpers/user-preference-styles';
import { replaceCidUrlWithServiceUrl } from 'store/editor/editor-transformations';
import { useSaveDraftFromEditor } from 'store/editor/hooks/save-draft';
import { useEditorSetDirty } from 'store/editor/hooks/statuses';
import { useEditorAttachments, useEditorsStore } from 'store/editor/index';
import { MailsEditorV2 } from 'types/editor';

type ControlledContentPluginProps = {
	editorId: MailsEditorV2['id'];
};

function getUserPreferenceStyle(prefs: AccountSettingsPrefs): UserPreferenceStyle {
	return {
		font: prefs?.zimbraPrefHtmlEditorDefaultFontFamily,
		fontSize: prefs?.zimbraPrefHtmlEditorDefaultFontSize,
		color: prefs?.zimbraPrefHtmlEditorDefaultFontColor
	};
}

/**
 * Keeps the Lexical editor in controlled mode against the editor store.
 *
 * - Down (store -> editor): whenever `editor.text.richText` changes from an
 *   external source (signature, identity switch, reply/forward quote,
 *   smartlink, initial load) the new HTML is parsed into the editor with the
 *   `history-merge` tag so it is not treated as a user edit.
 * - Up (editor -> store): on every user change the HTML/plain text is written
 *   back to the store synchronously (so the store is always the source of
 *   truth), the draft save is debounced and unused inline attachments are
 *   pruned.
 *
 * An echo guard (`lastEmittedHtmlRef`) prevents the round trip from looping or
 * moving the caret.
 */
export const ControlledContentPlugin = ({
	editorId
}: ControlledContentPluginProps): React.JSX.Element => {
	const [editor] = useLexicalComposerContext();
	const { prefs } = useUserSettings();
	const { setDirty } = useEditorSetDirty(editorId);
	const { debouncedSaveDraft } = useSaveDraftFromEditor(editorId);
	const { keepOnlyInlineAttachments } = useEditorAttachments(editorId);

	const storeRichText = useEditorsStore((state) => state.editors[editorId]?.text.richText);

	// Last HTML we pushed to the store and last HTML applied to the editor,
	// both kept in store form so the down-sync can ignore our own echoes.
	const lastEmittedHtmlRef = useRef<string>();
	const currentHtmlRef = useRef<string>();

	// Up: editor -> store
	const onChange = useCallback(
		(editorState: EditorState, currentEditor: LexicalEditor): void => {
			// Read through the editor (not the bare editor state) so that the active
			// editor context is set: `$generateHtmlFromNodes` -> `exportDOM` needs it.
			editorState.read(
				() => {
					const plainText = $getRoot().getTextContent();
					const style = getUserPreferenceStyle(prefs);
					const richText = applyUserPreferenceStyles(
						$generateHtmlFromNodes(currentEditor, null),
						style,
						TINYMCE_BASE_CONTENT_STYLES
					);

					lastEmittedHtmlRef.current = richText;
					currentHtmlRef.current = richText;

					const { usedCids } = editorUtils.retrieveCIdsFromContent({ htmlContent: richText });
					keepOnlyInlineAttachments(usedCids);

					useEditorsStore.getState().setText(editorId, { plainText, richText });
					setDirty();
					debouncedSaveDraft();
				},
				{ editor: currentEditor }
			);
		},
		[debouncedSaveDraft, editorId, keepOnlyInlineAttachments, prefs, setDirty]
	);

	// Down: store -> editor
	useEffect(() => {
		const incoming = storeRichText ?? '';
		if (incoming === lastEmittedHtmlRef.current || incoming === currentHtmlRef.current) {
			return;
		}

		const savedAttachments = useEditorsStore.getState().editors[editorId]?.savedAttachments ?? [];
		const html = replaceCidUrlWithServiceUrl(incoming, savedAttachments);

		editor.update(
			() => {
				const dom = new DOMParser().parseFromString(html, 'text/html');
				const nodes = $generateNodesFromDOM(editor, dom);
				const root = $getRoot();
				root.clear();
				root.select();
				$insertNodes(nodes);
			},
			{ tag: 'history-merge' }
		);

		currentHtmlRef.current = incoming;
	}, [editor, editorId, storeRichText]);

	return <OnChangePlugin onChange={onChange} ignoreSelectionChange />;
};
