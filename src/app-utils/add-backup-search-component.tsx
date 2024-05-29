/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { addRoute, t } from '@zextras/carbonio-shell-ui';

import BackupSearchView from '../views/search/backup-search-view';

export const addBackupSearchComponent = async (hasBackupSearchMessages: boolean): Promise<void> => {
	if (!hasBackupSearchMessages) return;
	const label = t('label.app_name', 'Mails');
	addRoute({
		route: 'backup-search',
		position: 1000,
		visible: true,
		label,
		primaryBar: 'RestoreOutline',
		appView: BackupSearchView
	});
};
