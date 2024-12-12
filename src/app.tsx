/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { BackupSearchComponentToggler } from './app-utils/backup-search-component-toggler';
import { ShellRegistrations } from './app-utils/shell-registrations';
import { AuthGuard } from './auth-guard';
import { StoreProvider } from './store/redux';
import { GlobalExtraWindowManager } from './views/app/extra-windows/global-extra-window-manager';
import { GlobalModalManager } from './views/global-modal-manager';
import { InitializeFolders } from './views/sidebar/initialize-folders';
import { InitializeServicesCatalog } from './views/sidebar/initialize-services-catalog';
import { SyncDataHandler } from './views/sidebar/sync-data-handler';

const App = (): React.JSX.Element => (
	<AuthGuard>
		<ShellRegistrations />
		<BackupSearchComponentToggler />

		<StoreProvider>
			<GlobalModalManager>
				<GlobalExtraWindowManager>
					<InitializeFolders />
					<SyncDataHandler />
					<InitializeServicesCatalog />
				</GlobalExtraWindowManager>
			</GlobalModalManager>
		</StoreProvider>
	</AuthGuard>
);

export default App;
