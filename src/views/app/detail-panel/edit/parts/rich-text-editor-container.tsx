/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useRef } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { Composer } from '@zextras/carbonio-ui-text-composer';
import { debounce, noop } from 'lodash';
import type { TinyMCE, Editor } from 'tinymce';

import { buildArrayFromFileList } from 'helpers/files';
import { useEditorAttachments, useEditorText, useEditorTextProvider } from 'store/editor';
import { MailsEditorV2 } from 'types/index.d';
import * as StyledComp from 'views/app/detail-panel/edit/parts/edit-view-styled-components';
import { handleEditorPaste } from 'views/app/detail-panel/edit/parts/editor-paste-handler';
import type { TextEditorContainerProps } from 'views/app/detail-panel/edit/parts/text-editor-container';
import { getFonts, getFontSizesOptions } from 'views/settings/components/utils';

type FileSelectProps = {
	editor: TinyMCE;
	files: FileList | null | undefined;
};

export const SAVE_EDITOR_DELAY = 2000;

export const RichTextEditorContainer = ({
	editorId,
	onDragOver
}: TextEditorContainerProps): JSX.Element => {
	const { getText, setText } = useEditorText(editorId);
	const text = useMemo(() => getText().richText, [getText]);

	const composerRef = useRef<Editor>();
	const initialValue = useRef(text);
	const timeoutId = useRef<NodeJS.Timeout>();

	const { setTextProvider } = useEditorTextProvider(editorId);
	const { addInlineAttachments, removeInlineAttachments } = useEditorAttachments(editorId);

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
		(_evt: Event, composer: Editor) => {
			composerRef.current = composer;
			setTextProvider({
				setCurrentText: onExternalTextChanges,
				getCurrentText
			});
		},
		[getCurrentText, onExternalTextChanges, setTextProvider]
	);

	const cleanupUnusedAttachments = useCallback(
		(html: string) => {
			if (!composerRef.current) return;

			const doc = new DOMParser().parseFromString(html, 'text/html');

			// collect all used attachment IDs
			const usedCids = Array.from(doc.querySelectorAll('img[data-pnsrc], img[src^="cid:"]'))
				.map((img) => img.getAttribute('data-pnsrc') || img.getAttribute('src'))
				.filter((cid): cid is string => Boolean(cid));

			removeInlineAttachments(usedCids);
		},
		[removeInlineAttachments]
	);

	const saveEditor = useCallback(() => {
		if (!composerRef.current) {
			return;
		}

		const plainText = composerRef.current.getContent({ format: 'text' });
		const richText = composerRef.current.getContent({ format: 'html' });

		cleanupUnusedAttachments(richText);
		setText({ plainText, richText }, { syncTextProvider: false });
	}, [cleanupUnusedAttachments, setText]);

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
			if (!fileList) return;
			const files = buildArrayFromFileList(fileList);
			addInlineAttachments(files, {
				onSaveComplete: (inlineAttachments) => {
					inlineAttachments.forEach((inlineAttachment) => {
						const img = `&nbsp;<img alt="Inline attachment" data-pnsrc="${inlineAttachment.cidUrl}" data-mce-src="${inlineAttachment.cidUrl}" src="${inlineAttachment.downloadServiceUrl}" /><br/>`;
						tinymce?.activeEditor?.insertContent(img);
					});
				}
			});
		},
		[addInlineAttachments]
	);

	function createPasteHandler(editor: Editor, editorID: string) {
		return (event: ClipboardEvent): void => {
			const editViewWrapper = document.querySelector(
				'[data-testid="edit-view-editor"]'
			)?.parentElement;
			const editViewWrapperPrevScrollTop = editViewWrapper?.scrollTop;

			handleEditorPaste(editor, editorID, event);

			// Restore scroll position. In firefox scrollbar trips on paste event, see bug [CO-1979]
			if (editViewWrapper) {
				editViewWrapper.scrollTop = editViewWrapperPrevScrollTop ?? 0;
			}
		};
	}

	function setupResizeObserver(editor: Editor): MutationObserver {
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

		return mutationObserver;
	}

	const composerCustomOptions = useMemo(() => {
		const fontSizesOptions = getFontSizesOptions();
		const fontFamilyOptions = getFonts();

		const fontSizesOptionsToString = fontSizesOptions.join(' ');
		const fontsOptionsToString = fontFamilyOptions
			.map((font: { label: string; value: string }) => `${font.label}=${font.value};`)
			.join('');

		return {
			base_url: `${BASE_PATH}`,
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
				'visualblocks',
				'emoticons'
			],
			toolbar: [
				// Fonts
				'fontfamily fontsize styles',
				// Font Style controls
				'forecolor backcolor',
				// Text formatting
				'bold italic underline strikethrough removeformat',
				// Alignment and direction
				'alignleft aligncenter alignright alignjustify outdent indent ltr rtl',
				// Lists and indentation
				'bullist numlist',
				// Insert elements
				'link table insertfile image imageSelector emoticons',
				// View and blocks
				'visualblocks code'
			].join(' | '),

			paste_data_images: false,
			init_instance_callback: (editor: Editor): (() => void) => {
				if (!editor) return noop;

				// Call the init handler
				onComposerInit({} as Event, editor);

				const handlePaste = createPasteHandler(editor, editorId);
				editor.on('paste', handlePaste);
				editor.on('input', onTextChange);
				editor.on('remove', onComposerClose);

				// Handle drag over events
				if (onDragOver) {
					editor.on('dragover', (event: DragEvent) => {
						onDragOver(event);
					});
				}

				const mutationObserver = setupResizeObserver(editor);
				return () => {
					mutationObserver.disconnect();
				};
			}
		};
	}, [
		editorId,
		onComposerClose,
		onComposerInit,
		onDragOver,
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
					customInitOptions={composerCustomOptions}
					accountSettingsPrefs={{
						zimbraPrefLocale: prefs?.zimbraPrefLocale,
						zimbraPrefHtmlEditorDefaultFontFamily: prefs?.zimbraPrefHtmlEditorDefaultFontFamily,
						zimbraPrefHtmlEditorDefaultFontSize: prefs?.zimbraPrefHtmlEditorDefaultFontSize,
						zimbraPrefHtmlEditorDefaultFontColor: prefs?.zimbraPrefHtmlEditorDefaultFontColor
					}}
				/>
			</StyledComp.EditorWrapper>
		</Container>
	);
};
