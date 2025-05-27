/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactNode } from 'react';

import * as shell from '@zextras/carbonio-shell-ui';
import { useActions as realUseActions } from '@zextras/carbonio-shell-ui';

import { generateAccount } from '../accounts/account-generator';
import { getSoapFetch } from '../network/fetch';
import { generateSettings } from '../settings/settings-generator';

export const mockedAccount = generateAccount();
const mockedAccounts = [mockedAccount];
const mockedSettings = generateSettings();

export const getUserAccount: jest.Mock<ReturnType<typeof shell.getUserAccount>> = jest.fn(
	() => mockedAccount
);
export const useUserAccount: jest.Mock<ReturnType<typeof shell.useUserAccount>> = jest.fn(
	() => mockedAccount
);
export const useUserAccounts: jest.Mock<ReturnType<typeof shell.useUserAccounts>> = jest.fn(
	() => mockedAccounts
);

export const useUserSettings = jest.fn(() => mockedSettings);
export const getUserSettings = jest.fn(() => mockedSettings);
export const t = jest.fn((key: string) => key);
export const replaceHistory = jest.fn();
export const pushHistory = jest.fn();

export const useBoard = jest.fn();

export const useAppContext = jest.fn<unknown, []>(() => mockedAccounts);
export const setAppContext = jest.fn();
export const getBridgedFunctions = jest.fn();
export const addBoard = jest.fn();
export const closeBoard = jest.fn();
export const updateBoardContext = jest.fn();
export const useBoardHooks = jest.fn().mockReturnValue({
	closeBoard: jest.fn(),
	updateBoard: jest.fn(),
	setCurrentBoard: jest.fn(),
	getBoardContext: jest.fn(),
	getBoard: jest.fn()
});
export const minimizeBoards = jest.fn();
export const getCurrentRoute = jest.fn();
export const useIsCarbonioCE: jest.Mock<ReturnType<typeof shell.useIsCarbonioCE>> = jest.fn(
	() => false
);

export * from '../network/fetch';
export const soapFetch = getSoapFetch('test-environment');
export const useNotify: jest.Mock<ReturnType<typeof shell.useNotify>> = jest.fn(() => []);
export const useLocalStorage = jest.fn();
export const AppLink: FC<{ children: ReactNode }> = ({ children }) => <>{children}</>;
export const editSettings = jest.fn(() => Promise.resolve({ data: {} }));
export const registerComponents: typeof shell.registerComponents = jest.fn();
export const registerActions: typeof shell.registerActions = jest.fn();
export const useRefresh: typeof shell.useRefresh = jest.fn();
export const addRoute: typeof shell.addRoute = jest.fn();
export const removeRoute: typeof shell.removeRoute = jest.fn();
export const addSettingsView: typeof shell.addSettingsView = jest.fn();
export const addBoardView: typeof shell.addBoardView = jest.fn();
export const getBoardById: typeof shell.getBoardById = jest.fn();
export const setCurrentBoard: typeof shell.setCurrentBoard = jest.fn();
export const reopenBoards: typeof shell.reopenBoards = jest.fn();
export const registerFunctions: typeof shell.registerFunctions = jest.fn();
export const upsertApp: typeof shell.upsertApp = jest.fn();

/*
 * Integration mocks
 */

// Integrated components
const FakeIntegrationComponent = (): React.JSX.Element => <div data-testid="fake-component" />;
const IntegrationComponent = jest.fn(FakeIntegrationComponent);
const isIntegrationAvailable = false;
export const useIntegratedComponent = jest.fn((id: string) => [
	IntegrationComponent,
	isIntegrationAvailable
]);
export const getIntegratedComponent = jest.fn((id: string) => [
	IntegrationComponent,
	isIntegrationAvailable
]);

// Integrated actions
export const getAction = jest.fn<
	ReturnType<typeof shell.getAction>,
	Parameters<typeof shell.getAction>
>((type, id) => [undefined, false]);

export const useActions = jest
	.fn<ReturnType<typeof realUseActions>, Parameters<typeof realUseActions>>()
	.mockImplementation(() => []);

// Integrated functions
export const getIntegratedFunction: jest.Mock<
	ReturnType<typeof shell.getIntegratedFunction>,
	Parameters<typeof shell.getIntegratedFunction>,
	any
> = jest.fn<
	ReturnType<typeof shell.getIntegratedFunction>,
	Parameters<typeof shell.getIntegratedFunction>
>((id) => [jest.fn(), false]);

export const useIntegratedFunction: jest.Mock<
	ReturnType<typeof shell.useIntegratedFunction>,
	Parameters<typeof shell.useIntegratedFunction>,
	any
> = jest.fn<
	ReturnType<typeof shell.useIntegratedFunction>,
	Parameters<typeof shell.useIntegratedFunction>
>((id) => [jest.fn(), false]);
