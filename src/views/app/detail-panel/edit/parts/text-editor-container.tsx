/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ComponentType, FC, useCallback, useEffect } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useIntegratedComponent, useUserSettings } from '@zextras/carbonio-shell-ui';
import type { Editor, TinyMCE } from 'tinymce/tinymce';

import * as StyledComp from './edit-view-styled-components';
import { plainTextToHTML } from '../../../../../commons/utils';
import { useEditorIsRichText, useEditorText } from '../../../../../store/zustand/editor';
import { MailsEditorV2 } from '../../../../../types';
import { getFontSizesOptions, getFonts } from '../../../../settings/components/utils';

export type TextEditorContent = { plainText: string; richText: string };

export type TextEditorContainerProps = {
	editorId: MailsEditorV2['id'];
	onDragOver: (event: React.DragEvent) => void;
	onFilesSelected: ({ editor, files }: { editor: TinyMCE; files: FileList }) => void;
	composerInitialValueRef: React.MutableRefObject<string | null>;
	composerRef: React.MutableRefObject<Editor | null>;
};

const RichTextComposer = ({
	Composer,
	text,
	onTextChanged,
	onDragOver,
	onFilesSelected,
	composerInitialValueRef,
	composerRef
}: {
	onTextChanged: (e: MailsEditorV2['text']) => void;
	Composer: ComponentType<Record<string, unknown>>;
	text: MailsEditorV2['text'];
	onDragOver: (event: React.DragEvent) => void;
	onFilesSelected: ({ editor, files }: { editor: TinyMCE; files: FileList }) => void;
	composerInitialValueRef: React.MutableRefObject<string | null>;
	composerRef: React.MutableRefObject<Editor | null>;
}): React.JSX.Element => {
	const { prefs } = useUserSettings();

	const fontSizesOptions = getFontSizesOptions();

	const fontFamilyOptions = getFonts();

	const defaultFontSize = prefs?.zimbraPrefHtmlEditorDefaultFontSize;
	const defaultColor = prefs?.zimbraPrefHtmlEditorDefaultFontColor;
	const defaultFontFamily = prefs?.zimbraPrefHtmlEditorDefaultFontFamily;

	const fontSizesOptionsToString = fontSizesOptions.map((fontSize: string) => fontSize).join(' ');
	const fontsOptionsToString = fontFamilyOptions.map(
		(font: { label: string; value: string }) => `${font.label}=${font.value};`
	);

	const composerCustomOptions = {
		toolbar_sticky: true,
		ui_mode: 'split',
		font_size_formats: fontSizesOptionsToString,
		font_family_formats: fontsOptionsToString,
		content_style: `p  {margin: 0;} body {color: ${defaultColor}; font-size: ${defaultFontSize}; font-family: ${defaultFontFamily}; }`,
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

	useEffect(() => {
		const intervalId = setInterval(() => {
			if (composerRef?.current) {
				const newRichText = composerRef.current.getContent({ format: 'html' });
				const newPlainText = composerRef.current.getContent({ format: 'text' });

				onTextChanged({ plainText: newPlainText, richText: newRichText });
			}
		}, 5000);

		return () => clearInterval(intervalId);
	}, [composerRef, onTextChanged, text.plainText, text.richText]);

	return (
		<Container
			background={'gray6'}
			mainAlignment="flex-start"
			style={{ minHeight: 0, overflow: 'hidden' }}
		>
			<StyledComp.EditorWrapper data-testid="MailEditorWrapper">
				<Composer
					initialValue={composerInitialValueRef.current}
					disabled={false}
					onFileSelect={onFilesSelected}
					onInit={(evt: Event, editor: Editor) => {
						composerRef.current = editor;
					}}
					onDragOver={onDragOver}
					customInitOptions={composerCustomOptions}
				/>
			</StyledComp.EditorWrapper>
		</Container>
	);
};

export const TextEditorContainer: FC<TextEditorContainerProps> = ({
	editorId,
	onDragOver,
	onFilesSelected,
	composerInitialValueRef,
	composerRef
}) => {
	const [Composer, composerIsAvailable] = useIntegratedComponent('composer');

	const { text, setText } = useEditorText(editorId);
	const { isRichText } = useEditorIsRichText(editorId);

	const onTextChanged = useCallback(
		(txt: TextEditorContent): void => {
			setText({ plainText: txt.plainText, richText: txt.richText });
		},
		[setText]
	);

	const { prefs } = useUserSettings();

	const defaultFontFamily = prefs?.zimbraPrefHtmlEditorDefaultFontFamily;

	return (
		<>
			{text && (
				<Container
					height="fit"
					padding={{ all: 'small' }}
					background={'gray6'}
					crossAlignment="flex-end"
				>
					{isRichText && composerIsAvailable ? (
						<RichTextComposer
							Composer={Composer}
							text={text}
							onTextChanged={onTextChanged}
							onDragOver={onDragOver}
							onFilesSelected={onFilesSelected}
							composerInitialValueRef={composerInitialValueRef}
							composerRef={composerRef}
						/>
					) : (
						<Container background={'gray6'} height="fit">
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
