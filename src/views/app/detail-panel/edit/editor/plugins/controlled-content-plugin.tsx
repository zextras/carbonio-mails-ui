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
import {
	$getRoot,
	$getSelection,
	$insertNodes,
	$isElementNode,
	$isRangeSelection,
	$isTextNode,
	type EditorState,
	type LexicalEditor,
	type LexicalNode
} from 'lexical';

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

/**
 * Absolute character offset of the current caret from the document start, or
 * `null` when there is no range selection (e.g. the initial content load, when
 * the editor has never been focused). Used to preserve the caret across a full
 * content replacement, whose node keys change and make the old selection
 * un-reappliable.
 */
function $getCaretAbsoluteOffset(): number | null {
	const selection = $getSelection();
	if (!$isRangeSelection(selection)) {
		return null;
	}
	const { anchor } = selection;
	let node = anchor.getNode();
	let offset = anchor.type === 'text' ? anchor.offset : 0;
	if (anchor.type === 'element' && $isElementNode(node)) {
		const children = node.getChildren();
		for (let i = 0; i < anchor.offset && i < children.length; i += 1) {
			offset += children[i].getTextContentSize();
		}
	}
	// Add the text content of everything before `node` in document order.
	while (node.getKey() !== 'root') {
		let prev = node.getPreviousSibling();
		while (prev) {
			offset += prev.getTextContentSize();
			prev = prev.getPreviousSibling();
		}
		const parent = node.getParent();
		if (!parent) {
			break;
		}
		node = parent;
	}
	return offset;
}

type CaretPlacement = { remaining: number; placed: boolean };

/**
 * Walks `node` in document order, consuming `state.remaining` characters and
 * placing the caret once the target position is reached. Empty blocks can host
 * the caret only after the whole offset has been consumed, so an offset landing
 * in an empty compose area stays there instead of falling through to the next
 * text node (the signature / quoted content).
 */
function $placeCaretInNode(node: LexicalNode, state: CaretPlacement): void {
	if (state.placed) {
		return;
	}
	if ($isTextNode(node)) {
		const size = node.getTextContentSize();
		if (state.remaining <= size) {
			node.select(state.remaining, state.remaining);
			state.placed = true;
		} else {
			state.remaining -= size;
		}
		return;
	}
	if (!$isElementNode(node)) {
		return;
	}
	const children = node.getChildren();
	if (children.length > 0) {
		children.forEach((child) => $placeCaretInNode(child, state));
		return;
	}
	if (state.remaining <= 0) {
		node.selectStart();
		state.placed = true;
	}
}

/**
 * Places the caret `target` characters from the start of the freshly inserted
 * tree, falling back to the end when the content is now shorter than `target`.
 */
function $selectAtAbsoluteOffset(target: number): void {
	const root = $getRoot();
	const state: CaretPlacement = { remaining: target, placed: false };
	root.getChildren().forEach((child) => $placeCaretInNode(child, state));
	if (!state.placed) {
		root.selectEnd();
	}
}

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
				// Capture the caret before wiping the content so it can be restored
				// onto the newly inserted (different-keyed) nodes.
				const previousOffset = $getCaretAbsoluteOffset();

				const dom = new DOMParser().parseFromString(html, 'text/html');
				const nodes = $generateNodesFromDOM(editor, dom);
				const root = $getRoot();
				root.clear();
				root.select();
				$insertNodes(nodes);

				if (previousOffset == null) {
					// Initial load / never focused: open at the top instead of letting
					// `$insertNodes` leave the caret at the end (which scrolls the
					// composer down and hides the header/actions on small screens).
					root.selectStart();
				} else {
					$selectAtAbsoluteOffset(previousOffset);
				}
			},
			{ tag: 'history-merge' }
		);

		currentHtmlRef.current = incoming;
	}, [editor, editorId, storeRichText]);

	return <OnChangePlugin onChange={onChange} ignoreSelectionChange />;
};
