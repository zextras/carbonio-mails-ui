/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useState } from 'react';

import { v4 as uuid } from 'uuid';
import { Container } from '@zextras/carbonio-design-system';
import { useIntegratedComponent, useUserSettings } from '@zextras/carbonio-shell-ui';
import type { TinyMCE } from 'tinymce/tinymce';

import * as StyledComp from './edit-view-styled-components';
import { uploadAttachmentApi } from '../../../../../api/upload-attachments-api';
import { plainTextToHTML } from '../../../../../commons/utils';
import { blobToFile } from '../../../../../helpers/files';
import {
	getEditor,
	useEditorIsRichText,
	useEditorsStore,
	useEditorText,
	useSaveDraftFromEditor
} from '../../../../../store/editor';
import { saveDraftEmailStoreAction } from '../../../../../store/emails/actions/save-draft-action';
import {
	AttachmentUploadProcessStatus,
	MailsEditorV2,
	UnsavedAttachment
} from '../../../../../types';
import { getFontSizesOptions, getFonts } from '../../../../settings/components/utils';
import {
	filterUnsavedInlineAttachment,
	getSavedInlineAttachmentByContentId,
	getSavedInlineAttachmentsByContentId
} from '../../../../../store/editor/editor-utils';
import {
	buildSavedAttachments,
	composeCidUrlFromContentId
} from '../../../../../store/editor/editor-transformations';
import { composeAttachmentDownloadUrl } from '../../../../../helpers/attachments';
import produce from 'immer';
import { normalizeMailMessageFromSoap } from '../../../../../normalizations/normalize-message';
import { simpleUploadAttachmentApi } from '../../../../../api/simple-upload-attachments-api';

type ProgressFn = (percent: number) => void;

interface BlobInfo {
	id: () => string;
	name: () => string;
	filename: () => string;
	blob: () => Blob;
	base64: () => string;
	blobUri: () => string;
	uri: () => string | undefined;
}

type UploadHandler = (blobInfo: BlobInfo, progress: ProgressFn) => Promise<string>;

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

	const { debouncedSaveDraft, immediateSaveDraft } = useSaveDraftFromEditor();
	const defaultFontFamily = prefs?.zimbraPrefHtmlEditorDefaultFontFamily;
	const defaultFontSize = prefs?.zimbraPrefHtmlEditorDefaultFontSize;
	const defaultColor = prefs?.zimbraPrefHtmlEditorDefaultFontColor;

	const fontSizesOptionsToString = fontSizesOptions.map((fontSize: string) => fontSize).join(' ');
	const fontsOptionsToString = fontFamilyOptions.map(
		(font: { label: string; value: string }) => `${font.label}=${font.value};`
	);

	const imagesUploadCallback: UploadHandler = useCallback(
		async (blobInfo, progress) => {
			try {
				progress(0);
				const file = blobToFile(blobInfo);

				// upload api call
				const { aid } = await simpleUploadAttachmentApi(file);
				progress(10);

				// prepare editor for save draft
				const contentId = `${aid}@carbonio`;

				const unsavedAttachment: UnsavedAttachment = {
					filename: file.name,
					contentType: file.type,
					size: file.size,
					contentId,
					aid,
					uploadId: uuid(),
					isInline: true,
					uploadStatus: {
						status: 'running' as AttachmentUploadProcessStatus['status'],
						progress: 0
					}
				};
				const editor = getEditor({ id: editorId }) as MailsEditorV2;

				const editorWithUnsavedAttachments: MailsEditorV2 = {
					...editor,
					unsavedAttachments: [...editor.unsavedAttachments, unsavedAttachment]
				};

				const k = filterUnsavedInlineAttachment(editorWithUnsavedAttachments.unsavedAttachments);
				console.log('@@@@', { k });
				progress(60);
				console.log('@@editor with attachments', { editorWithUnsavedAttachments });
				progress(70);
				// debouncedSaveDraft(editorId);

				// save draft with unsavedAttachment
				const response = await saveDraftEmailStoreAction({
					editor: editorWithUnsavedAttachments
				});

				const mailMessage = normalizeMailMessageFromSoap(response.m[0], true);
				useEditorsStore.getState().setDid(editorId, mailMessage.id);
				useEditorsStore.getState().setSize(editorId, mailMessage.size);
				useEditorsStore.getState().removeUnsavedAttachments(editorId);
				const savedAttachments = buildSavedAttachments(mailMessage);

				useEditorsStore.getState().setSavedAttachments(editorId, savedAttachments);

				// await saveDraftEmailStoreAction({ editor: editorWithUnsavedAttachments });
				const newEditor = getEditor({ id: editorId }) as MailsEditorV2;
				console.log('@@ newEditor', { newEditor });
				const savedInlineAttachment = getSavedInlineAttachmentByContentId(
					contentId,
					newEditor.savedAttachments
				);

				const inlineInfo = {
					contentId: savedInlineAttachment.contentId,
					cidUrl: savedInlineAttachment.contentId
						? (composeCidUrlFromContentId(savedInlineAttachment.contentId) ?? undefined)
						: undefined,
					downloadServiceUrl: composeAttachmentDownloadUrl(savedInlineAttachment)
				};

				// const editornew = await saveDraftEmailStoreAction({ editor });
				// console.log('@@editornew', { editornew });
				progress(99);

				tinymce?.activeEditor?.insertContent(img);
				return inlineInfo.downloadServiceUrl;
			} catch (error) {
				console.error('Upload failed:', error);
				throw error; // Reject the Promise
			}
		},
		[editorId]
	);

	const composerCustomOptions = {
		images_upload_handler: imagesUploadCallback,
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
		init_instance_callback: (editor: TinyMCE): (() => void) => {
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
