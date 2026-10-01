/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { t } from '@zextras/carbonio-shell-ui';

import { getErrorSnackbarProps } from '../use-error-handler';
import { TIMEOUTS } from 'constants/index';

describe('getErrorSnackbarProps', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns default error message and default timeout for generic errors', () => {
		const error = {};
		const result = getErrorSnackbarProps(error);
		expect(result).toEqual({
			message: 'label.error_try_again',
			timeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT
		});
	});

	it('returns invalid recipient message and specific timeout for invalid recipient error', () => {
		const error = {
			Fault: {
				Detail: {
					Error: {
						Code: 'mail.SEND_ABORTED_ADDRESS_FAILURE'
					}
				}
			}
		};
		const result = getErrorSnackbarProps(error);
		expect(result).toEqual({
			message: 'error.invalid_recipient',
			timeout: TIMEOUTS.INVALID_EMAIL_RECIPIENT_TIMEOUT
		});
	});

	it('passes the invalid address to the translation as an interpolation variable', () => {
		const error = {
			Fault: {
				Detail: {
					Error: {
						Code: 'mail.SEND_ABORTED_ADDRESS_FAILURE',
						a: [{ n: 'invalid', _content: 'abc@demo.zextras.io' }]
					}
				}
			}
		};
		getErrorSnackbarProps(error);
		expect(t).toHaveBeenCalledWith('error.invalid_recipient', {
			defaultValue: 'The recipient address "{{invalidAddress}}" does not exist or is invalid',
			invalidAddress: 'abc@demo.zextras.io'
		});
	});

	it('reports all invalid addresses when the error contains more than one', () => {
		const error = {
			Fault: {
				Detail: {
					Error: {
						Code: 'mail.SEND_ABORTED_ADDRESS_FAILURE',
						a: [
							{ n: 'invalid', _content: 'abc@demo.zextras.io' },
							{ n: 'invalid', _content: 'def@demo.zextras.io' }
						]
					}
				}
			}
		};
		const result = getErrorSnackbarProps(error);
		expect(t).toHaveBeenCalledWith('error.invalid_recipients', {
			defaultValue: 'The recipient addresses "{{invalidAddresses}}" do not exist or are invalid',
			invalidAddresses: 'abc@demo.zextras.io", "def@demo.zextras.io'
		});
		expect(result).toEqual({
			message: 'error.invalid_recipients',
			timeout: TIMEOUTS.INVALID_EMAIL_RECIPIENT_TIMEOUT
		});
	});

	it('does not report the unsent addresses as invalid', () => {
		const error = {
			Fault: {
				Detail: {
					Error: {
						Code: 'mail.SEND_ABORTED_ADDRESS_FAILURE',
						a: [
							{ n: 'invalid', _content: 'abc@demo.zextras.io' },
							{ n: 'unsent', _content: 'valid@demo.zextras.io' }
						]
					}
				}
			}
		};
		getErrorSnackbarProps(error);
		expect(t).toHaveBeenCalledWith('error.invalid_recipient', {
			defaultValue: 'The recipient address "{{invalidAddress}}" does not exist or is invalid',
			invalidAddress: 'abc@demo.zextras.io'
		});
	});

	describe('when the sender is not allowed to send to a distribution list', () => {
		const abortedCode = 'mail.SEND_ABORTED_ADDRESS_FAILURE';
		const partialCode = 'mail.SEND_PARTIAL_ADDRESS_FAILURE';
		const distributionList = 'dl@demo.zextras.io';
		const deniedReason = (lists: string): string =>
			`Sender is not allowed to email this distribution list: ${lists}`;

		const buildError = (
			code: string,
			reason: string,
			a: Array<{ n: string; _content: string }>
		): { Fault: Record<string, unknown> } => ({
			Fault: {
				Detail: { Error: { Code: code, a } },
				Reason: { Text: reason }
			}
		});

		it('returns the denied distribution list message instead of the invalid recipient one', () => {
			const error = buildError(abortedCode, deniedReason(distributionList), [
				{ n: 'invalid', _content: distributionList },
				{ n: 'unsent', _content: 'valid@demo.zextras.io' }
			]);
			const result = getErrorSnackbarProps(error);
			expect(t).toHaveBeenCalledWith('error.distribution_list_send_denied', {
				defaultValue: 'You are not allowed to send to the distribution list "{{distributionList}}"',
				distributionList
			});
			expect(result).toEqual({
				message: 'error.distribution_list_send_denied',
				timeout: TIMEOUTS.INVALID_EMAIL_RECIPIENT_TIMEOUT
			});
		});

		it('reports all the denied distribution lists when there is more than one', () => {
			const error = buildError(
				abortedCode,
				deniedReason('dl1@demo.zextras.io, dl2@demo.zextras.io'),
				[
					{ n: 'invalid', _content: 'dl1@demo.zextras.io' },
					{ n: 'invalid', _content: 'dl2@demo.zextras.io' }
				]
			);
			const result = getErrorSnackbarProps(error);
			expect(t).toHaveBeenCalledWith('error.distribution_lists_send_denied', {
				defaultValue:
					'You are not allowed to send to the distribution lists "{{distributionLists}}"',
				distributionLists: 'dl1@demo.zextras.io", "dl2@demo.zextras.io'
			});
			expect(result.message).toBe('error.distribution_lists_send_denied');
		});

		it('recognizes the denial when it is reported by the MTA', () => {
			const error = buildError(
				abortedCode,
				'Invalid address: dl@demo.zextras.io.  com.zimbra.cs.mailbox.MailSender$SafeSendFailedException: MESSAGE_NOT_DELIVERED; chained exception is:\n\tcom.zimbra.cs.mailclient.smtp.InvalidRecipientException: RCPT failed: Invalid recipient dl@demo.zextras.io: 571 571 Sender is not allowed to email this distribution list: dl@demo.zextras.io',
				[{ n: 'invalid', _content: distributionList }]
			);
			expect(getErrorSnackbarProps(error).message).toBe('error.distribution_list_send_denied');
		});

		it('tells the message was sent to the other recipients on a partial send', () => {
			const error = buildError(partialCode, deniedReason(distributionList), [
				{ n: 'invalid', _content: distributionList }
			]);
			const result = getErrorSnackbarProps(error);
			expect(t).toHaveBeenCalledWith('error.distribution_list_send_denied_partial', {
				defaultValue:
					'The message was sent, but not to the distribution list "{{distributionList}}" because you are not allowed to send to it',
				distributionList
			});
			expect(result).toEqual({
				message: 'error.distribution_list_send_denied_partial',
				timeout: TIMEOUTS.INVALID_EMAIL_RECIPIENT_TIMEOUT
			});
		});

		it('keeps the default message for a partial send failure with another reason', () => {
			const error = buildError(partialCode, 'Invalid address: abc@demo.zextras.io', [
				{ n: 'invalid', _content: 'abc@demo.zextras.io' }
			]);
			expect(getErrorSnackbarProps(error)).toEqual({
				message: 'label.error_try_again',
				timeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT
			});
		});
	});

	it('returns default error message if error structure is missing Code', () => {
		const error = {
			Fault: {
				Detail: {
					Error: {
						Code: 'some.other.error'
					}
				}
			}
		};
		const result = getErrorSnackbarProps(error);
		expect(result).toEqual({
			message: 'label.error_try_again',
			timeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT
		});
	});
});
