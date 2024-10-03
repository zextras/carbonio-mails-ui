/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useRef, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useIntegratedComponent, useUserSettings } from '@zextras/carbonio-shell-ui';
import { debounce } from 'lodash';
import type { Editor, TinyMCE } from 'tinymce/tinymce';

import * as StyledComp from './edit-view-styled-components';
import { plainTextToHTML } from '../../../../../commons/mail-message-renderer';
import { useEditorIsRichText, useEditorText } from '../../../../../store/zustand/editor';
import { MailsEditorV2 } from '../../../../../types';
import { getFontSizesOptions, getFonts } from '../../../../settings/components/utils';

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
	const [initialContent, setInitialContent] = useState(text.richText);
	const editorRef = useRef<Editor | null>(null);

	const onTextChanged = useCallback(
		(text: TextEditorContent): void => {
			setText({ plainText: text.plainText, richText: text.richText });
		},
		[setText]
	);

	const { prefs } = useUserSettings();
	const fontSizesOptions = getFontSizesOptions();
	const fontFamilyOptions = getFonts();

	const defaultFontFamily = prefs?.zimbraPrefHtmlEditorDefaultFontFamily;
	const defaultFontSize = prefs?.zimbraPrefHtmlEditorDefaultFontSize;
	const defaultColor = prefs?.zimbraPrefHtmlEditorDefaultFontColor;

	const fontSizesOptionsToString = fontSizesOptions.map((fontSize: string) => fontSize).join(' ');
	const fontsOptionsToString = fontFamilyOptions.map(
		(font: { label: string; value: string }) => `${font.label}=${font.value};`
	);

	const composerCustomOptions = {
		toolbar_sticky: true,
		ui_mode: 'split',
		font_size_formats: fontSizesOptionsToString,
		font_family_formats: fontsOptionsToString,
		content_style: `p  {margin: 0;  color: ${defaultColor}; font-size: ${defaultFontSize}; font-family: ${defaultFontFamily}; }`,
		toolbar: [
			'fontfamily fontsize styles visualblocks',
			'bold italic underline strikethrough',
			'removeformat code',
			'alignleft aligncenter alignright alignjustify',
			'forecolor backcolor',
			'bullist numlist outdent indent',
			'ltr rtl',
			'link table',
			'insertfile image',
			'imageSelector'
		].join(' | ')
	};

	const handleEditorFocusOut = (): void => {
		onTextChanged({
			plainText: editorRef?.current?.getContent({ format: 'text' }) ?? '',
			richText: editorRef?.current?.getContent() ?? ''
		});
		setInitialContent(editorRef?.current?.getContent() ?? '');
	};

	const handleEditorKeyUp = debounce((): void => {
		if (editorRef.current && isRichText) {
			const richText = editorRef?.current?.getContent({ format: 'html' });
			const plainText = editorRef?.current?.getContent({ format: 'text' });
			if (richText !== text.richText) {
				setText({ plainText, richText });
			}
		}
	}, 300);

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
									onInit={(_evt, editor): void => {
										editorRef.current = editor;
									}}
									initialValue={initialContent}
									disabled={disabled}
									onFileSelect={onFilesSelected}
									onFocusOut={handleEditorFocusOut}
									onKeyUp={handleEditorKeyUp}
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
								defaultValue={text.plainText}
								style={{ fontFamily: defaultFontFamily }}
								onFocus={(ev): void => {
									ev.currentTarget.setSelectionRange(0, null);
								}}
								onChange={(ev): void => {
									onTextChanged({
										plainText: ev.target.value,
										richText: plainTextToHTML(ev.target.value)
									});
									setInitialContent(plainTextToHTML(ev.target.value));
								}}
							/>
						</Container>
					)}
				</Container>
			)}
		</>
	);
};
