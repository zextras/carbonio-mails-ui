/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { selectUnsavedAttachmentByUploadId } from '../store-selectors';
import { useSaveDraftFromEditor } from 'store/editor/hooks/save-draft';
import { computeAndUpdateEditorStatus, useEditorSetDirty } from 'store/editor/hooks/statuses';
import { useEditorsStore } from 'store/editor/store';
import { AttachmentUploadProcessStatus } from 'types/attachments';
import { MailsEditorV2 } from 'types/editor';

export const useEditorUploadProcess = (
	editorId: MailsEditorV2['id'],
	uploadId: string
): { status: AttachmentUploadProcessStatus; cancel: () => void } | null => {
	const { debouncedSaveDraft } = useSaveDraftFromEditor(editorId);
	const { setDirty } = useEditorSetDirty(editorId);
	const attachmentStateInfo = useEditorsStore((state) => {
		const unsavedAttachment = selectUnsavedAttachmentByUploadId(state, editorId, uploadId);
		if (!unsavedAttachment) {
			return unsavedAttachment;
		}

		return {
			status: unsavedAttachment.uploadStatus,
			abortController: unsavedAttachment.uploadAbortController
		};
	});

	return useMemo(() => {
		if (
			!attachmentStateInfo ||
			!attachmentStateInfo.status ||
			!attachmentStateInfo.abortController
		) {
			return null;
		}

		return {
			status: attachmentStateInfo.status,
			cancel: (): void => {
				attachmentStateInfo.abortController?.abort();
				useEditorsStore.getState().removeUnsavedAttachment(editorId, uploadId);
				computeAndUpdateEditorStatus(editorId);
				setDirty();
				debouncedSaveDraft();
			}
		};
	}, [attachmentStateInfo, editorId, debouncedSaveDraft, uploadId, setDirty]);
};
