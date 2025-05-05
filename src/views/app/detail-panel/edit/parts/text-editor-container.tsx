/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo, useRef } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useIntegratedComponent, useUserSettings } from '@zextras/carbonio-shell-ui';
import { debounce, noop } from 'lodash';
import type { Editor, TinyMCE } from 'tinymce/tinymce';

import * as StyledComp from './edit-view-styled-components';
import { handleEditorPaste } from './editor-paste-handler';
import { plainTextToHTML } from '../../../../../commons/utils';
import {
	useEditorIsRichText,
	useEditorText,
	useEditorTextProvider
} from '../../../../../store/editor';
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

export const SAVE_EDITOR_DELAY = 2000;

export const TextEditorContainer: FC<TextEditorContainerProps> = ({
	editorId,
	onDragOver,
	onFilesSelected,
	minHeight,
	disabled
}) => {
	const editorRef = useRef<Editor>();
	const getCurrentText = useCallback((): MailsEditorV2['text'] | null => {
		if (!editorRef.current) {
			return null;
		}

		const plainText = editorRef.current.getContent({ format: 'text' });
		const richText = editorRef.current.getContent({ format: 'html' });

		return { plainText, richText };
	}, []);

	const onExternalTextChanges = useCallback((text: MailsEditorV2['text']): void => {
		if (!editorRef.current) {
			return;
		}
		editorRef.current.setContent(text.richText); // TODO handle plain text too!!!!!
	}, []);

	const { setTextProvider } = useEditorTextProvider(editorId);

	const { getText, setText } = useEditorText(editorId);
	const text = useMemo(() => getText(), [getText]);
	const editorTextRef = useRef(text.richText);

	const saveEditor = useCallback(() => {
		if (!editorRef.current) {
			return;
		}

		const plainText = editorRef.current.getContent({ format: 'text' });
		const richText = editorRef.current.getContent({ format: 'html' });
		setText({ plainText, richText }, { syncTextProvider: false });
	}, [setText]);

	const onEditorInit = useCallback(
		(evt: Event, editor: Editor) => {
			editorRef.current = editor;
			setTextProvider({
				setCurrentText: onExternalTextChanges,
				getCurrentText
			});
		},
		[getCurrentText, onExternalTextChanges, setTextProvider]
	);

	const onInput = useMemo(
		() =>
			debounce(() => {
				if (!editorRef.current) {
					return;
				}
				saveEditor();
				editorRef.current?.dispatch('blur');
				editorRef.current?.setDirty(false);
				editorRef.current?.focus();
			}, SAVE_EDITOR_DELAY),
		[saveEditor]
	);

	const onEditorDirty = useCallback(() => {
		onInput();
	}, [onInput]);

	const [Composer, composerIsAvailable] = useIntegratedComponent('composer');
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

			editor.on('input', () => {
				onInput();
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
									initialValue={editorTextRef.current}
									disabled={disabled}
									onFileSelect={onFilesSelected}
									onDragOver={onDragOver}
									customInitOptions={composerCustomOptions}
									onInit={onEditorInit}
									onDirty={onEditorDirty}
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
