import { JSNS } from '@zextras/carbonio-shell-ui';

import { buildSoapErrorResponseBody } from '../../__test__/mocks/utils/soap';
import { isFaultResponse } from '../api-response';

/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
describe('API response', () => {
	describe('isFaultResponse', () => {
		it('should return true for a Fault response', () => {
			const faultResponse = buildSoapErrorResponseBody();
			expect(isFaultResponse(faultResponse)).toBe(true);
		});

		it('should return false if the response is not a Fault', () => {
			const validResponse = {
				m: [
					{
						id: '123',
						subject: 'Test Email'
					}
				],
				_jsns: JSNS.mail
			};
			expect(isFaultResponse(validResponse)).toBe(false);
		});
	});
});
