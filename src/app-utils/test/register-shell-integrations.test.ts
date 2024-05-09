/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { registerFunctions } from '@zextras/carbonio-shell-ui';

import { registerShellIntegrations } from '../register-shell-integrations';

describe('registerShellIntegrations', () => {
	it('should called with the correct parameters', async () => {
		registerShellIntegrations();
		expect(registerFunctions).toHaveBeenCalledWith(
			{
				id: 'compose',
				fn: expect.anything()
			},
			{
				id: 'composePrefillMessage',
				fn: expect.anything()
			}
		);
	});
});
