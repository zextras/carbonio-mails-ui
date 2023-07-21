/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { t } from '@zextras/carbonio-shell-ui';

import { EditorOperationAllowedStatus, MailsEditorV2 } from '../../../types';

/**
 *
 * @param editor
 */
export const computeDraftSaveAllowedStatus = (
	editor: MailsEditorV2
): EditorOperationAllowedStatus => {
	if (editor.draftSaveProcessStatus?.status === 'running') {
		return { allowed: false, reason: t('label.draft_save_in_progress', 'draft save in progress') }; // TODO check strings with designer
	}

	return { allowed: true };
};

/**
 *
 * @param editor
 */
export const computeSendAllowedStatus = (editor: MailsEditorV2): EditorOperationAllowedStatus => {
	if (editor.draftSaveProcessStatus?.status === 'running') {
		return { allowed: false, reason: t('label.draft_save_in_progress', 'draft save in progress') }; // TODO check strings with designer
	}

	if (editor.sendProcessStatus?.status === 'running') {
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

	if (!editor.recipients.to && !editor.recipients.cc && !editor.recipients.bcc) {
		return {
			allowed: false,
			reason: t('label.missing_recipients', 'there is no valid recipients') // TODO check strings with designer
		};
	}

	// TODO check attachments status
	// if (!editor.) {
	// 	return {
	// 		allowed: false,
	// 		reason: t('label.attachment_error_status', '')
	// 	};
	// }

	return { allowed: true };
};
