/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Button, Row } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { FORMAT_TEXT_COMMAND, type TextFormatType } from 'lexical';

/**
 * Minimal formatting toolbar for the Lexical editor: bold, italic and underline.
 * Each button dispatches a `FORMAT_TEXT_COMMAND` on the active selection.
 */
export const ToolbarPlugin = (): React.JSX.Element => {
	const [editor] = useLexicalComposerContext();

	const formatText = useCallback(
		(format: TextFormatType): void => {
			editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
		},
		[editor]
	);

	return (
		<Row
			mainAlignment="flex-start"
			padding={{ vertical: 'extrasmall' }}
			gap="extrasmall"
			width="fill"
		>
			<Button
				type="ghost"
				size="small"
				label={t('label.bold', 'Bold')}
				onClick={(): void => formatText('bold')}
			/>
			<Button
				type="ghost"
				size="small"
				label={t('label.italic', 'Italic')}
				onClick={(): void => formatText('italic')}
			/>
			<Button
				type="ghost"
				size="small"
				label={t('label.underline', 'Underline')}
				onClick={(): void => formatText('underline')}
			/>
		</Row>
	);
};
