/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react';

import { Editor as Composer } from '@tinymce/tinymce-react';
import { Container } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { t } from 'i18next';
import { debounce, noop } from 'lodash';
import { Ui, Editor, TinyMCE } from 'tinymce';
// import type { Editor, TinyMCE } from 'tinymce/tinymce';

import { handleEditorPaste } from './editor-paste-handler';
import { useEditorIsRichText, useEditorText } from '../../../../../store/editor';
import { MailsEditorV2 } from '../../../../../types';
import { getFonts, getFontSizesOptions } from '../../../../settings/components/utils';

export type TextEditorContent = { plainText: string; richText: string };

export type TextEditorContainerProps = {
	editorId: MailsEditorV2['id'];
	onDragOver: (event: React.DragEvent) => void;
	onFilesSelected: ({ editor, files }: { editor: TinyMCE; files: FileList }) => void;
	minHeight: number;
	disabled: boolean;
};

export const SAVE_EDITOR_DELAY = 700;

export const TextEditorContainer: FC<TextEditorContainerProps> = ({
	editorId,
	onDragOver,
	onFilesSelected,
	minHeight,
	disabled
}) => {
	const { text, setText } = useEditorText(editorId);

	const editorTextRef = useRef(text.richText);
	const resetDirtyTimeoutHandle = useRef<NodeJS.Timeout>();
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

	const setEditorDirty = useCallback(() => {
		clearTimeout(resetDirtyTimeoutHandle.current);
		resetDirtyTimeoutHandle.current = setTimeout(() => {
			if (!editorRef.current) {
				return;
			}
			editorRef.current?.save();
		}, SAVE_EDITOR_DELAY / 2);
	}, []);

	const onEditorDirty = useCallback(() => {
		// saveEditor();
		// setEditorDirty();
	}, [saveEditor, setEditorDirty]);

	// const [Composer, composerIsAvailable] = useIntegratedComponent('composer');
	const { isRichText } = useEditorIsRichText(editorId);

	const onTextChanged = useCallback(
		(txt: TextEditorContent): void => {
			setText({ plainText: txt.plainText, richText: txt.richText });
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
		content_style: `
            p { margin: 0; }
            body *:not(.signature-div):not(.signature-div *) {
            color: ${defaultColor};
            font-size: ${defaultFontSize};
            font-family: ${defaultFontFamily};
            }`,
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

		paste_data_images: false,
		init_instance_callback: (editor: Editor): (() => void) => {
			if (!editor) return noop;
			editor.on('paste', (event) => {
				handleEditorPaste(editor, editorId, event);
			});

			const mutationObserver = new MutationObserver(() => {
				editor.dispatch('ResizeWindow');
			});
			const boardElement = document.querySelector('[data-testid="NewItemContainer"]');
			if (boardElement) {
				mutationObserver.observe(boardElement, {
					attributes: true,
					attributeFilter: ['style']
				});
			}

			return () => {
				mutationObserver.disconnect();
			};
		}
	};

	useEffect(() => (): void => clearTimeout(resetDirtyTimeoutHandle.current), []);

	const setupCallback = useCallback(
		(editor) => {
			if (onFilesSelected)
				editor.ui.registry.addMenuButton('imageSelector', {
					icon: 'gallery',
					tooltip: t('label.select_image', 'Select image'),
					fetch: (callback) => {
						const items: Ui.Menu.MenuItemSpec[] = [
							{
								type: 'menuitem',
								text: 'ciccio',
								onAction: (): void => {
									noop();
								}
							}
						];
						callback(items);
					}
				});
		},
		[onFilesSelected]
	);

	const editorInitConfig = useMemo(
		() => ({
			// content_css: `${BASE_PATH}/tinymce/skins/content/default/content.css`,
			// language_url: `${BASE_PATH}tinymce/langs/${language}.js`,
			// language,
			setup: setupCallback,
			min_height: 350,
			auto_focus: true,
			menubar: false,
			statusbar: false,
			branding: false,
			resize: true,
			inline: false,
			object_resizing: 'img',
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
			convert_unsafe_embeds: true,
			height: '500px', dfgksl;fk sdl;kf ls;kf ls;kf;l sk;
			...composerCustomOptions
		}),
		[composerCustomOptions, setupCallback]
	);

	return (
		<>
			{text && (
				<Container
					height="fit"
					padding={{ all: 'small' }}
					background="gray6"
					crossAlignment="flex-end"
				>
					<Composer
						apiKey="a73bpt8nuwzn1fjpu4ybbw3ai0aa40duhorng25ht81smzep"
						init={editorInitConfig}
						initialValue={editorTextRef.current}
					/>
					{/* {isRichText && composerIsAvailable ? ( */}
					{/*	<Container */}
					{/*		background="gray6" */}
					{/*		mainAlignment="flex-start" */}
					{/*		style={{ minHeight, overflow: 'hidden' }} */}
					{/*	> */}
					{/*		<StyledComp.EditorWrapper data-testid="MailEditorWrapper"> */}
					{/*			<Composer */}
					{/*				initialValue={editorTextRef.current} */}
					{/*				disabled={disabled} */}
					{/*				onFileSelect={onFilesSelected} */}
					{/*				onDragOver={onDragOver} */}
					{/*				customInitOptions={composerCustomOptions} */}
					{/*				onInit={(evt: Event, editor: Editor) => { */}
					{/*					editorRef.current = editor; */}
					{/*				}} */}
					{/*				onDirty={onEditorDirty} */}
					{/*			/> */}
					{/*		</StyledComp.EditorWrapper> */}
					{/*	</Container> */}
					{/* ) : ( */}
					{/*	<Container background="gray6" height="fit"> */}
					{/*		<StyledComp.TextArea */}
					{/*			data-testid="MailPlainTextEditor" */}
					{/*			value={text.plainText} */}
					{/*			style={{ fontFamily: defaultFontFamily }} */}
					{/*			onFocus={(ev): void => { */}
					{/*				ev.currentTarget.setSelectionRange(0, null); */}
					{/*			}} */}
					{/*			onChange={(ev): void => { */}
					{/*				onTextChanged({ */}
					{/*					plainText: ev.target.value, */}
					{/*					richText: plainTextToHTML(ev.target.value) */}
					{/*				}); */}
					{/*			}} */}
					{/*		/> */}
					{/*	</Container> */}
					{/* )} */}
				</Container>
			)}
		</>
	);
};
