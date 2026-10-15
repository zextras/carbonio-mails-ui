/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ErrorSoapBodyResponse, t } from '@zextras/carbonio-shell-ui';

import { TIMEOUTS } from 'constants/index';
import { SaveDraftResponse } from 'types/soap/save-draft';

const SEND_ABORTED_ADDRESS_FAILURE = 'mail.SEND_ABORTED_ADDRESS_FAILURE';
const SEND_TO_DISTRIBUTION_LIST_DENIED = 'mail.SEND_TO_DISTRIBUTION_LIST_DENIED';

type SendError = SaveDraftResponse | ErrorSoapBodyResponse;

function getErrorCode(error: SendError): string | undefined {
	return error?.Fault?.Detail?.Error?.Code;
}

function emailOf(address: string): string {
	const trimmed = address.trim();
	const start = trimmed.lastIndexOf('<');
	return start !== -1 && trimmed.endsWith('>') ? trimmed.slice(start + 1, -1) : trimmed;
}

function getInvalidAddresses(error: SendError): Array<string> {
	const errorArguments: Array<{ n?: string; _content?: string }> =
		error?.Fault?.Detail?.Error?.a ?? [];
	return errorArguments
		.filter((argument) => argument?.n === 'invalid')
		.map((argument) => argument?._content)
		.filter((content): content is string => !!content)
		.map(emailOf);
}

function getDeniedDistributionListMessage(error: SendError): string {
	const distributionLists = getInvalidAddresses(error);
	return distributionLists.length > 1
		? t('error.distribution_lists_send_denied', {
				defaultValue: "You can't send to {{count}} distribution lists. Remove them and try again.",
				count: distributionLists.length
			})
		: t('error.distribution_list_send_denied', {
				defaultValue: "You can't send to {{address}}. Remove it and try again.",
				address: distributionLists[0] ?? ''
			});
}

function getInvalidRecipientMessage(error: SendError): string {
	const invalidAddresses = getInvalidAddresses(error);
	return invalidAddresses.length > 1
		? t('error.invalid_recipients', {
				defaultValue: 'The recipient addresses "{{invalidAddresses}}" do not exist or are invalid',
				invalidAddresses: invalidAddresses.join('", "')
			})
		: t('error.invalid_recipient', {
				defaultValue: 'The recipient address "{{invalidAddress}}" does not exist or is invalid',
				invalidAddress: invalidAddresses[0] ?? ''
			});
}

export function getErrorSnackbarProps(error: SendError): {
	message: string;
	timeout: number;
} {
	switch (getErrorCode(error)) {
		case SEND_TO_DISTRIBUTION_LIST_DENIED:
			return {
				message: getDeniedDistributionListMessage(error),
				timeout: TIMEOUTS.INVALID_EMAIL_RECIPIENT_TIMEOUT
			};
		case SEND_ABORTED_ADDRESS_FAILURE:
			return {
				message: getInvalidRecipientMessage(error),
				timeout: TIMEOUTS.INVALID_EMAIL_RECIPIENT_TIMEOUT
			};
		default:
			return {
				message: t('label.error_try_again', 'Something went wrong, please try again'),
				timeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT
			};
	}
}
