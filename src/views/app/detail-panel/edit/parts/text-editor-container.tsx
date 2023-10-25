/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, SyntheticEvent, useMemo, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useIntegratedComponent, useUserSettings } from '@zextras/carbonio-shell-ui';
import type { TinyMCE } from 'tinymce/tinymce';

import * as StyledComp from './edit-view-styled-components';
import { plainTextToHTML } from '../../../../../commons/mail-message-renderer';
import { MailsEditorV2 } from '../../../../../types';

export type TextEditorContent = { plainText: string; richText: string };

export type TextEditorContainerProps = {
	onDragOver: (event: React.DragEvent) => void;
	onFilesSelected: ({ editor, files }: { editor: TinyMCE; files: FileList }) => void;
	onContentChanged: (content: TextEditorContent) => void;
	richTextMode: boolean;
	content: TextEditorContent;
	minHeight: number;
	disabled: boolean;
	editorId: MailsEditorV2['id'];
};

export const TextEditorContainer: FC<TextEditorContainerProps> = ({
	onDragOver,
	onFilesSelected,
	onContentChanged,
	minHeight,
	content,
	richTextMode,
	disabled
}) => {
	const [Composer, composerIsAvailable] = useIntegratedComponent('composer');
	const [isFirstChangeEventFired, setIsFirstChangeEventFired] = useState(false);

	const { prefs } = useUserSettings();
	const defaultFontFamily = useMemo<string>(
		() => String(prefs?.zimbraPrefHtmlEditorDefaultFontFamily) ?? 'sans-serif',
		[prefs]
	);

	const composerCustomOptions = {
		toolbar_sticky: true,
		ui_mode: 'split'
	};

	return (
		<>
			{content && (
				<Container
					height="fit"
					padding={{ all: 'small' }}
					background="gray6"
					crossAlignment="flex-end"
				>
					{richTextMode && composerIsAvailable ? (
						<Container
							background="gray6"
							mainAlignment="flex-start"
							style={{ minHeight, overflow: 'hidden' }}
						>
							<StyledComp.EditorWrapper data-testid="MailEditorWrapper">
								<Composer
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									value={content.richText}
									disabled={disabled}
									onFileSelect={onFilesSelected}
									onEditorChange={(ev: [string, string]): void => {
										if (isFirstChangeEventFired)
											onContentChanged({ plainText: ev[0], richText: ev[1] });
										setIsFirstChangeEventFired(true);
									}}
									onDragOver={onDragOver}
									customInitOptions={composerCustomOptions}
								/>
							</StyledComp.EditorWrapper>
						</Container>
					) : (
						<Container background="gray6" height="fit">
							<StyledComp.TextArea
								data-testid="MailPlainTextEditor"
								value={content.plainText}
								style={{ fontFamily: defaultFontFamily }}
								onFocus={(ev): void => {
									ev.currentTarget.setSelectionRange(0, null);
								}}
								onChange={(ev): void => {
									onContentChanged({
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
