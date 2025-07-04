/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { ModalManager } from '@zextras/carbonio-design-system';
import { addRoute, removeRoute, t } from '@zextras/carbonio-shell-ui';
import { Route, Routes } from 'react-router-dom';

import { BACKUP_SEARCH_ROUTE } from 'constants/index';

const LazyBackupSearchView = React.lazy(
	() =>
		import(
			/* webpackChunkName: "mails-backup-search-view" */ '../views/backup-search/backup-search-view'
		)
);

const BackupSearchViewComponent = (): React.JSX.Element => (
	<ModalManager>
		<Routes>
			<Route path={`:itemId?`} element={<LazyBackupSearchView />} />
		</Routes>
	</ModalManager>
);

export const toggleBackupSearchComponent = async (hasMessages: boolean): Promise<void> => {
	if (!hasMessages) {
		removeRoute(BACKUP_SEARCH_ROUTE);
		return;
	}

	addRoute({
		route: BACKUP_SEARCH_ROUTE,
		position: 1000,
		visible: true,
		label: t('label.backup_search', 'Backup Search'),
		primaryBar: 'RestoreOutline',
		appView: BackupSearchViewComponent
	});
};
