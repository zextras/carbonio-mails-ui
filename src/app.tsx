/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect } from 'react';

import { useIsCarbonioCE } from '@zextras/carbonio-shell-ui';
import { isEmpty } from 'lodash';

import { addComponentsToShell } from './app-utils/add-shell-components';
import { registerShellActions } from './app-utils/register-shell-actions';
import { registerShellIntegrations } from './app-utils/register-shell-integrations';
import { toggleBackupSearchComponent } from './app-utils/toggle-backup-search-component';
import { FOLDER_VIEW } from './carbonio-ui-commons/constants';
import { useFoldersController } from './carbonio-ui-commons/hooks/use-folders-controller';
import { StoreProvider } from './store/redux';
import { useBackupSearchStore } from './store/zustand/backup-search/store';
import { GlobalExtraWindowManager } from './views/app/extra-windows/global-extra-window-manager';
import { GlobalModalManager } from './views/global-modal-manager';
import { SyncDataHandler } from './views/sidebar/sync-data-handler';

const App = (): React.JSX.Element => {
	const hasBackupSearchMessages = !isEmpty(useBackupSearchStore().messages);
	const isCarbonioCE = useIsCarbonioCE();

	useEffect(() => {
		addComponentsToShell(isCarbonioCE);
	}, [isCarbonioCE]);

	useEffect(() => {
		registerShellIntegrations();
		registerShellActions();
	}, []);

	useEffect(() => {
		toggleBackupSearchComponent(hasBackupSearchMessages);
	}, [hasBackupSearchMessages]);

	useFoldersController(FOLDER_VIEW.message);

	return (
		<StoreProvider>
			<GlobalModalManager>
				<GlobalExtraWindowManager>
					<SyncDataHandler />
				</GlobalExtraWindowManager>
			</GlobalModalManager>
		</StoreProvider>
	);
};

export default App;
