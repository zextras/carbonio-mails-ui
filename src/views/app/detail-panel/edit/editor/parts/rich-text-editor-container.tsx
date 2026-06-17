/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

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
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { t, useUserSettings } from '@zextras/carbonio-shell-ui';

import * as StyledComp from './edit-view-styled-components';
import type { TextEditorContainerProps } from './text-editor-container';
import { ControlledContentPlugin } from '../plugins/controlled-content-plugin';
import { ImagePlugin } from '../plugins/image-plugin';
import { ImageNode } from '../plugins/nodes/image-node';
import { PastePlugin } from '../plugins/paste-plugin';
import { RichToolbarPlugin } from '../plugins/rich-toolbar-plugin';
import { DEFAULT_FONT_FAMILY } from 'helpers/user-preference-styles';

const LexicalWrapper = styled.div<{
	$fontFamily: string;
	$fontSize?: string;
	$color?: string;
}>`
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;

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
		flex: 1;
		min-height: 0;
	}

	.mails-lexical-content-editable {
		flex: 1;
		min-height: 12.5rem;
		padding: 0.5rem;
		outline: none;
		overflow-y: auto;
		font-family: ${({ $fontFamily }): string => $fontFamily};
		${({ $fontSize }): string => ($fontSize ? `font-size: ${$fontSize};` : '')}
		${({ $color }): string => ($color ? `color: ${$color};` : '')}
	}

	.mails-lexical-placeholder {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		color: ${({ theme }): string => theme.palette.secondary.regular};
		pointer-events: none;
		user-select: none;
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

	a.mails-lexical-link {
		color: ${({ theme }): string => theme.palette.primary.regular};
	}
`;

export const RichTextEditorContainer = ({
	editorId,
	onDragOver
}: TextEditorContainerProps): React.JSX.Element => {
	const { prefs } = useUserSettings();

	const fontFamily =
		(prefs?.zimbraPrefHtmlEditorDefaultFontFamily as string) || DEFAULT_FONT_FAMILY;
	const fontSize = prefs?.zimbraPrefHtmlEditorDefaultFontSize as string | undefined;
	const color = prefs?.zimbraPrefHtmlEditorDefaultFontColor as string | undefined;

	const initialConfig = useMemo(
		() => ({
			namespace: 'MailsLexicalEditor',
			nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode, ImageNode],
			theme: {
				text: {
					bold: 'mails-lexical-bold',
					italic: 'mails-lexical-italic',
					underline: 'mails-lexical-underline',
					strikethrough: 'mails-lexical-strikethrough',
					underlineStrikethrough: 'mails-lexical-underline-strikethrough'
				},
				link: 'mails-lexical-link',
				image: 'mails-lexical-image'
			},
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
						<RichToolbarPlugin editorId={editorId} />
					</div>
					<div
						className="editor-inner"
						onDragOver={(event): void => onDragOver?.(event.nativeEvent)}
					>
						<RichTextPlugin
							contentEditable={
								<ContentEditable
									className="mails-lexical-content-editable"
									data-testid="edit-view-editor"
								/>
							}
							placeholder={
								<div className="mails-lexical-placeholder">
									{t('messages.write_your_message', 'Write your message')}
								</div>
							}
							ErrorBoundary={LexicalErrorBoundary}
						/>
					</div>
					<HistoryPlugin />
					<ListPlugin />
					<LinkPlugin />
					<ImagePlugin />
					<PastePlugin editorId={editorId} />
					<ControlledContentPlugin editorId={editorId} />
				</LexicalWrapper>
			</LexicalComposer>
		</StyledComp.EditorWrapper>
	);
};
