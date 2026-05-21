/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ErrorSoapBodyResponse, t } from '@zextras/carbonio-shell-ui';

import { TIMEOUTS } from 'constants/index';
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


export function getErrorSnackbarProps(error: SaveDraftResponse | ErrorSoapBodyResponse): {
	message: string;
	timeout: number;
} {
	let timeout = TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT;
	let message = t('label.error_try_again', 'Something went wrong, please try again');

	if (isErrorAboutInvalidRecipient(error)) {
		const invalidAddress = error?.Fault?.Detail?.Error?.a?.[0]?._content;

		message = t('error.invalid_recipient', {
			defaultValue: `The recipient address "${invalidAddress}" does not exist or is invalid`,
			invalidAddress
		});
		timeout = TIMEOUTS.INVALID_EMAIL_RECIPIENT_TIMEOUT;
	} else if (isErrorAboutUnsavedChanges(error)) {
		message = t('error.unsaved_changes', 'Please save your changes before sending the email');
		timeout = TIMEOUTS.INVALID_EMAIL_RECIPIENT_TIMEOUT;
	} else if (isErrorAboutIdentityNotFound(error)) {
		message = t('error.identity_not_found', 'The selected identity was not found. Please check your account settings.');
		timeout = TIMEOUTS.INVALID_EMAIL_RECIPIENT_TIMEOUT;
	} else if (isErrorAboutSendingNotAllowed(error)) {
		message = t('error.sending_not_allowed', 'Sending emails is not allowed for your account. Please contact support for assistance.');
		timeout = TIMEOUTS.INVALID_EMAIL_RECIPIENT_TIMEOUT;
	} else if (isErrorAboutEditorNotFound(error)) {
		message = t('error.editor_not_found', 'The email editor was not found. Please try reopening the email and sending again.');
		timeout = TIMEOUTS.INVALID_EMAIL_RECIPIENT_TIMEOUT;
	}

	return { message, timeout };
}
