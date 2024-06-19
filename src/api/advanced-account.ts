/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	type AdvancedAccountStore,
	useAdvancedAccountStore
} from '../store/zustand/advanced-account/store';

export const advancedAccountAPI = (): Promise<AdvancedAccountStore> =>
	fetch('/zx/login/v3/account')
		.then(async (data) => {
			const { backupSelfUndeleteAllowed } = await data.json();
			if (data.status === 200) {
				useAdvancedAccountStore
					.getState()
					.updateBackupSelfUndeleteAllowed(!!backupSelfUndeleteAllowed);
			}
			return useAdvancedAccountStore.getState();
		})
		.catch(() => {
			useAdvancedAccountStore.getState().updateBackupSelfUndeleteAllowed(false);
			return useAdvancedAccountStore.getState();
		});
