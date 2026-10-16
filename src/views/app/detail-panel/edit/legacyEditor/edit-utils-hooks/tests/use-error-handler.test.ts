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
		const deniedCode = 'mail.SEND_TO_DISTRIBUTION_LIST_DENIED';
		const distributionList = 'dl@demo.zextras.io';

		const buildError = (
			code: string,
			a: Array<{ n: string; _content: string }>
		): { Fault: Record<string, unknown> } => ({
			Fault: { Detail: { Error: { Code: code, a } } }
		});

		it('names the denied distribution list', () => {
			const error = buildError(deniedCode, [
				{ n: 'invalid', _content: `Devs <${distributionList}>` },
				{ n: 'unsent', _content: 'valid@demo.zextras.io' }
			]);
			const result = getErrorSnackbarProps(error);
			expect(t).toHaveBeenCalledWith('error.distribution_list_send_denied', {
				defaultValue: "You can't send to {{address}}. Remove it and try again.",
				address: distributionList
			});
			expect(result).toEqual({
				message: 'error.distribution_list_send_denied',
				timeout: TIMEOUTS.INVALID_EMAIL_RECIPIENT_TIMEOUT
			});
		});

		it('counts the denied distribution lists when there is more than one', () => {
			const error = buildError(deniedCode, [
				{ n: 'invalid', _content: 'dl1@demo.zextras.io' },
				{ n: 'invalid', _content: 'dl2@demo.zextras.io' }
			]);
			const result = getErrorSnackbarProps(error);
			expect(t).toHaveBeenCalledWith('error.distribution_lists_send_denied', {
				defaultValue: "You can't send to {{count}} distribution lists. Remove them and try again.",
				count: 2
			});
			expect(result.message).toBe('error.distribution_lists_send_denied');
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
