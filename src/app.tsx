/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect } from 'react';

import { addShellComponents } from './app-utils/add-shell-components';
import { registerShellActions } from './app-utils/register-shell-actions';
import { registerShellIntegrations } from './app-utils/register-shell-integrations';
import { FOLDER_VIEW } from './carbonio-ui-commons/constants';
import { useFoldersController } from './carbonio-ui-commons/hooks/use-folders-controller';
import { StoreProvider } from './store/redux';
import { GlobalExtraWindowManager } from './views/app/extra-windows/global-extra-window-manager';
import { SyncDataHandler } from './views/sidebar/sync-data-handler';

const App = (): React.JSX.Element => {
	useEffect(() => {
		addShellComponents();
		registerShellIntegrations();
		registerShellActions();
	}, []);

	useFoldersController(FOLDER_VIEW.message);

	return (
		<StoreProvider>
			<GlobalExtraWindowManager>
				<SyncDataHandler />
			</GlobalExtraWindowManager>
		</StoreProvider>
	);
};

export default App;
