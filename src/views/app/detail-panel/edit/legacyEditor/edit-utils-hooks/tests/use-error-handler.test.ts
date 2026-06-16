/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

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
