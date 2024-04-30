/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect } from 'react';

import { addShellComponents } from './app-utils/add-shell-components';
import { registerShellActionsAndFunctions } from './app-utils/register-shell-actions-and-functions';
import { FOLDER_VIEW } from './carbonio-ui-commons/constants';
import { useFoldersController } from './carbonio-ui-commons/hooks/use-folders-controller';
import { StoreProvider } from './store/redux';
import { SyncDataHandler } from './views/sidebar/sync-data-handler';

const App = (): React.JSX.Element => {
	useEffect(() => {
		addShellComponents();
		registerShellActionsAndFunctions();
	}, []);

	useFoldersController(FOLDER_VIEW.message);

	return (
		<StoreProvider>
			<SyncDataHandler />
		</StoreProvider>
	);
};

export default App;
