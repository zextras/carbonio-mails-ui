/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useIntegratedComponent } from '@zextras/carbonio-shell-ui';

import { PlainTextEditorContainer } from './plain-text-editor-container';
import { RichTextEditorContainer } from './rich-text-editor-container';
import { useEditorIsRichText } from '../../../../../store/editor';
import { MailsEditorV2 } from '../../../../../types';

export type TextEditorContainerProps = {
	editorId: MailsEditorV2['id'];
	onDragOver: (event: React.DragEvent) => void;
};

export const TextEditorContainer: FC<TextEditorContainerProps> = ({ editorId, onDragOver }) => {
	const [composerIsAvailable] = useIntegratedComponent('composer');
	const { isRichText } = useEditorIsRichText(editorId);

	return (
		<Container
			height="fit"
			padding={{ all: 'small' }}
			background={'gray6'}
			crossAlignment="flex-end"
		>
			{isRichText && composerIsAvailable ? (
				<RichTextEditorContainer editorId={editorId} onDragOver={onDragOver} />
			) : (
				<PlainTextEditorContainer editorId={editorId} />
			)}
		</Container>
	);
};
