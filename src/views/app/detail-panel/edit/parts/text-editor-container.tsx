/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useIntegratedComponent, useUserSettings } from '@zextras/carbonio-shell-ui';
import type { TinyMCE } from 'tinymce/tinymce';

import * as StyledComp from './edit-view-styled-components';
import { plainTextToHTML } from '../../../../../commons/utils';
import {
	useEditorIsRichText,
	useEditorsStore,
	useSaveDraftFromEditor
} from '../../../../../store/zustand/editor';
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
	const editorRef = useRef(null);
	const [dirty, setDirty] = useState(false);
	const [Composer, composerIsAvailable] = useIntegratedComponent('composer');
	const initialValue = useEditorsStore((state) => state.editors[editorId].text);
	const { isRichText } = useEditorIsRichText(editorId);
	const { debouncedSaveDraft } = useSaveDraftFromEditor();

	const setText = useCallback(
		({ plainText, richText }: { plainText: string; richText: string }) => {
			debouncedSaveDraft(editorId);
			useEditorsStore.setState((state) => ({
				...state.editors,
				[editorId]: { ...state.editors[editorId], text: { plainText, richText } }
			}));
		},
		[debouncedSaveDraft, editorId]
	);

	const onTextChanged = useCallback(
		(txt: TextEditorContent): void => {
			setText({ plainText: txt.plainText, richText: txt.richText });
		},
		[setText]
	);

	const { prefs } = useUserSettings();
	const fontSizesOptions = useMemo(() => getFontSizesOptions(), []);
	const fontFamilyOptions = useMemo(() => getFonts(), []);

	const defaultFontFamily = useMemo(
		() => prefs?.zimbraPrefHtmlEditorDefaultFontFamily,
		[prefs?.zimbraPrefHtmlEditorDefaultFontFamily]
	);
	const defaultFontSize = useMemo(
		() => prefs?.zimbraPrefHtmlEditorDefaultFontSize,
		[prefs?.zimbraPrefHtmlEditorDefaultFontSize]
	);
	const defaultColor = useMemo(
		() => prefs?.zimbraPrefHtmlEditorDefaultFontColor,
		[prefs?.zimbraPrefHtmlEditorDefaultFontColor]
	);

	const fontSizesOptionsToString = useMemo(
		() => fontSizesOptions.map((fontSize: string) => fontSize).join(' '),
		[fontSizesOptions]
	);
	const fontsOptionsToString = useMemo(
		() =>
			fontFamilyOptions.map(
				(font: { label: string; value: string }) => `${font.label}=${font.value};`
			),
		[fontFamilyOptions]
	);

	const composerCustomOptions = useMemo(
		() => ({
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
		}),
		[
			defaultColor,
			defaultFontFamily,
			defaultFontSize,
			fontSizesOptionsToString,
			fontsOptionsToString
		]
	);

	const onDirty = useCallback(() => {
		if (editorRef.current) {
			console.log('@@ setting dirty to false');
			editorRef.current.setDirty(false);
			setDirty(false);
			const plainText = editorRef.current.getContent({ format: 'text' });
			const richText = editorRef.current.getContent({ format: 'html' });
			setText({ plainText, richText });
		}
	}, [setText]);

	useEffect(() => {
		if (editorRef?.current) {
			onDirty();
		}
	}, [dirty, onDirty]);

	return (
		<>
			{initialValue && (
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
									initialValue={initialValue.richText}
									disabled={disabled}
									onInit={(evt, editor) => (editorRef.current = editor)}
									onFileSelect={onFilesSelected}
									onDirty={() => setDirty(true)}
									onDragOver={onDragOver}
									customInitOptions={composerCustomOptions}
								/>
							</StyledComp.EditorWrapper>
						</Container>
					) : (
						<Container background="gray6" height="fit">
							<StyledComp.TextArea
								data-testid="MailPlainTextEditor"
								value={initialValue.plainText}
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
