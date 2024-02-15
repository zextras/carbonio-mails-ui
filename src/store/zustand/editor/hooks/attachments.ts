/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getBridgedFunctions, t } from '@zextras/carbonio-shell-ui';
import { omit, reject } from 'lodash';

import { computeAndUpdateEditorStatus } from './commons';
import { getEditor } from './editors';
import { debouncedSaveDraftFromEditor, SaveDraftOptions } from './save-draft';
import { TIMEOUTS } from '../../../../constants';
import { composeAttachmentDownloadUrl } from '../../../../helpers/attachments';
import { AttachmentUploadProcessStatus, MailsEditorV2, UnsavedAttachment } from '../../../../types';
import {
	uploadAttachments,
	UploadAttachmentsOptions,
	UploadCallbacks
} from '../../../actions/upload-attachments';
import { composeCidUrlFromContentId } from '../editor-transformations';
import {
	filterUnsavedAttachmentsByUploadId,
	getSavedInlineAttachmentsByContentId
} from '../editor-utils';
import { useEditorsStore } from '../store';

const notifyUploadError = (file: File, err: string): void => {
	getBridgedFunctions()?.createSnackbar({
		key: `upload-error`,
		replace: true,
		type: 'error',
		label: t('label.errors.upload_failed_generic', {
			filename: file.name,
			defaultValue: 'Upload failed for the file "{{filename}}"'
		}),
		autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT
	});
};

export const useEditorAttachments = (
	editorId: MailsEditorV2['id']
): {
	hasStandardAttachments: boolean;
	unsavedStandardAttachments: MailsEditorV2['unsavedAttachments'];
	savedStandardAttachments: MailsEditorV2['savedAttachments'];
	addStandardAttachments: (
		files: Array<File>,
		callbacks?: UploadCallbacks
	) => Array<UnsavedAttachment>;
	addUploadedAttachment: (uploadId: string) => UnsavedAttachment;
	addInlineAttachments: (
		files: Array<File>,
		options?: UploadCallbacks & {
			onSaveComplete?: (
				inlineAttachments: Array<{
					contentId: string | undefined;
					cidUrl: string | undefined;
					downloadServiceUrl: string | undefined;
				}>
			) => void;
		}
	) => Array<UnsavedAttachment>;
	removeSavedAttachment: (partName: string) => void;
	removeUnsavedAttachment: (uploadId: string) => void;
	removeStandardAttachments: () => void;
} => {
	const unsavedStandardAttachments = reject(
		useEditorsStore((state) => state.editors[editorId].unsavedAttachments),
		'isInline'
	);
	const savedStandardAttachments = reject(
		useEditorsStore((state) => state.editors[editorId].savedAttachments),
		'isInline'
	);
	const removeStandardAttachmentsInvoker = useEditorsStore(
		(state) => state.clearStandardAttachments
	);
	const removeSavedAttachmentsInvoker = useEditorsStore((state) => state.removeSavedAttachment);
	const removeUnsavedAttachmentsInvoker = useEditorsStore((state) => state.removeUnsavedAttachment);

	const addGenericUnsavedAttachments = (
		files: Array<File>,
		areInline: boolean,
		callbacks?: UploadAttachmentsOptions
	): Array<UnsavedAttachment> => {
		const options: UploadAttachmentsOptions = {
			onUploadProgress: (file: File, uploadId: string, percentage: number): void => {
				const setUploadStatus = useEditorsStore.getState().setAttachmentUploadStatus;
				const status: AttachmentUploadProcessStatus = {
					status: 'running',
					progress: percentage
				};
				setUploadStatus(editorId, uploadId, status);
				callbacks?.onUploadProgress && callbacks.onUploadProgress(file, uploadId, percentage);
			},

			onUploadError: (file: File, uploadId: string, error: string): void => {
				const setUploadStatus = useEditorsStore.getState().setAttachmentUploadStatus;
				const status: AttachmentUploadProcessStatus = {
					status: 'aborted',
					abortReason: error
				};
				notifyUploadError(file, error);
				setUploadStatus(editorId, uploadId, status);
				computeAndUpdateEditorStatus(editorId);
				callbacks?.onUploadError && callbacks.onUploadError(file, uploadId, error);
			},

			onUploadComplete: (file: File, uploadId: string, attachmentId: string): void => {
				const setUploadCompleted = useEditorsStore.getState().setAttachmentUploadCompleted;
				setUploadCompleted(editorId, uploadId, attachmentId);
				computeAndUpdateEditorStatus(editorId);
				callbacks?.onUploadComplete && callbacks.onUploadComplete(file, uploadId, attachmentId);
			},

			onUploadsEnd: (completedUploadsId, failedUploadsId): void => {
				callbacks?.onUploadsEnd && callbacks.onUploadsEnd(completedUploadsId, failedUploadsId);
			}
		};

		const uploadsResult = uploadAttachments(files, options);
		const { addUnsavedAttachments } = useEditorsStore.getState();

		const unsavedAttachments = uploadsResult.map<UnsavedAttachment>(
			({ file, uploadId, abortController }) => {
				const attachment: UnsavedAttachment = {
					filename: file.name,
					contentType: file.type,
					size: file.size,
					uploadId,
					isInline: areInline,
					uploadStatus: {
						status: 'running',
						progress: 0
					},
					uploadAbortController: abortController
				};
				areInline && (attachment.contentId = `${attachment.uploadId}@carbonio`);
				return attachment;
			}
		);
		addUnsavedAttachments(editorId, unsavedAttachments);
		computeAndUpdateEditorStatus(editorId);

		return unsavedAttachments;
	};

	const addAndSaveGenericAttachments = (
		files: Array<File>,
		areInline: boolean,
		callbacks?: UploadAttachmentsOptions & {
			onSaveComplete?: (savedContentIds: Array<string>) => void;
		}
	): Array<UnsavedAttachment> => {
		const customizedCallbacks = {
			...callbacks,
			onUploadsEnd: (completedUploadsId: Array<string>, failedUploadsId: Array<string>): void => {
				const editor = getEditor({ id: editorId });
				if (editor) {
					const uploadedUnsavedAttachments = filterUnsavedAttachmentsByUploadId(
						editor.unsavedAttachments,
						completedUploadsId
					);

					const uploadedContentIds: Array<string> = [];
					uploadedUnsavedAttachments.forEach((uploadedUnsavedAttachment) => {
						if (
							uploadedUnsavedAttachment.isInline === areInline &&
							uploadedUnsavedAttachment.contentId
						) {
							uploadedContentIds.push(uploadedUnsavedAttachment.contentId);
						}
					});

					const saveDraftOptions: SaveDraftOptions = {
						onComplete: (): void => {
							callbacks?.onSaveComplete && callbacks.onSaveComplete(uploadedContentIds);
						}
					};
					debouncedSaveDraftFromEditor(editorId, saveDraftOptions);
				}

				callbacks?.onUploadsEnd && callbacks.onUploadsEnd(completedUploadsId, failedUploadsId);
			}
		};

		return addGenericUnsavedAttachments(files, areInline, customizedCallbacks);
	};

	const addAndSaveUploadedAttachment = (uploadId: string): UnsavedAttachment => {
		const { addUnsavedAttachments } = useEditorsStore.getState();

		const unsavedAttachment = {
			filename: '',
			contentType: '',
			size: 0,
			uploadId,
			isInline: false,
			uploadStatus: {
				status: 'completed',
				progress: 0
			}
		} satisfies UnsavedAttachment;
		addUnsavedAttachments(editorId, [unsavedAttachment]);
		computeAndUpdateEditorStatus(editorId);

		debouncedSaveDraftFromEditor(editorId);

		return unsavedAttachment;
	};

	const addStandardAttachments = (
		files: Array<File>,
		callbacks?: UploadCallbacks
	): Array<UnsavedAttachment> => addAndSaveGenericAttachments(files, false, callbacks);

	const addUploadedAttachment = (uploadId: string): UnsavedAttachment =>
		addAndSaveUploadedAttachment(uploadId);

	const addInlineAttachments = (
		files: Array<File>,
		callbacks?: UploadCallbacks & {
			onSaveComplete?: (
				inlineAttachments: Array<{
					contentId: string | undefined;
					cidUrl: string | undefined;
					downloadServiceUrl: string | undefined;
				}>
			) => void;
		}
	): Array<UnsavedAttachment> => {
		const customizedCallbacks = {
			...omit(callbacks, 'onSaveComplete'),
			onSaveComplete: (savedContentIds: Array<string>): void => {
				const editor = getEditor({ id: editorId });
				if (!editor) {
					callbacks?.onSaveComplete && callbacks.onSaveComplete([]);
					return;
				}

				const savedInlineAttachments = getSavedInlineAttachmentsByContentId(
					savedContentIds,
					editor.savedAttachments
				);

				const inlineInfo = savedInlineAttachments.map((savedInlineAttachment) => ({
					contentId: savedInlineAttachment.contentId,
					cidUrl: savedInlineAttachment.contentId
						? composeCidUrlFromContentId(savedInlineAttachment.contentId) ?? undefined
						: undefined,
					downloadServiceUrl: composeAttachmentDownloadUrl(savedInlineAttachment)
				}));

				callbacks?.onSaveComplete && callbacks.onSaveComplete(inlineInfo);
			}
		};

		return addAndSaveGenericAttachments(files, true, customizedCallbacks);
	};

	return {
		hasStandardAttachments: unsavedStandardAttachments.length + savedStandardAttachments.length > 0,
		unsavedStandardAttachments,
		savedStandardAttachments,
		removeUnsavedAttachment: (uploadId: string): void => {
			removeUnsavedAttachmentsInvoker(editorId, uploadId);
			computeAndUpdateEditorStatus(editorId);
			debouncedSaveDraftFromEditor(editorId);
		},

		removeSavedAttachment: (partName: string): void => {
			removeSavedAttachmentsInvoker(editorId, partName);
			computeAndUpdateEditorStatus(editorId);
			debouncedSaveDraftFromEditor(editorId);
		},
		removeStandardAttachments: (): void => {
			removeStandardAttachmentsInvoker(editorId);
			computeAndUpdateEditorStatus(editorId);
			debouncedSaveDraftFromEditor(editorId);
		},
		addStandardAttachments,
		addInlineAttachments,
		addUploadedAttachment
	};
};
