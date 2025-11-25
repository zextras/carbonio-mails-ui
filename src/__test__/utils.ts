/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { noop } from 'lodash';

import * as advancedAccount from 'api/advanced-account-api';

export function mockAdvancedAccountAPI(store: { backupSelfUndeleteAllowed: boolean }): void {
	vi.spyOn(advancedAccount, 'advancedAccountApi').mockImplementation(() =>
		Promise.resolve({ ...store, updateBackupSelfUndeleteAllowed: noop })
	);
}
