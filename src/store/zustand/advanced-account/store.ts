/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { create } from 'zustand';

export type AdvancedAccountStore = {
	backupSelfUndeleteAllowed: boolean;
	updateBackupSelfUndeleteAllowed: (value: boolean) => void;
};

export const useAdvancedAccountStore = create<AdvancedAccountStore>()((set) => ({
	backupSelfUndeleteAllowed: false,
	updateBackupSelfUndeleteAllowed: (value: boolean): void =>
		// todo: reinvertire a value
		set({ backupSelfUndeleteAllowed: true })
}));
