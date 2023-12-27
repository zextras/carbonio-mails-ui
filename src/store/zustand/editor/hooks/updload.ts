/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { computeAndUpdateEditorStatus } from './commons';
import { useSaveDraftFromEditor } from './save-draft';
import { AttachmentUploadProcessStatus, MailsEditorV2 } from '../../../../types';
import { useEditorsStore } from '../store';
import { getUnsavedAttachmentIndex } from '../store-utils';

export const useEditorUploadProcess = (
	editorId: MailsEditorV2['id'],
	uploadId: string
): { status: AttachmentUploadProcessStatus; cancel: () => void } | null => {
	const saveDraftFromEditor = useSaveDraftFromEditor();
	const attachmentStateInfo = useEditorsStore((state) => {
		const unsavedAttachmentIndex = getUnsavedAttachmentIndex(state, editorId, uploadId);
		if (unsavedAttachmentIndex === null) {
			return null;
		}

		return {
			status: state.editors[editorId].unsavedAttachments[unsavedAttachmentIndex].uploadStatus,
			abortController:
				state.editors[editorId].unsavedAttachments[unsavedAttachmentIndex].uploadAbortController
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
				saveDraftFromEditor(editorId);
			}
		};
	}, [attachmentStateInfo, editorId, uploadId]);
};
