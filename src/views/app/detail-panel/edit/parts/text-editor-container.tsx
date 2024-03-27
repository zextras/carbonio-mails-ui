/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useIntegratedComponent, useUserSettings } from '@zextras/carbonio-shell-ui';
import type { TinyMCE } from 'tinymce/tinymce';

import * as StyledComp from './edit-view-styled-components';
import { plainTextToHTML } from '../../../../../commons/mail-message-renderer';
import { useEditorIsRichText, useEditorText } from '../../../../../store/zustand/editor';
import { MailsEditorV2 } from '../../../../../types';

export type TextEditorContent = { plainText: string; richText: string };

export type TextEditorContainerProps = {
	editorId: MailsEditorV2['id'];
	onDragOver: (event: React.DragEvent) => void;
	onFilesSelected: ({ editor, files }: { editor: TinyMCE; files: FileList }) => void;
	minHeight: number;
	disabled: boolean;
};

export const TextEditorContainer: FC<TextEditorContainerProps> = ({
	editorId,
	onDragOver,
	onFilesSelected,
	minHeight,
	disabled
}) => {
	const [Composer, composerIsAvailable] = useIntegratedComponent('composer');
	const [isFirstChangeEventFired, setIsFirstChangeEventFired] = useState(false);
	const { text, setText } = useEditorText(editorId);
	const { isRichText } = useEditorIsRichText(editorId);

	const onTextChanged = useCallback(
		(text: TextEditorContent): void => {
			setText({ plainText: text.plainText, richText: text.richText });
		},
		[setText]
	);

	const { prefs } = useUserSettings();
	const defaultFontFamily = useMemo<string>(
		() => String(prefs?.zimbraPrefHtmlEditorDefaultFontFamily) ?? 'arial,helvetica,sans-serif',
		[prefs]
	);

	const defaultFontColor = useMemo<string>(
		() => String(prefs?.zimbraPrefHtmlEditorDefaultFontColor) ?? '#000000',
		[prefs]
	);

	const defaultFontSize = useMemo<string>(
		() => String(prefs?.zimbraPrefHtmlEditorDefaultFontSize) ?? '12pt',
		[prefs]
	);

	const composerCustomOptions = {
		toolbar_sticky: true,
		ui_mode: 'split',
		content_style: `body  {  color: ${defaultFontColor}; font-size: ${defaultFontSize}; font-family: ${defaultFontFamily}; } p { margin: 0; }`
	};

	return (
		<>
			{text && (
				<Container
					height="fit"
					padding={{ all: 'small' }}
					background="gray6"
					crossAlignment="flex-end"
				>
					{isRichText && composerIsAvailable ? (
						<Container
							background="gray6"
							mainAlignment="flex-start"
							style={{ minHeight, overflow: 'hidden' }}
						>
							<StyledComp.EditorWrapper data-testid="MailEditorWrapper">
								<Composer
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									value={text.richText}
									disabled={disabled}
									onFileSelect={onFilesSelected}
									onEditorChange={(ev: [string, string]): void => {
										if (isFirstChangeEventFired)
											onTextChanged({ plainText: ev[0], richText: ev[1] });
									}}
									onDragOver={onDragOver}
									customInitOptions={composerCustomOptions}
									onFocus={(): void => {
										if (!isFirstChangeEventFired) setIsFirstChangeEventFired(true);
									}}
								/>
							</StyledComp.EditorWrapper>
						</Container>
					) : (
						<Container background="gray6" height="fit">
							<StyledComp.TextArea
								data-testid="MailPlainTextEditor"
								value={text.plainText}
								style={{ fontFamily: defaultFontFamily }}
								onFocus={(ev): void => {
									ev.currentTarget.setSelectionRange(0, null);
								}}
								onChange={(ev): void => {
									onTextChanged({
										plainText: ev.target.value,
										richText: plainTextToHTML(ev.target.value)
									});
								}}
							/>
						</Container>
					)}
				</Container>
			)}
		</>
	);
};
