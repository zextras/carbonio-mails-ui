/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useState } from 'react';

import styled from '@emotion/styled';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { useUserSettings } from '@zextras/carbonio-shell-ui';

import * as StyledComp from './edit-view-styled-components';
import type { TextEditorContainerProps } from './text-editor-container';
import { AutoLinkPlugin } from '../plugins/auto-link-plugin';
import { ControlledContentPlugin } from '../plugins/controlled-content-plugin';
import { FloatingLinkEditorPlugin } from '../plugins/floating-link-editor-plugin';
import { STYLE_PRESERVING_HTML_IMPORT } from '../plugins/html-import-style';
import { ImagePlugin } from '../plugins/image-plugin';
import { ListMarkdownShortcutPlugin } from '../plugins/list-markdown-shortcut-plugin';
import { ImageNode } from '../plugins/nodes/image-node';
import { QuotedSeparatorNode } from '../plugins/nodes/quoted-separator-node';
import { SignatureNode } from '../plugins/nodes/signature-node';
import { PastePlugin } from '../plugins/paste-plugin';
import { RichToolbarPlugin, type UploadedInlineImage } from '../plugins/rich-toolbar-plugin';
import { TableActionMenuPlugin } from '../plugins/table-action-menu-plugin';
import { TableCellResizerPlugin } from '../plugins/table-cell-resizer-plugin';
import { TableHoverActionsPlugin } from '../plugins/table-hover-actions-plugin';
import { DEFAULT_FONT_FAMILY } from 'helpers/user-preference-styles';
import { useEditorAttachments } from 'store/editor/index';

export const LexicalWrapper = styled.div<{
	$fontFamily: string;
	$fontSize?: string;
	$color?: string;
}>`
	display: flex;
	flex-direction: column;
	flex: 1 0 auto;
	width: 100%;

	.mails-lexical-toolbar {
		position: sticky;
		top: 0;
		z-index: 1;
		background: ${({ theme }): string => theme.palette.gray6.regular};
	}

	.editor-inner {
		position: relative;
		display: flex;
		flex-direction: column;
		flex: 1 0 auto;
	}

	.mails-lexical-content-editable {
		flex: 1 0 auto;
		min-height: 12.5rem;
		padding: 0.5rem;
		outline: none;
		font-family: ${({ $fontFamily }): string => $fontFamily};
		${({ $fontSize }): string => ($fontSize ? `font-size: ${$fontSize};` : '')}
		${({ $color }): string => ($color ? `color: ${$color};` : '')}
	}

	/* Match the paragraph spacing baked into the saved/previewed HTML
	   (TINYMCE_BASE_CONTENT_STYLES) so blank lines look the same while typing
	   as they do once the draft is saved and rendered in the preview. */
	.mails-lexical-content-editable p {
		margin: 0;
		padding: 0;
		margin-bottom: 16px;
	}

	.mails-lexical-content-editable p:last-child {
		margin-bottom: 0;
	}

	.mails-lexical-placeholder {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		color: ${({ theme }): string => theme.palette.secondary.regular};
		pointer-events: none;
		user-select: none;
	}

	/* "Show blocks" view aid: dashed outlines around block-level elements. View
	   only, never affects the saved HTML. */
	.mails-lexical-show-blocks
		.mails-lexical-content-editable
		:is(p, h1, h2, h3, h4, h5, h6, blockquote, ul, ol, li, div, pre, table) {
		outline: 0.0625rem dashed ${({ theme }): string => theme.palette.gray3.regular};
		outline-offset: 0.125rem;
	}

	.mails-lexical-bold {
		font-weight: bold;
	}

	.mails-lexical-italic {
		font-style: italic;
	}

	.mails-lexical-underline {
		text-decoration: underline;
	}

	.mails-lexical-strikethrough {
		text-decoration: line-through;
	}

	.mails-lexical-underline-strikethrough {
		text-decoration: underline line-through;
	}

	.mails-lexical-image {
		display: inline-block;
		max-width: 100%;
	}

	.mails-lexical-image-left {
		float: left;
		margin: 0 1rem 1rem 0;
	}

	.mails-lexical-image-right {
		float: right;
		margin: 0 0 1rem 1rem;
	}

	.mails-lexical-image-center {
		display: block;
		margin: 0 auto;
		text-align: center;
	}

	.mails-lexical-image-wrapper {
		position: relative;
		display: inline-block;
		line-height: 0;
	}

	.mails-lexical-image-wrapper img {
		cursor: default;
	}

	.mails-lexical-image-selected img {
		outline: 0.125rem solid ${({ theme }): string => theme.palette.primary.regular};
		outline-offset: 0.0625rem;
	}

	.mails-lexical-image-resizer {
		position: absolute;
		width: 0.5rem;
		height: 0.5rem;
		padding: 0;
		border: 0.0625rem solid ${({ theme }): string => theme.palette.gray6.regular};
		background: ${({ theme }): string => theme.palette.primary.regular};
		appearance: none;
		z-index: 2;
	}

	.mails-lexical-image-resizer-nw {
		top: -0.25rem;
		left: -0.25rem;
		cursor: nwse-resize;
	}

	.mails-lexical-image-resizer-n {
		top: -0.25rem;
		left: 50%;
		transform: translateX(-50%);
		cursor: ns-resize;
	}

	.mails-lexical-image-resizer-ne {
		top: -0.25rem;
		right: -0.25rem;
		cursor: nesw-resize;
	}

	.mails-lexical-image-resizer-e {
		top: 50%;
		right: -0.25rem;
		transform: translateY(-50%);
		cursor: ew-resize;
	}

	.mails-lexical-image-resizer-se {
		bottom: -0.25rem;
		right: -0.25rem;
		cursor: nwse-resize;
	}

	.mails-lexical-image-resizer-s {
		bottom: -0.25rem;
		left: 50%;
		transform: translateX(-50%);
		cursor: ns-resize;
	}

	.mails-lexical-image-resizer-sw {
		bottom: -0.25rem;
		left: -0.25rem;
		cursor: nesw-resize;
	}

	.mails-lexical-image-resizer-w {
		top: 50%;
		left: -0.25rem;
		transform: translateY(-50%);
		cursor: ew-resize;
	}

	a.mails-lexical-link {
		color: ${({ theme }): string => theme.palette.primary.regular};
	}

	.mails-lexical-table {
		border-collapse: collapse;
		table-layout: fixed;
		width: 100%;
		margin: 0.5rem 0;
	}

	.mails-lexical-table td,
	.mails-lexical-table th {
		position: relative;
		border: 0.0625rem solid ${({ theme }): string => theme.palette.gray3.regular};
		padding: 0.375rem 0.5rem;
		vertical-align: top;
		min-width: 2.5rem;
	}

	.mails-lexical-table th {
		background: ${({ theme }): string => theme.palette.gray5.regular};
		font-weight: bold;
		text-align: left;
	}

	.mails-lexical-table-cell-selected {
		background: ${({ theme }): string => theme.palette.highlight.regular};
	}

	.mails-lexical-table-cell-action-button {
		position: absolute;
		z-index: 2;
		transform: translate(-100%, 0);
	}

	.mails-lexical-table-resizer {
		position: absolute;
		z-index: 2;
		padding: 0;
		border: none;
		background: transparent;
		appearance: none;
	}

	.mails-lexical-table-resizer-column {
		width: 0.375rem;
		transform: translateX(-50%);
		cursor: col-resize;
	}

	.mails-lexical-table-resizer-row {
		height: 0.375rem;
		transform: translateY(-50%);
		cursor: row-resize;
	}

	.mails-lexical-table-resizer:hover {
		background: ${({ theme }): string => theme.palette.primary.regular};
	}

	.mails-lexical-table-resizer-guide {
		position: absolute;
		z-index: 3;
		background: ${({ theme }): string => theme.palette.primary.regular};
		pointer-events: none;
	}

	.mails-lexical-table-resizer-guide-column {
		top: 0;
		bottom: 0;
		width: 0.0625rem;
	}

	.mails-lexical-table-resizer-guide-row {
		left: 0;
		right: 0;
		height: 0.0625rem;
	}

	.mails-lexical-table-hover-action {
		position: absolute;
		z-index: 3;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: none;
		border-radius: 0.125rem;
		background: ${({ theme }): string => theme.palette.gray3.regular};
		color: ${({ theme }): string => theme.palette.gray0.regular};
		font-size: 0.875rem;
		line-height: 1;
		cursor: pointer;
		appearance: none;
	}

	.mails-lexical-table-hover-action:hover {
		background: ${({ theme }): string => theme.palette.primary.regular};
		color: ${({ theme }): string => theme.palette.gray6.regular};
	}

	.mails-lexical-table-hover-action-row {
		transform: translateY(0.1875rem);
	}

	.mails-lexical-table-hover-action-column {
		transform: translateX(0.1875rem);
	}
`;

export const RichTextEditorContainer = ({
	editorId,
	onDragOver
}: TextEditorContainerProps): React.JSX.Element => {
	const { prefs } = useUserSettings();
	const [showBlocks, setShowBlocks] = useState(false);
	const { addInlineAttachments } = useEditorAttachments(editorId);

	const onUploadInlineImages = useCallback(
		(files: File[], onComplete: (attachments: UploadedInlineImage[]) => void): void => {
			addInlineAttachments(files, { onSaveComplete: onComplete });
		},
		[addInlineAttachments]
	);

	const fontFamily =
		(prefs?.zimbraPrefHtmlEditorDefaultFontFamily as string) || DEFAULT_FONT_FAMILY;
	const fontSize = prefs?.zimbraPrefHtmlEditorDefaultFontSize;
	const color = prefs?.zimbraPrefHtmlEditorDefaultFontColor;

	const initialConfig = useMemo(
		() => ({
			namespace: 'MailsLexicalEditor',
			nodes: [
				HeadingNode,
				QuoteNode,
				ListNode,
				ListItemNode,
				LinkNode,
				AutoLinkNode,
				ImageNode,
				QuotedSeparatorNode,
				SignatureNode,
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
		<StyledComp.EditorWrapper data-testid="MailEditorWrapper">
			<LexicalComposer initialConfig={initialConfig}>
				<LexicalWrapper $fontFamily={fontFamily} $fontSize={fontSize} $color={color}>
					<div className="mails-lexical-toolbar">
						<RichToolbarPlugin
							showBlocks={showBlocks}
							onToggleShowBlocks={(): void => setShowBlocks((previous) => !previous)}
							onUploadInlineImages={onUploadInlineImages}
						/>
					</div>
					<div
						className={`editor-inner${showBlocks ? ' mails-lexical-show-blocks' : ''}`}
						onDragOver={(event): void => onDragOver?.(event.nativeEvent)}
					>
						<RichTextPlugin
							contentEditable={
								<ContentEditable
									className="mails-lexical-content-editable"
									data-testid="edit-view-editor"
								/>
							}
							placeholder={<div className="mails-lexical-placeholder" />}
							ErrorBoundary={LexicalErrorBoundary}
						/>
					</div>
					<HistoryPlugin />
					<ListPlugin />
					<ListMarkdownShortcutPlugin />
					<LinkPlugin />
					<AutoLinkPlugin />
					<FloatingLinkEditorPlugin />
					<TablePlugin hasCellMerge hasCellBackgroundColor hasTabHandler />
					<TableActionMenuPlugin />
					<TableCellResizerPlugin />
					<TableHoverActionsPlugin />
					<ImagePlugin />
					<PastePlugin editorId={editorId} />
					<ControlledContentPlugin editorId={editorId} />
				</LexicalWrapper>
			</LexicalComposer>
		</StyledComp.EditorWrapper>
	);
};
