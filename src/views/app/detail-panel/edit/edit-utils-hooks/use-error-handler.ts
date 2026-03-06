/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ErrorSoapBodyResponse, t } from '@zextras/carbonio-shell-ui';

import { TIMEOUTS } from 'constants/index';
import { SaveDraftResponse } from 'types/soap/save-draft';

function isErrorAboutInvalidRecipient(error: SaveDraftResponse | ErrorSoapBodyResponse): boolean {
	return error?.Fault?.Detail?.Error?.Code === 'mail.SEND_ABORTED_ADDRESS_FAILURE';
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
	}

	return { message, timeout };
}
