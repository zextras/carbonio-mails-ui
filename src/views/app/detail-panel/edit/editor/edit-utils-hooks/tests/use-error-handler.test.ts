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
