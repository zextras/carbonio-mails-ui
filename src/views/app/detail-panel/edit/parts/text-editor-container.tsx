/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import { useEditorIsRichText } from 'store/editor/index';
import { MailsEditorV2 } from 'types/index.d';
import { PlainTextEditorContainer } from 'views/app/detail-panel/edit/parts/plain-text-editor-container';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/parts/rich-text-editor-container';

export type TextEditorContainerProps = {
	editorId: MailsEditorV2['id'];
	onDragOver: (event: DragEvent) => void;
};

export const TextEditorContainer: FC<TextEditorContainerProps> = ({ editorId, onDragOver }) => {
	const { isRichText } = useEditorIsRichText(editorId);

	return (
		<Container
			data-testid={'TextEditorContainer'}
			height={'fit'}
			padding={{ all: 'small' }}
			background={'gray6'}
			crossAlignment="flex-end"
		>
			{isRichText ? (
				<RichTextEditorContainer editorId={editorId} onDragOver={onDragOver} />
			) : (
				<PlainTextEditorContainer editorId={editorId} />
			)}
		</Container>
	);
};
