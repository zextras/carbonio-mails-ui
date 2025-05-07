/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ChangeEvent, FC, useCallback, useEffect, useMemo, useRef } from 'react';

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

export type TextEditorContainerProps = {
	editorId: MailsEditorV2['id'];
	onDragOver: (event: React.DragEvent) => void;
	onFilesSelected: ({ editor, files }: { editor: TinyMCE; files: FileList }) => void;
	minHeight: number;
	disabled: boolean;
};

export const SAVE_EDITOR_DELAY = 2000;

const RichTextEditorContainer = ({
	editorId,
	minHeight,
	disabled,
	onDragOver,
	onFilesSelected
}: {
	editorId: MailsEditorV2['id'];
	onDragOver: (event: React.DragEvent) => void;
	onFilesSelected: ({ editor, files }: { editor: TinyMCE; files: FileList }) => void;
	minHeight: number;
	disabled: boolean;
}): JSX.Element => {
	const [Composer] = useIntegratedComponent('composer');

	const { getText, setText } = useEditorText(editorId);
	const text = useMemo(() => getText(), [getText]);
	const editorRef = useRef<Editor>();
	const editorTextRef = useRef(text);
	const timeoutId = useRef<NodeJS.Timeout>();
	const { setTextProvider } = useEditorTextProvider(editorId);

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

	const getCurrentText = useCallback((): MailsEditorV2['text'] | null => {
		if (!editorRef.current) {
			return null;
		}

		const plainText = editorRef.current.getContent({ format: 'text' });
		const richText = editorRef.current.getContent({ format: 'html' });

		return { plainText, richText };
	}, []);

	const onExternalTextChanges = useCallback((value: MailsEditorV2['text']): void => {
		if (!editorRef.current) {
			return;
		}
		editorRef.current.setContent(value.richText);
	}, []);

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

	const saveEditor = useCallback(() => {
		if (!editorRef.current) {
			return;
		}

		const plainText = editorRef.current.getContent({ format: 'text' });
		const richText = editorRef.current.getContent({ format: 'html' });
		setText({ plainText, richText }, { syncTextProvider: false });
	}, [setText]);

	const onRichTextChange = useCallback(() => {
		if (timeoutId.current) {
			clearTimeout(timeoutId.current);
		}
		timeoutId.current = setTimeout(() => {
			if (!editorRef.current) {
				return;
			}
			saveEditor();
			const alreadyFocused = editorRef.current.hasFocus();
			alreadyFocused && editorRef.current?.dispatch('blur');
			editorRef.current?.setDirty(false);
			alreadyFocused && editorRef.current?.focus();
		}, SAVE_EDITOR_DELAY);
	}, [saveEditor]);

	const onEditorClose = useCallback(() => {
		saveEditor();
		editorRef.current = undefined;
		setTextProvider(undefined);
	}, [saveEditor, setTextProvider]);

	const composerCustomOptions = useMemo(
		() => ({
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

				editor.on('input', onRichTextChange);

				editor.on('remove', onEditorClose);

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
		}),
		[
			defaultColor,
			defaultFontFamily,
			defaultFontSize,
			editorId,
			fontSizesOptionsToString,
			fontsOptionsToString,
			onEditorClose,
			onRichTextChange
		]
	);

	return (
		<Container
			background={'gray6'}
			mainAlignment="flex-start"
			style={{ minHeight, overflow: 'hidden' }}
		>
			<StyledComp.EditorWrapper data-testid="MailEditorWrapper">
				<Composer
					initialValue={editorTextRef.current.richText}
					disabled={disabled}
					onFileSelect={onFilesSelected}
					onDragOver={onDragOver}
					customInitOptions={composerCustomOptions}
					onInit={onEditorInit}
					onDirty={onRichTextChange}
				/>
			</StyledComp.EditorWrapper>
		</Container>
	);
};

export const PlainTextEditorContainer = ({
	editorId
}: {
	editorId: MailsEditorV2['id'];
}): JSX.Element => {
	const textAreaRef = useRef<HTMLTextAreaElement>(null);
	const { getText, setText } = useEditorText(editorId);
	const { prefs } = useUserSettings();
	const { setTextProvider } = useEditorTextProvider(editorId);
	const text = useMemo(() => getText(), [getText]);
	const editorTextRef = useRef(text);
	const defaultFontFamily = prefs?.zimbraPrefHtmlEditorDefaultFontFamily;

	const getTextareaCurrentText = useCallback((): MailsEditorV2['text'] | null => {
		if (!textAreaRef.current) {
			return null;
		}

		const plainText = textAreaRef.current.value;
		const richText = plainTextToHTML(plainText);

		return { plainText, richText };
	}, []);

	const onTextareaExternalTextChanges = useCallback((value: MailsEditorV2['text']): void => {
		if (!textAreaRef.current) {
			return;
		}
		textAreaRef.current.value = value.plainText;
	}, []);

	const onTextChanged = useMemo(
		() =>
			debounce((ev: ChangeEvent<HTMLTextAreaElement>): void => {
				setText(
					{ plainText: ev.target.value, richText: plainTextToHTML(ev.target.value) },
					{ syncTextProvider: false }
				);
			}, SAVE_EDITOR_DELAY),
		[setText]
	);

	const textProviderValue = useMemo(
		() => ({
			setCurrentText: onTextareaExternalTextChanges,
			getCurrentText: getTextareaCurrentText
		}),
		[getTextareaCurrentText, onTextareaExternalTextChanges]
	);

	useEffect(() => {
		setTextProvider(textProviderValue);
		const ref = textAreaRef?.current;
		return (): void => {
			if (ref) {
				setText(
					{
						plainText: ref.value,
						richText: plainTextToHTML(ref.value)
					},
					{ syncTextProvider: false }
				);
			}
			setTextProvider(undefined);
		};
	}, [setText, setTextProvider, textProviderValue]);

	return (
		<Container background={'gray6'} height="fit">
			<StyledComp.TextArea
				data-testid="MailPlainTextEditor"
				ref={textAreaRef}
				defaultValue={editorTextRef.current.plainText}
				style={{ fontFamily: defaultFontFamily }}
				onFocus={(ev): void => {
					ev.currentTarget.setSelectionRange(0, null);
				}}
				onChange={onTextChanged}
			/>
		</Container>
	);
};

export const TextEditorContainer: FC<TextEditorContainerProps> = ({
	editorId,
	onDragOver,
	onFilesSelected,
	minHeight,
	disabled
}) => {
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
				<RichTextEditorContainer
					editorId={editorId}
					disabled={disabled}
					minHeight={minHeight}
					onDragOver={onDragOver}
					onFilesSelected={onFilesSelected}
				/>
			) : (
				<PlainTextEditorContainer editorId={editorId} />
			)}
		</Container>
	);
};
