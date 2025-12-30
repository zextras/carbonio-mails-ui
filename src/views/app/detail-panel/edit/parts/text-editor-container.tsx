/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { PlainTextEditorContainer } from './plain-text-editor-container';
import { RichTextEditorContainer } from './rich-text-editor-container';
import { useEditorIsRichText } from 'store/editor/index';
import { MailsEditorV2 } from 'types/index.d';

export type TextEditorContainerProps = {
	editorId: MailsEditorV2['id'];
	onDragOver: (event: DragEvent) => void;
};

export const TextEditorContainer: FC<TextEditorContainerProps> = ({ editorId, onDragOver }) => {
	const { isRichText } = useEditorIsRichText(editorId);

	const containerHeight = isRichText ? 'fit' : '100%';

	return (
		// <Container
		// 	data-testid={'TextEditorContainer'}
		// 	height={containerHeight}
		// 	background={'gray6'}
		// 	crossAlignment="flex-end"
		// >
		isRichText ? (
			<RichTextEditorContainer editorId={editorId} onDragOver={onDragOver} />
		) : (
			<PlainTextEditorContainer editorId={editorId} />
		)
		// </Container>
	);
};
