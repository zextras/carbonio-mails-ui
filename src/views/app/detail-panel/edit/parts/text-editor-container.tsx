/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useIntegratedComponent, useUserSettings } from '@zextras/carbonio-shell-ui';
import type { Editor, TinyMCE } from 'tinymce/tinymce';
import { v4 as uuid } from 'uuid';

import * as StyledComp from './edit-view-styled-components';
import { simpleUploadAttachmentApi } from '../../../../../api/simple-upload-attachments-api';
import { plainTextToHTML } from '../../../../../commons/utils';
import { composeAttachmentDownloadUrl } from '../../../../../helpers/attachments';
import { normalizeMailMessageFromSoap } from '../../../../../normalizations/normalize-message';
import {
	getEditor,
	useEditorIsRichText,
	useEditorsStore,
	useEditorText
} from '../../../../../store/editor';
import {
	buildSavedAttachments,
	composeCidUrlFromContentId
} from '../../../../../store/editor/editor-transformations';
import { getSavedInlineAttachmentByContentId } from '../../../../../store/editor/editor-utils';
import { saveDraftEmailStoreAction } from '../../../../../store/emails/actions/save-draft-action';
import { MailsEditorV2, UnsavedAttachment } from '../../../../../types';
import { getFonts, getFontSizesOptions } from '../../../../settings/components/utils';

export type TextEditorContent = { plainText: string; richText: string };

export type TextEditorContainerProps = {
	editorId: MailsEditorV2['id'];
	onDragOver: (event: React.DragEvent) => void;
	onFilesSelected: ({ editor, files }: { editor: TinyMCE; files: FileList }) => void;
	minHeight: number;
	disabled: boolean;
};

type UploadImageResult = {
	downloadServiceUrl: string;
	cidUrl: string | undefined;
	contentId: string;
	fileName: string;
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

	async function uploadImage(file: File): Promise<UploadImageResult> {
		const { aid } = await simpleUploadAttachmentApi(file);
		const contentId = `${aid}@carbonio`;

		// Create unsaved attachment
		const unsavedAttachment: UnsavedAttachment = {
			filename: file.name,
			contentType: file.type,
			size: file.size,
			contentId,
			aid,
			uploadId: uuid(),
			isInline: true,
			uploadStatus: {
				status: 'running',
				progress: 0
			}
		};

		// Update editor state
		const editor = getEditor({ id: editorId }) as MailsEditorV2;
		const updatedEditor: MailsEditorV2 = {
			...editor,
			unsavedAttachments: [...editor.unsavedAttachments, unsavedAttachment]
		};

		// Save draft and wait for response
		const saveDraftResponse = await saveDraftEmailStoreAction({ editor: updatedEditor });

		if (!saveDraftResponse?.m?.[0]) {
			throw new Error('No message found in save draft response');
		}

		// Process the response
		const mailMessage = normalizeMailMessageFromSoap(saveDraftResponse.m[0], true);
		const editorsStore = useEditorsStore.getState();

		// Update store
		editorsStore.setDid(editorId, mailMessage.id);
		editorsStore.setSize(editorId, mailMessage.size);
		editorsStore.removeUnsavedAttachments(editorId);

		// Handle saved attachments
		const savedAttachments = buildSavedAttachments(mailMessage);
		editorsStore.setSavedAttachments(editorId, savedAttachments);

		// Find the inline attachment
		const newEditor = getEditor({ id: editorId }) as MailsEditorV2;
		const savedInlineAttachment = getSavedInlineAttachmentByContentId(
			contentId,
			newEditor.savedAttachments
		);

		if (!savedInlineAttachment?.contentId) {
			throw new Error('Inline attachment not found after upload');
		}

		return {
			contentId: savedInlineAttachment.contentId,
			cidUrl: composeCidUrlFromContentId(savedInlineAttachment.contentId) ?? undefined,
			downloadServiceUrl: composeAttachmentDownloadUrl(savedInlineAttachment),
			fileName: file.name
		};
	}

	const handleEditorPaste = (editor: Editor, event: ClipboardEvent): void => {
		const { clipboardData } = event;
		if (!clipboardData) return;

		Array.from(clipboardData.items)
			.filter((item) => item.type.includes('image'))
			.forEach((item) => {
				const file = item.getAsFile();
				if (!file) return;
				editor.setProgressState(true);
				uploadImage(file)
					.then((uploadImageResult: UploadImageResult) => {
						if (!(uploadImageResult && uploadImageResult.cidUrl)) {
							throw new Error('No CID URL found in upload response');
						}
						editor.insertContent(
							`<img alt="${uploadImageResult.fileName}" src="${uploadImageResult.downloadServiceUrl}" 
                          data-mce-src="${uploadImageResult.cidUrl}" />`
						);
					})
					.catch((error) => console.error('Image Upload error:', error))
					.finally(() => editor.setProgressState(false));
			});
	};

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
		].join(' | '),
		paste_data_images: false,
		init_instance_callback: (editor: Editor): (() => void) => {
			if (!editor) return () => {};
			editor.on('paste', (event) => handleEditorPaste(editor, event));
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
									value={text.richText}
									disabled={disabled}
									onFileSelect={onFilesSelected}
									onEditorChange={(ev: [string, string]): void => {
										if (isFirstChangeEventFired)
											onTextChanged({ plainText: ev[0], richText: ev[1] });
									}}
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
