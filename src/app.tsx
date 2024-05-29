/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect } from 'react';

import { isEmpty } from 'lodash';

import { addBackupSearchComponent } from './app-utils/add-backup-search-component';
import { addShellComponents } from './app-utils/add-shell-components';
import { registerShellActions } from './app-utils/register-shell-actions';
import { registerShellIntegrations } from './app-utils/register-shell-integrations';
import { FOLDER_VIEW } from './carbonio-ui-commons/constants';
import { useFoldersController } from './carbonio-ui-commons/hooks/use-folders-controller';
import { StoreProvider } from './store/redux';
import { useBackupSearchStore } from './store/zustand/backup-search/store';
import { GlobalModalManager } from './views/global-modal-manager';
import { SyncDataHandler } from './views/sidebar/sync-data-handler';

const App = (): React.JSX.Element => {
	const hasBackupSearchMessages = !isEmpty(useBackupSearchStore().messages);

	useEffect(() => {
		addShellComponents();
		registerShellIntegrations();
		registerShellActions();
	}, []);

	useEffect(() => {
		addBackupSearchComponent(hasBackupSearchMessages);
	}, [hasBackupSearchMessages]);

	useFoldersController(FOLDER_VIEW.message);

	return (
		<StoreProvider>
			<GlobalModalManager>
				<SyncDataHandler />
			</GlobalModalManager>
		</StoreProvider>
	);
};

export default App;
