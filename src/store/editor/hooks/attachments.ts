/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback } from 'react';

import { t } from '@zextras/carbonio-shell-ui';
import { omit, reject } from 'lodash';

import {
	uploadAttachmentsApi,
	UploadAttachmentsOptions,
	UploadCallbacks
} from 'api/upload-attachments-api';
import { TIMEOUTS } from 'constants/index';
import { composeAttachmentDownloadUrl } from 'helpers/attachments';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { composeCidUrlFromContentId } from 'store/editor/editor-transformations';
import {
	filterUnsavedAttachmentsByUploadId,
	getSavedInlineAttachmentsByContentId
} from 'store/editor/editor-utils';
import { getEditor } from 'store/editor/hooks/editors';
import { SaveDraftOptions, useSaveDraftFromEditor } from 'store/editor/hooks/save-draft';
import { computeAndUpdateEditorStatus, useEditorSetDirty } from 'store/editor/hooks/statuses';
import { useEditorsStore } from 'store/editor/store';
import { AttachmentUploadProcessStatus, UnsavedAttachment } from 'types/attachments';
import { MailsEditorV2 } from 'types/editor';

const useNotifyUploadError = (): ((file: File) => void) => {
	const { createSnackbar } = useUiUtilities();
	return useCallback(
		(file) => {
			createSnackbar({
				key: `upload-error`,
				replace: true,
				severity: 'error',
				label: t('label.errors.upload_failed_generic', {
					filename: file.name,
					defaultValue: 'Upload failed for the file "{{filename}}"'
				}),
				autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT
			});
		},
		[createSnackbar]
	);
};

type EditorAttachmentHook = {
	hasStandardAttachments: boolean;
	unsavedStandardAttachments: MailsEditorV2['unsavedAttachments'];
	savedStandardAttachments: MailsEditorV2['savedAttachments'];
	addStandardAttachments: (
		files: Array<File>,
		callbacks?: UploadCallbacks
	) => Array<UnsavedAttachment>;
	addUploadedAttachment: ({
		attachmentId,
		fileName,
		contentType,
		size
	}: {
		attachmentId: string;
		fileName: string;
		contentType: string;
		size: number;
	}) => UnsavedAttachment;
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
	keepOnlyInlineAttachments: (usedCids: string[]) => void;
};

export const useEditorAttachments = (editorId: MailsEditorV2['id']): EditorAttachmentHook => {
	const { debouncedSaveDraft } = useSaveDraftFromEditor(editorId);
	const { setDirty } = useEditorSetDirty(editorId);
	const notifyUploadError = useNotifyUploadError();

	const unsavedStandardAttachments = reject(
		useEditorsStore((state) => state.editors[editorId].unsavedAttachments),
		'isInline'
	);
	const savedStandardAttachments = reject(
		useEditorsStore((state) => state.editors[editorId].savedAttachments),
		(x) => x.isInline && x.contentId !== undefined
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
				notifyUploadError(file);
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

		const uploadsResult = uploadAttachmentsApi(files, options);
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
					setDirty();
					debouncedSaveDraft(saveDraftOptions);
				}

				callbacks?.onUploadsEnd && callbacks.onUploadsEnd(completedUploadsId, failedUploadsId);
			}
		};

		return addGenericUnsavedAttachments(files, areInline, customizedCallbacks);
	};

	const addAndSaveUploadedAttachment = ({
		attachmentId,
		fileName,
		contentType,
		size
	}: {
		attachmentId: string;
		fileName: string;
		contentType: string;
		size: number;
	}): UnsavedAttachment => {
		const { addUnsavedAttachments } = useEditorsStore.getState();

		const unsavedAttachment = {
			filename: fileName,
			contentType,
			size,
			aid: attachmentId,
			isInline: false,
			uploadStatus: {
				status: 'completed',
				progress: 0
			}
		} satisfies UnsavedAttachment;
		addUnsavedAttachments(editorId, [unsavedAttachment]);
		computeAndUpdateEditorStatus(editorId);
		setDirty();
		debouncedSaveDraft();

		return unsavedAttachment;
	};

	const addStandardAttachments = (
		files: Array<File>,
		callbacks?: UploadCallbacks
	): Array<UnsavedAttachment> => addAndSaveGenericAttachments(files, false, callbacks);

	const addUploadedAttachment = ({
		attachmentId,
		fileName,
		contentType,
		size
	}: {
		attachmentId: string;
		fileName: string;
		contentType: string;
		size: number;
	}): UnsavedAttachment =>
		addAndSaveUploadedAttachment({ attachmentId, fileName, contentType, size });

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
						? (composeCidUrlFromContentId(savedInlineAttachment.contentId) ?? undefined)
						: undefined,
					downloadServiceUrl: composeAttachmentDownloadUrl(savedInlineAttachment)
				}));

				callbacks?.onSaveComplete && callbacks.onSaveComplete(inlineInfo);
			}
		};

		return addAndSaveGenericAttachments(files, true, customizedCallbacks);
	};
	const keepOnlyInlineAttachments = (usedCids: string[]): void => {
		const editor = getEditor({ id: editorId });
		if (!editor) return;

		editor.savedAttachments.forEach((att) => {
			if (att.isInline && att.contentId) {
				const cidUrl = composeCidUrlFromContentId(att.contentId);
				if (cidUrl && !usedCids.includes(cidUrl)) {
					useEditorsStore.getState().removeSavedAttachment(editorId, att.partName);
				}
			}
		});
		computeAndUpdateEditorStatus(editorId);
	};
	return {
		hasStandardAttachments: unsavedStandardAttachments.length + savedStandardAttachments.length > 0,
		unsavedStandardAttachments,
		savedStandardAttachments,
		removeUnsavedAttachment: (uploadId: string): void => {
			removeUnsavedAttachmentsInvoker(editorId, uploadId);
			computeAndUpdateEditorStatus(editorId);
			setDirty();
			debouncedSaveDraft();
		},

		removeSavedAttachment: (partName: string): void => {
			removeSavedAttachmentsInvoker(editorId, partName);
			computeAndUpdateEditorStatus(editorId);
			setDirty();
			debouncedSaveDraft();
		},
		removeStandardAttachments: (): void => {
			removeStandardAttachmentsInvoker(editorId);
			computeAndUpdateEditorStatus(editorId);
			setDirty();
			debouncedSaveDraft();
		},
		addStandardAttachments,
		addInlineAttachments,
		addUploadedAttachment,
		keepOnlyInlineAttachments
	};
};
