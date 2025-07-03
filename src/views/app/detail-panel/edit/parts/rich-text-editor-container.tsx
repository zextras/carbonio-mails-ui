/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useRef } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useIntegratedComponent, useUserSettings } from '@zextras/carbonio-shell-ui';
import type { TinyMCE, Editor } from 'tinymce';

import { buildArrayFromFileList } from 'helpers/files';
import { useEditorAttachments, useEditorText, useEditorTextProvider } from 'store/editor/index';
import { MailsEditorV2 } from 'types/index.d';
import * as StyledComp from 'views/app/detail-panel/edit/parts/edit-view-styled-components';
import { handleEditorPaste } from 'views/app/detail-panel/edit/parts/editor-paste-handler';
import type { TextEditorContainerProps } from 'views/app/detail-panel/edit/parts/text-editor-container';
import { getFonts, getFontSizesOptions } from 'views/settings/components/utils';

type FileSelectProps = {
	editor: TinyMCE;
	files: FileList;
};

export const SAVE_EDITOR_DELAY = 2000;

export const RichTextEditorContainer = ({
	editorId,
	onDragOver
}: TextEditorContainerProps): JSX.Element => {
	const [Composer] = useIntegratedComponent('composer');

	const { getText, setText } = useEditorText(editorId);
	const text = useMemo(() => getText().richText, [getText]);

	const composerRef = useRef<Editor>();
	const initialValue = useRef(text);
	const timeoutId = useRef<NodeJS.Timeout>();

	const { setTextProvider } = useEditorTextProvider(editorId);
	const { addInlineAttachments } = useEditorAttachments(editorId);

	const { prefs } = useUserSettings();

	const getCurrentText = useCallback((): MailsEditorV2['text'] | null => {
		if (!composerRef.current) {
			return null;
		}

		const plainText = composerRef.current.getContent({ format: 'text' });
		const richText = composerRef.current.getContent({ format: 'html' });

		return { plainText, richText };
	}, []);

	const onExternalTextChanges = useCallback((value: MailsEditorV2['text']): void => {
		if (!composerRef.current) {
			return;
		}
		composerRef.current.setContent(value.richText);
	}, []);

	const onComposerInit = useCallback(
		(evt: Event, composer: Editor) => {
			composerRef.current = composer;
			setTextProvider({
				setCurrentText: onExternalTextChanges,
				getCurrentText
			});
		},
		[getCurrentText, onExternalTextChanges, setTextProvider]
	);

	const saveEditor = useCallback(() => {
		if (!composerRef.current) {
			return;
		}

		const plainText = composerRef.current.getContent({ format: 'text' });
		const richText = composerRef.current.getContent({ format: 'html' });
		setText({ plainText, richText }, { syncTextProvider: false });
	}, [setText]);

	const onTextChange = useCallback(() => {
		if (timeoutId.current) {
			clearTimeout(timeoutId.current);
		}
		timeoutId.current = setTimeout(() => {
			if (!composerRef.current) {
				return;
			}
			saveEditor();
			const alreadyFocused = composerRef.current.hasFocus();
			alreadyFocused && composerRef.current?.dispatch('blur');
			composerRef.current?.setDirty(false);
			alreadyFocused && composerRef.current?.focus();
		}, SAVE_EDITOR_DELAY);
	}, [saveEditor]);

	const onComposerClose = useCallback(() => {
		saveEditor();
		composerRef.current = undefined;
		setTextProvider(undefined);
	}, [saveEditor, setTextProvider]);

	const onInlineAttachmentsSelected = useCallback(
		({ editor: tinymce, files: fileList }: FileSelectProps): void => {
			const files = buildArrayFromFileList(fileList);
			addInlineAttachments(files, {
				onSaveComplete: (inlineAttachments) => {
					inlineAttachments.forEach((inlineAttachment) => {
						const img = `&nbsp;<img pnsrc="${inlineAttachment.cidUrl}" data-mce-src="${inlineAttachment.cidUrl}" src="${inlineAttachment.downloadServiceUrl}" /><br/>`;
						tinymce?.activeEditor?.insertContent(img);
					});
				}
			});
		},
		[addInlineAttachments]
	);

	const composerCustomOptions = useMemo(() => {
		const fontSizesOptions = getFontSizesOptions();
		const fontFamilyOptions = getFonts();

		const fontSizesOptionsToString = fontSizesOptions.map((fontSize: string) => fontSize).join(' ');
		const fontsOptionsToString = fontFamilyOptions.map(
			(font: { label: string; value: string }) => `${font.label}=${font.value};`
		);
		return {
			toolbar_sticky: true,
			ui_mode: 'split',
			font_size_formats: fontSizesOptionsToString,
			font_family_formats: fontsOptionsToString,
			content_style: `
            p { margin: 0; }
            body *:not(.signature-div):not(.signature-div *) {
            color: ${prefs?.zimbraPrefHtmlEditorDefaultFontColor};
            font-size: ${prefs?.zimbraPrefHtmlEditorDefaultFontSize};
            font-family: ${prefs?.zimbraPrefHtmlEditorDefaultFontFamily};
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
				if (!editor) return () => {};
				editor.on('paste', (event) => {
					const editViewWrapper = document.querySelector(
						'[data-testid="edit-view-editor"]'
					)?.parentElement;
					const editViewWrapperPrevScrollTop = editViewWrapper?.scrollTop;
					event.preventDefault();
					handleEditorPaste(editor, editorId, event);
					// Restore scroll position. In firefox scrollbar trips on paste event, see bug [CO-1979]
					if (editViewWrapper) editViewWrapper.scrollTop = editViewWrapperPrevScrollTop ?? 0;
				});

				editor.on('input', onTextChange);
				editor.on('remove', onComposerClose);

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
	}, [
		editorId,
		onComposerClose,
		onTextChange,
		prefs?.zimbraPrefHtmlEditorDefaultFontColor,
		prefs?.zimbraPrefHtmlEditorDefaultFontFamily,
		prefs?.zimbraPrefHtmlEditorDefaultFontSize
	]);

	return (
		<Container
			background={'gray6'}
			mainAlignment="flex-start"
			style={{ minHeight: 0, overflow: 'hidden' }}
		>
			<StyledComp.EditorWrapper data-testid="MailEditorWrapper">
				<Composer
					initialValue={initialValue.current}
					onFileSelect={onInlineAttachmentsSelected}
					onDragOver={onDragOver}
					customInitOptions={composerCustomOptions}
					onInit={onComposerInit}
					onDirty={onTextChange}
				/>
			</StyledComp.EditorWrapper>
		</Container>
	);
};
