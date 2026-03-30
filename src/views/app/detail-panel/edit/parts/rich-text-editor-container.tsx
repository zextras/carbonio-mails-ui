/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useRef } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { AccountSettingsPrefs } from '@zextras/carbonio-ui-soap-lib';
import { Composer } from '@zextras/carbonio-ui-text-composer';
import { noop } from 'lodash';
import type { TinyMCE, Editor } from 'tinymce';

import { editorUtils } from './editor-utils';
import { useEditorSetDirty } from '../../../../../store/editor/hooks/statuses';
import { TINYMCE_BASE_CONTENT_STYLES } from 'constants/tinymce-content-styles';
import { buildArrayFromFileList } from 'helpers/files';
import {
	applyUserPreferenceStyles,
	generateUserPreferenceStyles,
	UserPreferenceStyle
} from 'helpers/user-preference-styles';
import {
	useEditorAttachments,
	useEditorsStore,
	useEditorText,
	useEditorTextProvider
} from 'store/editor';
import { MailsEditorV2 } from 'types/editor';
import * as StyledComp from 'views/app/detail-panel/edit/parts/edit-view-styled-components';
import { handleEditorPaste } from 'views/app/detail-panel/edit/parts/editor-paste-handler';
import type { TextEditorContainerProps } from 'views/app/detail-panel/edit/parts/text-editor-container';
import { getFonts, getFontSizesOptions } from 'views/settings/components/utils';

type FileSelectProps = {
	editor: TinyMCE;
	files: FileList | null | undefined;
};

type InlineAttachment = {
	contentId: string | undefined;
	cidUrl: string | undefined;
	downloadServiceUrl: string | undefined;
};

export const SAVE_EDITOR_DELAY = 2000;

function getUserPreferenceStyle(prefs: AccountSettingsPrefs): UserPreferenceStyle {
	return {
		font: prefs?.zimbraPrefHtmlEditorDefaultFontFamily,
		fontSize: prefs?.zimbraPrefHtmlEditorDefaultFontSize,
		color: prefs?.zimbraPrefHtmlEditorDefaultFontColor
	};
}

export const RichTextEditorContainer = ({
	editorId,
	onDragOver
}: TextEditorContainerProps): JSX.Element => {
	const { getText, setText } = useEditorText(editorId);
	const text = useMemo(() => getText().richText, [getText]);
	const { setDirty } = useEditorSetDirty(editorId);
	const composerRef = useRef<Editor>();
	const initialValue = useRef(text);
	const timeoutId = useRef<NodeJS.Timeout>();

	const { setTextProvider } = useEditorTextProvider(editorId);
	const { addInlineAttachments, keepOnlyInlineAttachments } = useEditorAttachments(editorId);

	const { prefs } = useUserSettings();

	const getCurrentText = useCallback((): MailsEditorV2['text'] | null => {
		if (!composerRef.current) {
			return null;
		}

		const plainText = composerRef.current.getContent({ format: 'text' });
		const richText = composerRef.current.getContent({ format: 'html' });

		return { plainText, richText };
	}, []);

	const onExternalTextChanges = useCallback(
		(value: MailsEditorV2['text']): void => {
			if (!composerRef.current) {
				return;
			}
			setDirty();
			composerRef.current.setContent(value.richText);
		},
		[setDirty]
	);

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
			const { usedCids } = editorUtils.retrieveCIdsFromContent({ htmlContent: html });
			keepOnlyInlineAttachments(usedCids);
		},
		[keepOnlyInlineAttachments]
	);

	const saveEditor = useCallback(() => {
		if (!composerRef.current) {
			return;
		}

		const plainText = composerRef.current.getContent({ format: 'text' });
		let richText = composerRef.current.getContent({ format: 'html' });

		const style = getUserPreferenceStyle(prefs);

		richText = applyUserPreferenceStyles(richText, style, TINYMCE_BASE_CONTENT_STYLES);

		cleanupUnusedAttachments(richText);
		setText({ plainText, richText }, { syncTextProvider: false });
	}, [prefs, cleanupUnusedAttachments, setText]);

	const onTextChange = useCallback(() => {
		setDirty();
		if (timeoutId.current) {
			clearTimeout(timeoutId.current);
		}
		timeoutId.current = setTimeout(() => {
			if (!composerRef.current) {
				return;
			}
			saveEditor();
			composerRef.current?.setDirty(false);
		}, SAVE_EDITOR_DELAY);
	}, [saveEditor, setDirty]);

	const onComposerClose = useCallback(() => {
		if (useEditorsStore.getState().editors[editorId]?.isDirty) {
			saveEditor();
		}

		composerRef.current = undefined;
		setTextProvider(undefined);
	}, [editorId, saveEditor, setTextProvider]);

	const onInlineAttachmentsSelected = useCallback(
		({ editor: tinymce, files: fileList }: FileSelectProps): void => {
			if (!fileList) return;
			const files = buildArrayFromFileList(fileList);

			const insertSingleInlineAttachment = async (
				editor: TinyMCE,
				inlineAttachment: InlineAttachment
			): Promise<void> => {
				const url = inlineAttachment.downloadServiceUrl;
				if (!url) return;
				// get the updated image in order to avoid TinyMCE caching issues
				const blob = await fetch(url).then((r) => r.blob());
				const objectUrl = URL.createObjectURL(blob);

				const img = `&nbsp;<img alt="Inline attachment"
                data-pnsrc="${inlineAttachment.cidUrl}"
                data-mce-src="${inlineAttachment.cidUrl}"
                src="${objectUrl}" /><br/>`;

				editor?.activeEditor?.insertContent(img);
				onTextChange();
			};

			const handleSaveComplete = (inlineAttachments: InlineAttachment[]): void => {
				const editor = tinymce;
				const insertPromises = inlineAttachments.map((inlineAttachment) =>
					insertSingleInlineAttachment(editor, inlineAttachment)
				);

				Promise.all(insertPromises).catch(console.error);
			};

			addInlineAttachments(files, {
				onSaveComplete: handleSaveComplete
			});
		},
		[addInlineAttachments, onTextChange]
	);

	const createPasteHandler = useCallback(
		(editor: Editor, editorID: string) =>
			async (event: ClipboardEvent): Promise<void> => {
				const editViewWrapper = document.querySelector(
					'[data-testid="edit-view-editor"]'
				)?.parentElement;
				await handleEditorPaste(editor, editorID, event);

				// Restore scroll position. In firefox scrollbar trips on paste event, see bug [CO-1979]
				if (editViewWrapper) {
					editViewWrapper.scrollTop = editorUtils.calculateScrollTop(editViewWrapper).position;
				}

				onTextChange();
			},
		[onTextChange]
	);

	// Allow the TinyMCE stick toolbar to remain fixed when the board is resized manually or toggled minimized/maximized
	const setupResizeObserver = useCallback((editor: Editor): ResizeObserver | null => {
		const boardElement = document.querySelector('[data-testid="MailEditorWrapper"]');
		if (!boardElement) {
			return null;
		}

		const observer = new ResizeObserver(() => {
			editor.dispatch('ResizeWindow');
		});
		observer.observe(boardElement);

		return observer;
	}, []);

	// Allow the TinyMCE stick toolbar to remain fixed when the board is moved
	const setupMutationObserver = useCallback((editor: Editor): MutationObserver | null => {
		const boardElement = document.querySelector('[data-testid="NewItemContainer"]');
		if (!boardElement) {
			return null;
		}

		const observer = new MutationObserver(() => {
			editor.dispatch('ResizeWindow');
		});

		observer.observe(boardElement, {
			attributes: true,
			attributeFilter: ['style']
		});

		return observer;
	}, []);

	const composerCustomOptions = useMemo(() => {
		const fontSizesOptions = getFontSizesOptions();
		const fontFamilyOptions = getFonts();

		const fontSizesOptionsToString = fontSizesOptions.join(' ');
		const fontsOptionsToString = fontFamilyOptions
			.map((font: { label: string; value: string }) => `${font.label}=${font.value};`)
			.join('');

		const style = getUserPreferenceStyle(prefs);
		const userPreferenceStyles = generateUserPreferenceStyles(style);

		return {
			base_url: `${BASE_PATH}`,
			toolbar_sticky: true,
			ui_mode: 'split',
			font_size_formats: fontSizesOptionsToString,
			font_family_formats: fontsOptionsToString,
			preview_styles: false,
			content_css: false,
			content_style: `${TINYMCE_BASE_CONTENT_STYLES}\n\t\t${userPreferenceStyles}`,
			style_formats: [
				// Headers
				{ title: 'Heading 1', format: 'h1' },
				{ title: 'Heading 2', format: 'h2' },
				{ title: 'Heading 3', format: 'h3' },
				{ title: 'Heading 4', format: 'h4' },
				{ title: 'Heading 5', format: 'h5' },
				{ title: 'Heading 6', format: 'h6' },
				{ title: '' },
				// Blocks
				{ title: 'Paragraph', format: 'p' },
				{ title: 'Pre', format: 'pre' },
				{ title: 'Blockquote', format: 'blockquote' }
			],
			plugins: [
				'advlist', // Enhances list functionality
				'lists', // List support (bullist/numlist)
				'link', // Link insertion
				'autolink', // convert text link into clickable link
				'image', // Image handling
				'table', // Table support
				'code', // Code view
				'charmap', // Special characters
				'quickbars', // Context toolbars
				'directionality', // LTR/RTL support
				'autoresize', // Auto-resize editor
				'visualblocks', // Show block boundaries
				'emoticons' // Emoji support
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
				'link table insertfile image imageSelector charmap emoticons',
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
				editor.on('change', onTextChange);
				editor.on('remove', onComposerClose);

				// Handle drag over events
				if (onDragOver) {
					editor.on('dragover', (event: DragEvent) => {
						onDragOver(event);
					});
				}

				const resizeObserver = setupResizeObserver(editor);
				const mutationObserver = setupMutationObserver(editor);
				return () => {
					resizeObserver?.disconnect();
					mutationObserver?.disconnect();
				};
			}
		};
	}, [
		createPasteHandler,
		editorId,
		onComposerClose,
		onComposerInit,
		onDragOver,
		onTextChange,
		prefs,
		setupMutationObserver,
		setupResizeObserver
	]);

	return (
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
	);
};
