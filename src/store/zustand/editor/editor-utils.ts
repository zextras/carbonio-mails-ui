/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { t } from '@zextras/carbonio-shell-ui';
import { concat, some } from 'lodash';

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
		return {
			allowed: false,
			reason: t('label.draft_save_in_progress', 'Saving draft in progress')
		};
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
		return {
			allowed: false,
			reason: t('label.draft_save_in_progress', 'Saving draft in progress         ')
		};
	}

	if (editor.sendProcessStatus?.status === PROCESS_STATUS.RUNNING) {
		return {
			allowed: false,
			reason: t('label.message_send_in_progress', 'Sending message')
		};
	}

	if (!editor.identityId) {
		return {
			allowed: false,
			reason: t('label.missing_sender', 'the identity of the sender is not set') // TODO check strings with designer
		};
	}

	if (
		!editor.recipients.to.length &&
		!editor.recipients.cc.length &&
		!editor.recipients.bcc.length
	) {
		return {
			allowed: false,
			reason: t('label.missing_recipients', 'At least one recipient is required to send the email')
		};
	}

	const participants = concat(editor.recipients.to, editor.recipients.bcc, editor.recipients.cc);
	if (some(participants, { error: true })) {
		return {
			allowed: false,
			reason: t('label.invalid_recipients', `A recipient's address is spelled incorrectly`)
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
