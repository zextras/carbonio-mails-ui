/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { t } from '@zextras/carbonio-shell-ui';

import { PROCESS_STATUS } from '../../../constants';
import type { EditorOperationAllowedStatus, MailsEditorV2 } from '../../../types';

/**
 *
 * @param editor
 */
export const computeDraftSaveAllowedStatus = (
	editor: MailsEditorV2
): EditorOperationAllowedStatus => {
	if (editor.draftSaveProcessStatus?.status === PROCESS_STATUS.RUNNING) {
		return { allowed: false, reason: t('label.draft_save_in_progress', 'draft save in progress') }; // TODO check strings with designer
	}

	return { allowed: true };
};

/**
 *
 * @param editor
 * @returns boolean
 */
export const computeAttachmentUploadAllowedStatus = (
	editor: MailsEditorV2
): EditorOperationAllowedStatus => {
	const attachmentsUploadRunning = editor.attachmentFiles.some(
		(attachment) => attachment.uploadProcessStatus?.status === PROCESS_STATUS.RUNNING
	);
	if (attachmentsUploadRunning) {
		return {
			allowed: false,
			reason: t('label.attachment_upload_in_progress', 'attachment upload in progress')
		}; // TODO check strings with designer
	}

	return { allowed: true };
};

export const computeAttachmentFailedStatus = (
	editor: MailsEditorV2
): EditorOperationAllowedStatus => {
	const attachmentsUploadRunning = editor.attachmentFiles.some(
		(attachment) => attachment.uploadProcessStatus?.status === PROCESS_STATUS.RUNNING
	);
	if (attachmentsUploadRunning) {
		return {
			allowed: false,
			reason: t('label.attachment_upload_in_progress', 'attachment upload in progress')
		}; // TODO check strings with designer
	}

	return { allowed: true };
};

/**
 *
 * @param editor
 */
export const computeSendAllowedStatus = (editor: MailsEditorV2): EditorOperationAllowedStatus => {
	if (editor.draftSaveProcessStatus?.status === PROCESS_STATUS.RUNNING) {
		return { allowed: false, reason: t('label.draft_save_in_progress', 'draft save in progress') }; // TODO check strings with designer
	}

	if (editor.sendProcessStatus?.status === PROCESS_STATUS.RUNNING) {
		return {
			allowed: false,
			reason: t('label.message_send_in_progress', 'message send in progress') // TODO check strings with designer
		};
	}

	if (!editor.from) {
		return {
			allowed: false,
			reason: t('label.missing_sender', 'the sender of the message is not set') // TODO check strings with designer
		};
	}

	if (
		!editor.recipients.to.length &&
		!editor.recipients.cc.length &&
		!editor.recipients.bcc.length
	) {
		return {
			allowed: false,
			reason: t('label.missing_recipients', 'there is no valid recipients') // TODO check strings with designer
		};
	}

	if (
		editor.attachmentsUploadStatus?.allowed === false &&
		editor.attachmentsUploadStatus?.reason?.includes('running')
	) {
		return {
			allowed: false,
			reason: t('label.attachment_error_status.uploading', 'attachments are being uploaded') // TODO check strings with designer
		};
	}

	if (
		editor.attachmentsUploadStatus?.allowed === false &&
		editor.attachmentsUploadStatus?.reason?.includes('fail')
	) {
		return {
			allowed: false,
			reason: t('label.attachment_error_status.failed', 'one or more attachments failed to upload') // TODO check strings with designer
		};
	}
	return { allowed: true };
};
