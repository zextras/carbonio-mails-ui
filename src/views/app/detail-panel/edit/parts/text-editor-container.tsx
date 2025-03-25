/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo, useRef } from 'react';

import { Editor, IAllProps } from '@tinymce/tinymce-react';
import { Container } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { debounce } from 'lodash';
import { TinyMCE } from 'tinymce/tinymce';

import { useEditorText } from '../../../../../store/editor';
import { MailsEditorV2 } from '../../../../../types';
import { getFontSizesOptions, getFonts } from '../../../../settings/components/utils';

export const SAVE_EDITOR_DELAY = 700;

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
	/*
	const [Composer, composerIsAvailable] = useIntegratedComponent('composer');
*/
	/*
	const [isFirstChangeEventFired, setIsFirstChangeEventFired] = useState(false);
*/
	const { text, setText } = useEditorText(editorId);
	/*
	const { isRichText } = useEditorIsRichText(editorId);
*/
	const editorTextRef = useRef(text.richText);

	// TODO remove me! - START
	const editorRef = useRef<Editor>();
	const saveEditor = useMemo(
		() =>
			debounce(() => {
				if (!editorRef.current) {
					return;
				}
				const plainText = editorRef.current.getContent({ format: 'text' });
				const richText = editorRef.current.getContent({ format: 'html' });
				setText({ plainText, richText });
			}, SAVE_EDITOR_DELAY),
		[setText]
	);

	const onEditorDirty = useCallback(() => {
		if (!editorRef.current) {
			return;
		}
		saveEditor();

		editorRef.current?.save();
	}, [saveEditor]);
	// TODO remove me! - END
	/*
	const onTextChanged = useCallback(
		(txt: TextEditorContent): void => {
			setText({ plainText: txt.plainText, richText: txt.richText });
		},
		[setText]
	); */

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

	const editorInitConfig = useMemo<IAllProps['init']>(
		() => ({
			min_height: 350,
			auto_focus: true,
			menubar: false,
			statusbar: false,
			branding: false,
			resize: true,
			font_size_formats:
				'8pt 9pt 10pt 11pt 12pt 13pt 14pt 16pt 18pt 24pt 30pt 36pt 48pt 60pt 72pt 96pt',
			object_resizing: 'img',
			toolbar_sticky: true,
			ui_mode: 'split',
			font_family_formats: fontsOptionsToString.join(' | '),
			content_style: `p  {margin: 0;} body {color: ${defaultColor}; font-size: ${defaultFontSize}; font-family: ${defaultFontFamily}; }`,
			style_formats: [
				{
					title: 'Headers',
					items: [
						{ title: 'h1', block: 'h1' },
						{ title: 'h2', block: 'h2' },
						{ title: 'h3', block: 'h3' },
						{ title: 'h4', block: 'h4' },
						{ title: 'h5', block: 'h5' },
						{ title: 'h6', block: 'h6' }
					]
				},
				{
					title: 'Blocks',
					items: [
						{ title: 'p', block: 'p' },
						{ title: 'div', block: 'div' },
						{ title: 'pre', block: 'pre' }
					]
				},
				{
					title: 'Containers',
					items: [
						{ title: 'section', block: 'section', wrapper: true, merge_siblings: false },
						{ title: 'article', block: 'article', wrapper: true, merge_siblings: false },
						{ title: 'blockquote', block: 'blockquote', wrapper: true },
						{ title: 'hgroup', block: 'hgroup', wrapper: true },
						{ title: 'aside', block: 'aside', wrapper: true },
						{ title: 'figure', block: 'figure', wrapper: true }
					]
				}
			],
			plugins: [
				'advlist',
				'autolink',
				'lists',
				'link',
				'image',
				'charmap',
				'preview',
				'anchor',
				'searchreplace',
				'code',
				'fullscreen',
				'insertdatetime',
				'media',
				'table',
				'code',
				'help',
				'quickbars',
				'directionality',
				'autoresize',
				'visualblocks'
			],
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
			].join(' | '),
			quickbars_insert_toolbar: '',
			quickbars_selection_toolbar: 'link',
			contextmenu: '',
			toolbar_mode: 'wrap',
			visualblocks_default_state: false,
			end_container_on_empty_block: true,
			relative_urls: false,
			remove_script_host: false,
			newline_behavior: 'default',
			browser_spellcheck: true,
			convert_unsafe_embeds: true
		}),
		[defaultColor, defaultFontFamily, defaultFontSize, fontsOptionsToString]
	);

	return (
		<>
			{text && (
				<Container
					height="fit"
					padding={{ all: 'small' }}
					background={'gray6'}
					crossAlignment="flex-end"
				>
					<Editor
						initialValue={editorTextRef.current}
						init={editorInitConfig}
						onInit={(evt, editor) => {
							editorRef.current = editor;
						}}
						onDirty={onEditorDirty}
					/>
				</Container>
			)}
		</>
	);
};
