/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { t } from '@zextras/carbonio-shell-ui';
import { concat, some } from 'lodash';

import { PROCESS_STATUS } from '../../../constants';
import type {
	EditorOperationAllowedStatus,
	MailsEditorV2,
	SavedAttachment,
	UnsavedAttachment
} from '../../../types';

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

	if (
		some(
			editor.unsavedAttachments,
			(unsavedAttachment) => unsavedAttachment.uploadStatus?.status === 'running'
		)
	) {
		return {
			allowed: false,
			reason: t('label.attachment_error_status.uploading', 'Attachments are being uploaded') // TODO check strings with designer
		};
	}

	if (
		some(
			editor.unsavedAttachments,
			(unsavedAttachment) => unsavedAttachment.uploadStatus?.status === 'aborted'
		)
	) {
		return {
			allowed: false,
			reason: t('label.attachment_error_status.failed', 'one or more attachments failed to upload') // TODO check strings with designer
		};
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
		some(
			editor.unsavedAttachments,
			(unsavedAttachment) => unsavedAttachment.uploadStatus?.status === 'running'
		)
	) {
		return {
			allowed: false,
			reason: t('label.attachment_error_status.uploading', 'Attachments are being uploaded') // TODO check strings with designer
		};
	}

	if (
		some(
			editor.unsavedAttachments,
			(unsavedAttachment) => unsavedAttachment.uploadStatus?.status === 'aborted'
		)
	) {
		return {
			allowed: false,
			reason: t('label.attachment_error_status.failed', 'one or more attachments failed to upload') // TODO check strings with designer
		};
	}

	return { allowed: true };
};

export const isSavedAttachment = (
	attachment: SavedAttachment | UnsavedAttachment
): attachment is SavedAttachment => 'part' in attachment;

export const isUnsavedAttachment = (
	attachment: SavedAttachment | UnsavedAttachment
): attachment is UnsavedAttachment => !isSavedAttachment(attachment);

export const isAttachmentUploading = (attachment: UnsavedAttachment): boolean =>
	attachment.uploadStatus?.status === 'running';
