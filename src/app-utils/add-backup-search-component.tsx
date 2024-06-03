/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { ModalManager } from '@zextras/carbonio-design-system';
import { addRoute, t } from '@zextras/carbonio-shell-ui';
import { Route, useRouteMatch } from 'react-router-dom';

import { BACKUP_SEARCH_ROUTE } from '../constants';
import { StoreProvider } from '../store/redux';

const LazyBackupSearchView = React.lazy(
	() =>
		import(
			/* webpackChunkName: "mails-backup-search-view" */ '../views/backup-search/backup-search-view'
		)
);

const BackupSearchViewComponent = (): React.JSX.Element => {
	const { path } = useRouteMatch();
	return (
		<StoreProvider>
			<ModalManager>
				<Route path={`${path}/:itemId?`}>
					<LazyBackupSearchView />
				</Route>
			</ModalManager>
		</StoreProvider>
	);
};

export const addBackupSearchComponent = async (hasBackupSearchMessages: boolean): Promise<void> => {
	if (!hasBackupSearchMessages) return;
	const label = t('label.backup_search', 'Backup Search');
	addRoute({
		route: BACKUP_SEARCH_ROUTE,
		position: 1000,
		visible: true,
		label,
		primaryBar: 'RestoreOutline',
		appView: BackupSearchViewComponent
	});
};
