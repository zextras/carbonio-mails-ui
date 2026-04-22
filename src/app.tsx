/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { AppContextInitializer } from 'app-utils/app-context-initializer';
import { BackupSearchComponentToggler } from 'app-utils/backup-search-component-toggler';
import { SearchRegistration } from 'app-utils/search-registration';
import { ShellRegistrations } from 'app-utils/shell-registrations';
import { AuthGuard } from 'auth-guard';
import { GlobalModalManager } from 'views/global-modal-manager';
import { InitializeFolders } from 'views/sidebar/initialize-folders';
import { InitializeServicesCatalog } from 'views/sidebar/initialize-services-catalog';
import { InitializeTags } from 'views/sidebar/initialize-tags';
import { QuotaRefreshHandler } from 'views/sidebar/quota-refresh-handler';
import { SyncDataHandler } from 'views/sidebar/sync-data-handler';

const App = (): React.JSX.Element => (
	<AuthGuard>
		<AppContextInitializer />
		<ShellRegistrations />
		<BackupSearchComponentToggler />
		<SearchRegistration />
		<GlobalModalManager>
			<InitializeFolders />
			<InitializeTags />
			<SyncDataHandler />
			<InitializeServicesCatalog />
			<QuotaRefreshHandler />
		</GlobalModalManager>
	</AuthGuard>
);

export default App;
