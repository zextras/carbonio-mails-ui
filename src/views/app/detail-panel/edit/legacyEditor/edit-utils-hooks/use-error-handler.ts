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

function getInvalidAddresses(error: SaveDraftResponse | ErrorSoapBodyResponse): Array<string> {
	const errorArguments: Array<{ _content?: string }> = error?.Fault?.Detail?.Error?.a ?? [];
	return errorArguments
		.map((argument) => argument?._content)
		.filter((content): content is string => !!content);
}

export function getErrorSnackbarProps(error: SaveDraftResponse | ErrorSoapBodyResponse): {
	message: string;
	timeout: number;
} {
	let timeout = TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT;
	let message = t('label.error_try_again', 'Something went wrong, please try again');

	if (isErrorAboutInvalidRecipient(error)) {
		const invalidAddresses = getInvalidAddresses(error);

		message =
			invalidAddresses.length > 1
				? t('error.invalid_recipients', {
						defaultValue:
							'The recipient addresses "{{invalidAddresses}}" do not exist or are invalid',
						invalidAddresses: invalidAddresses.join('", "')
					})
				: t('error.invalid_recipient', {
						defaultValue: 'The recipient address "{{invalidAddress}}" does not exist or is invalid',
						invalidAddress: invalidAddresses[0] ?? ''
					});
		timeout = TIMEOUTS.INVALID_EMAIL_RECIPIENT_TIMEOUT;
	}

	return { message, timeout };
}
