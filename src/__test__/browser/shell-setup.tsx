/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { testingUtility } from '@zextras/carbonio-shell-ui/testing';
import { generateAccount } from '@test-utils/accounts/account-generator';
import { generateSettings } from '@test-utils/settings/settings-generator';
import { MAIL_APP_ID } from '../../constants';

vi.mock('@zextras/carbonio-shell-ui', async () => {
	const { MAIL_APP_ID } = await import('../../constants');
	const app = {
		commit: '',
		description: '',
		js_entrypoint: '',
		name: MAIL_APP_ID,
		priority: 0,
		version: '',
		type: 'carbonio' as const,
		icon: '',
		display: ''
	};
	const { testingUtility } = await import('@zextras/carbonio-shell-ui/testing');
	const appExports = testingUtility.getAppExports(app);
	return {
		...(await vi.importActual('@zextras/carbonio-shell-ui')),
		...appExports
	};
});

beforeAll(() => {
	const app = {
		commit: '',
		description: '',
		js_entrypoint: '',
		name: MAIL_APP_ID,
		priority: 0,
		version: '',
		type: 'carbonio' as const,
		icon: '',
		display: ''
	};
	testingUtility.initShell([app]);
	testingUtility.setAccounts({
		account: generateAccount(),
		authenticated: true,
		settings: generateSettings(),
		usedQuota: 0
	});
});
