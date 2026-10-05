/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ErrorSoapBodyResponse, t } from '@zextras/carbonio-shell-ui';

import { TIMEOUTS } from 'constants/index';
import { SaveDraftResponse } from 'types/soap/save-draft';

const SEND_ABORTED_ADDRESS_FAILURE = 'mail.SEND_ABORTED_ADDRESS_FAILURE';
const SEND_PARTIAL_ADDRESS_FAILURE = 'mail.SEND_PARTIAL_ADDRESS_FAILURE';

/**
 * Text the backend puts in the fault reason when the sender lacks the right to email a
 * distribution list. The fault code is shared with the invalid address failures, so the
 * reason is the only way to tell the two cases apart. The same text is present whether the
 * denial comes from the mailbox or from the MTA.
 */
const DISTRIBUTION_LIST_SEND_DENIED_REASON =
	'Sender is not allowed to email this distribution list';

type SendError = SaveDraftResponse | ErrorSoapBodyResponse;

function getErrorCode(error: SendError): string | undefined {
	return error?.Fault?.Detail?.Error?.Code;
}

function isErrorAboutInvalidRecipient(error: SendError): boolean {
	return getErrorCode(error) === SEND_ABORTED_ADDRESS_FAILURE;
}

function isPartialSendError(error: SendError): boolean {
	return getErrorCode(error) === SEND_PARTIAL_ADDRESS_FAILURE;
}

function isErrorAboutDeniedDistributionList(error: SendError): boolean {
	const reason: string = error?.Fault?.Reason?.Text ?? '';
	return (
		(isErrorAboutInvalidRecipient(error) || isPartialSendError(error)) &&
		reason.includes(DISTRIBUTION_LIST_SEND_DENIED_REASON)
	);
}

function getInvalidAddresses(error: SendError): Array<string> {
	const errorArguments: Array<{ n?: string; _content?: string }> =
		error?.Fault?.Detail?.Error?.a ?? [];
	return errorArguments
		.filter((argument) => argument?.n === 'invalid')
		.map((argument) => argument?._content)
		.filter((content): content is string => !!content);
}

function getDeniedDistributionListMessage(error: SendError): string {
	const distributionLists = getInvalidAddresses(error);
	const isSingle = distributionLists.length <= 1;
	const interpolation = isSingle
		? { distributionList: distributionLists[0] ?? '' }
		: { distributionLists: distributionLists.join('", "') };

	if (isPartialSendError(error)) {
		return isSingle
			? t('error.distribution_list_send_denied_partial', {
					defaultValue:
						'The message was sent, but not to the distribution list "{{distributionList}}" because you are not allowed to send to it',
					...interpolation
				})
			: t('error.distribution_lists_send_denied_partial', {
					defaultValue:
						'The message was sent, but not to the distribution lists "{{distributionLists}}" because you are not allowed to send to them',
					...interpolation
				});
	}
	return isSingle
		? t('error.distribution_list_send_denied', {
				defaultValue: 'You are not allowed to send to the distribution list "{{distributionList}}"',
				...interpolation
			})
		: t('error.distribution_lists_send_denied', {
				defaultValue:
					'You are not allowed to send to the distribution lists "{{distributionLists}}"',
				...interpolation
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
	if (isErrorAboutDeniedDistributionList(error)) {
		return {
			message: getDeniedDistributionListMessage(error),
			timeout: TIMEOUTS.INVALID_EMAIL_RECIPIENT_TIMEOUT
		};
	}
	if (isErrorAboutInvalidRecipient(error)) {
		return {
			message: getInvalidRecipientMessage(error),
			timeout: TIMEOUTS.INVALID_EMAIL_RECIPIENT_TIMEOUT
		};
	}
	return {
		message: t('label.error_try_again', 'Something went wrong, please try again'),
		timeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT
	};
}
