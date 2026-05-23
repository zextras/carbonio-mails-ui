/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ErrorSoapBodyResponse, t } from '@zextras/carbonio-shell-ui';

import { SaveDraftResponse } from 'types';

function isErrorAboutInvalidRecipient(error: SaveDraftResponse | ErrorSoapBodyResponse): boolean {
	return error?.Fault?.Detail?.Error?.Code === 'mail.SEND_ABORTED_ADDRESS_FAILURE';
}

function isErrorAboutUnsavedChanges(error: SaveDraftResponse | ErrorSoapBodyResponse): boolean {
	return error?.Fault?.Detail?.Error?.Code === 'EditorHasUnsavedChanges';
}

function isErrorAboutIdentityNotFound(error: SaveDraftResponse | ErrorSoapBodyResponse): boolean {
	return error?.Fault?.Detail?.Error?.Code === 'IdentityNotFound';
}

function isErrorAboutSendingNotAllowed(error: SaveDraftResponse | ErrorSoapBodyResponse): boolean {
	return error?.Fault?.Detail?.Error?.Code === 'SendingNotAllowed';
}

function isErrorAboutEditorNotFound(error: SaveDraftResponse | ErrorSoapBodyResponse): boolean {
	return error?.Fault?.Detail?.Error?.Code === 'EditorNotFound';
}

function isErrorAboutMessageTooLarge(error: SaveDraftResponse | ErrorSoapBodyResponse): boolean {
	return error?.Fault?.Detail?.Error?.Code === 'mail.MESSAGE_TOO_BIG' ||
			error?.Fault?.Detail?.Error?.Code === 'mail.UPLOAD_TOO_LARGE';
}

export function getErrorSnackbarProps(error: SaveDraftResponse | ErrorSoapBodyResponse): {
	message: string;
	timeout: number;
} {
	let timeout = 10000;
	let message = t('label.error_try_again', 'Something went wrong, please try again');

	if (isErrorAboutInvalidRecipient(error)) {
		const invalidAddress = error?.Fault?.Detail?.Error?.a?.[0]?._content;

		message = t('error.invalid_recipient', {
			defaultValue: `The recipient address "${invalidAddress}" does not exist or is invalid`,
			invalidAddress
		});
	} else if (isErrorAboutUnsavedChanges(error)) {
		message = t('error.unsaved_changes', 'Please save your changes before sending the email');
	} else if (isErrorAboutIdentityNotFound(error)) {
		message = t('error.identity_not_found', 'The selected identity was not found. Please check your account settings.');
	} else if (isErrorAboutSendingNotAllowed(error)) {
		message = t('error.sending_not_allowed', 'Sending emails is not allowed for your account. Please contact support for assistance.');
	} else if (isErrorAboutEditorNotFound(error)) {
		message = t('error.editor_not_found', 'The email editor was not found. Please try reopening the email and sending again.');
	} else if (isErrorAboutMessageTooLarge(error)) {
		message = t('editor.warning.mail_size_exceeds_limit', 'The message size exceeds the limit. Please convert some attachments to smart links');
	}

	return { message, timeout };
}
