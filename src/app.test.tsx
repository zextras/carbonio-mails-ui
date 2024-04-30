/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import App from './app';
import * as addShellComponents from './app-utils/add-shell-components';
import * as registerShellActionsAndFunctions from './app-utils/register-shell-actions-and-functions';
import * as useFoldersController from './carbonio-ui-commons/hooks/use-folders-controller';
import { setupTest } from './carbonio-ui-commons/test/test-setup';

describe('App', () => {
	it.only('should register a "mails" route accessible from the primary bar with specific position, name and icon', () => {
		const useFoldersControllerSpy = jest.spyOn(useFoldersController, 'useFoldersController');
		const addShellComponentsSpy = jest.spyOn(addShellComponents, 'addShellComponents');
		const registerShellActionsAndFunctionsSpy = jest.spyOn(
			registerShellActionsAndFunctions,
			'registerShellActionsAndFunctions'
		);
		setupTest(<App />);
		expect(addShellComponentsSpy).toHaveBeenCalled();
		expect(registerShellActionsAndFunctionsSpy).toHaveBeenCalled();
		expect(useFoldersControllerSpy).toHaveBeenCalledWith('message');
	});
});
