/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import { PlainTextEditorContainer } from './plain-text-editor-container';
import { RichTextEditorContainer } from './rich-text-editor-container';
import { useEditorIsRichText } from 'store/editor/index';
import { MailsEditorV2 } from 'types/editor';

export type TextEditorContainerProps = {
	editorId: MailsEditorV2['id'];
	onDragOver: (event: DragEvent) => void;
};

export const TextEditorContainer: FC<TextEditorContainerProps> = ({ editorId, onDragOver }) => {
	const { isRichText } = useEditorIsRichText(editorId);

	return (
		<Container
			data-testid={'TextEditorContainer'}
			height="fit"
			flexGrow={1}
			flexShrink={0}
			flexBasis="auto"
			background={'gray6'}
			crossAlignment="flex-start"
			mainAlignment="flex-start"
		>
			{isRichText ? (
				<RichTextEditorContainer editorId={editorId} onDragOver={onDragOver} />
			) : (
				<PlainTextEditorContainer editorId={editorId} />
			)}
		</Container>
	);
};
