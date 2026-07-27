/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { $getRoot, $insertNodes, type EditorState, type LexicalEditor } from 'lexical';

import { DEFAULT_FONT_FAMILY } from 'helpers/user-preference-styles';
import { LexicalWrapper } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';
import { AutoLinkPlugin } from 'views/app/detail-panel/edit/editor/plugins/auto-link-plugin';
import { FloatingLinkEditorPlugin } from 'views/app/detail-panel/edit/editor/plugins/floating-link-editor-plugin';
import { STYLE_PRESERVING_HTML_IMPORT } from 'views/app/detail-panel/edit/editor/plugins/html-import-style';
import { ImagePlugin } from 'views/app/detail-panel/edit/editor/plugins/image-plugin';
import { ImageNode } from 'views/app/detail-panel/edit/editor/plugins/nodes/image-node';
import { RichToolbarPlugin } from 'views/app/detail-panel/edit/editor/plugins/rich-toolbar-plugin';
import { TableActionMenuPlugin } from 'views/app/detail-panel/edit/editor/plugins/table-action-menu-plugin';
import { TableCellResizerPlugin } from 'views/app/detail-panel/edit/editor/plugins/table-cell-resizer-plugin';
import { TableHoverActionsPlugin } from 'views/app/detail-panel/edit/editor/plugins/table-hover-actions-plugin';

type SignatureRichTextEditorProps = {
	value: string;
	onChange: (html: string) => void;
	disabled?: boolean;
	'data-testid'?: string;
};

type SignatureContentSyncPluginProps = {
	value: string;
	onChange: (html: string) => void;
	disabled?: boolean;
};

/**
 * Keeps the Lexical editor in sync with a plain `value`/`onChange` pair rather
 * than the mail editor Zustand store, so it can be reused outside the mail
 * composer (e.g. to edit a signature's HTML in isolation).
 *
 * - Down (prop -> editor): whenever `value` changes from an external source
 *   (switching the selected signature) the new HTML is parsed into the editor
 *   with the `history-merge` tag so it is not treated as a user edit.
 * - Up (editor -> prop): on every user change the resulting HTML is generated
 *   and passed to `onChange` directly.
 *
 * An echo guard (`lastEmittedHtmlRef`) prevents the round trip from looping.
 */
const SignatureContentSyncPlugin = ({
	value,
	onChange,
	disabled
}: SignatureContentSyncPluginProps): React.JSX.Element => {
	const [editor] = useLexicalComposerContext();
	// Tracks whichever HTML is currently loaded in the editor, set on both the
	// down sync (a different `value` prop, e.g. switching signatures) and the up
	// sync (a user edit), so switching away from and back to the same signature
	// is recognized as a real content change rather than treated as an echo of a
	// stale edit from before the switch.
	const currentHtmlRef = useRef<string>();

	const onEditorChange = useCallback(
		(editorState: EditorState, currentEditor: LexicalEditor): void => {
			editorState.read(
				() => {
					const html = $generateHtmlFromNodes(currentEditor, null);
					currentHtmlRef.current = html;
					onChange(html);
				},
				{ editor: currentEditor }
			);
		},
		[onChange]
	);

	useEffect(() => {
		if (value === currentHtmlRef.current) {
			return;
		}
		currentHtmlRef.current = value;

		editor.update(
			() => {
				const dom = new DOMParser().parseFromString(value ?? '', 'text/html');
				const nodes = $generateNodesFromDOM(editor, dom);
				const root = $getRoot();
				root.clear();
				root.select();
				$insertNodes(nodes);
				root.selectStart();
			},
			{ tag: 'history-merge' }
		);
	}, [editor, value]);

	useEffect(() => {
		editor.setEditable(!disabled);
	}, [editor, disabled]);

	return <OnChangePlugin onChange={onEditorChange} ignoreSelectionChange />;
};

/**
 * Store-agnostic rich text editor for editing a signature's HTML `description`,
 * built from the same Lexical nodes/plugins as the mail composer's
 * `RichTextEditorContainer`, minus the mail-only nodes (`SignatureNode`,
 * `QuotedSeparatorNode`) and the attachment-upload path of `RichToolbarPlugin`
 * (a signature has no draft/attachments to upload against).
 */
export const SignatureRichTextEditor = ({
	value,
	onChange,
	disabled,
	'data-testid': dataTestId
}: SignatureRichTextEditorProps): React.JSX.Element => {
	const { prefs } = useUserSettings();
	const [showBlocks, setShowBlocks] = useState(false);

	const fontFamily =
		(prefs?.zimbraPrefHtmlEditorDefaultFontFamily as string) || DEFAULT_FONT_FAMILY;
	const fontSize = prefs?.zimbraPrefHtmlEditorDefaultFontSize;
	const color = prefs?.zimbraPrefHtmlEditorDefaultFontColor;

	const initialConfig = useMemo(
		() => ({
			namespace: 'SignatureLexicalEditor',
			nodes: [
				HeadingNode,
				QuoteNode,
				ListNode,
				ListItemNode,
				LinkNode,
				AutoLinkNode,
				ImageNode,
				TableNode,
				TableRowNode,
				TableCellNode
			],
			theme: {
				text: {
					bold: 'mails-lexical-bold',
					italic: 'mails-lexical-italic',
					underline: 'mails-lexical-underline',
					strikethrough: 'mails-lexical-strikethrough',
					underlineStrikethrough: 'mails-lexical-underline-strikethrough'
				},
				link: 'mails-lexical-link',
				image: 'mails-lexical-image',
				table: 'mails-lexical-table',
				tableCellSelected: 'mails-lexical-table-cell-selected'
			},
			html: { import: STYLE_PRESERVING_HTML_IMPORT },
			onError: (error: Error): void => {
				throw error;
			}
		}),
		[]
	);

	return (
		<LexicalComposer initialConfig={initialConfig}>
			<LexicalWrapper
				$fontFamily={fontFamily}
				$fontSize={fontSize}
				$color={color}
				data-testid={dataTestId}
			>
				<div className="mails-lexical-toolbar">
					<RichToolbarPlugin
						showBlocks={showBlocks}
						onToggleShowBlocks={(): void => setShowBlocks((previous) => !previous)}
					/>
				</div>
				<div className={`editor-inner${showBlocks ? ' mails-lexical-show-blocks' : ''}`}>
					<RichTextPlugin
						contentEditable={
							<ContentEditable
								className="mails-lexical-content-editable"
								data-testid="signature-editor-content-editable"
							/>
						}
						placeholder={<div className="mails-lexical-placeholder" />}
						ErrorBoundary={LexicalErrorBoundary}
					/>
				</div>
				<HistoryPlugin />
				<ListPlugin />
				<LinkPlugin />
				<AutoLinkPlugin />
				<FloatingLinkEditorPlugin />
				<TablePlugin hasCellMerge hasCellBackgroundColor hasTabHandler />
				<TableActionMenuPlugin />
				<TableCellResizerPlugin />
				<TableHoverActionsPlugin />
				<ImagePlugin />
				<SignatureContentSyncPlugin value={value} onChange={onChange} disabled={disabled} />
			</LexicalWrapper>
		</LexicalComposer>
	);
};
