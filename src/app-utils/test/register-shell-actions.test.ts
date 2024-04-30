/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { registerActions } from '@zextras/carbonio-shell-ui';

import { registerShellActions } from '../register-shell-actions';

describe('registerShellActions', () => {
	it('should called with the correct parameters', async () => {
		registerShellActions();
		expect(registerActions).toHaveBeenCalledWith(
			{
				action: expect.anything(),
				id: 'mail-to',
				type: 'contact-list'
			},
			{
				action: expect.anything(),
				id: 'new-email',
				type: 'new'
			}
		);
	});
});
