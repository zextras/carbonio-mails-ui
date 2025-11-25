/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactNode } from 'react';

import * as shell from '@zextras/carbonio-shell-ui';
import { useActions as realUseActions } from '@zextras/carbonio-shell-ui';

import { generateAccount } from '@test-utils/accounts/account-generator';
import { generateSettings } from '@test-utils/settings/settings-generator';

export const mockedAccount = generateAccount();
const mockedAccounts = [mockedAccount];
const mockedSettings = generateSettings();

export const getUserAccount: Mock<ReturnType<typeof shell.getUserAccount>> = vi.fn(
	() => mockedAccount
);
export const useUserAccount: Mock<ReturnType<typeof shell.useUserAccount>> = vi.fn(
	() => mockedAccount
);
export const useUserAccounts: Mock<ReturnType<typeof shell.useUserAccounts>> = vi.fn(
	() => mockedAccounts
);

export const useUserSettings = vi.fn(() => mockedSettings);
export const getUserSettings = vi.fn(() => mockedSettings);
export const t = vi.fn((key: string) => key);
export const replaceHistory = vi.fn();
export const pushHistory = vi.fn();

export const useBoard = vi.fn();

export const useAppContext = vi.fn<unknown, []>(() => mockedAccounts);
export const setAppContext = vi.fn();
export const getBridgedFunctions = vi.fn();
export const addBoard = vi.fn();
export const closeBoard = vi.fn();
export const updateBoardContext = vi.fn();
export const useBoardHooks = vi.fn().mockReturnValue({
	closeBoard: vi.fn(),
	updateBoard: vi.fn(),
	setCurrentBoard: vi.fn(),
	getBoardContext: vi.fn(),
	getBoard: vi.fn()
});
export const minimizeBoards = vi.fn();
export const getCurrentRoute = vi.fn();
export const useIsCarbonioCE: Mock<ReturnType<typeof shell.useIsCarbonioCE>> = vi.fn(
	() => false
);

export const useLocalStorage = vi.fn();
export const AppLink: FC<{ children: ReactNode }> = ({ children }) => <>{children}</>;
export const editSettings = vi.fn(() => Promise.resolve({ data: {} }));
export const registerComponents: typeof shell.registerComponents = vi.fn();
export const registerActions: typeof shell.registerActions = vi.fn();
export const addRoute: typeof shell.addRoute = vi.fn();
export const removeRoute: typeof shell.removeRoute = vi.fn();
export const addSettingsView: typeof shell.addSettingsView = vi.fn();
export const addBoardView: typeof shell.addBoardView = vi.fn();
export const getBoardById: typeof shell.getBoardById = vi.fn();
export const setCurrentBoard: typeof shell.setCurrentBoard = vi.fn();
export const reopenBoards: typeof shell.reopenBoards = vi.fn();
export const registerFunctions: typeof shell.registerFunctions = vi.fn();
export const upsertApp: typeof shell.upsertApp = vi.fn();

/*
 * Integration mocks
 */

// Integrated components
const FakeIntegrationComponent = (): React.JSX.Element => <div data-testid="fake-component" />;
const IntegrationComponent = vi.fn(FakeIntegrationComponent);
const isIntegrationAvailable = false;
export const useIntegratedComponent = vi.fn((id: string) => [
	IntegrationComponent,
	isIntegrationAvailable
]);
export const getIntegratedComponent = vi.fn((id: string) => [
	IntegrationComponent,
	isIntegrationAvailable
]);

// Integrated actions
export const getAction = vi.fn<
	ReturnType<typeof shell.getAction>,
	Parameters<typeof shell.getAction>
>((type, id) => [undefined, false]);

export const useActions = jest
	.fn<ReturnType<typeof realUseActions>, Parameters<typeof realUseActions>>()
	.mockImplementation(() => []);

// Integrated functions
export const getIntegratedFunction: Mock<
	ReturnType<typeof shell.getIntegratedFunction>,
	Parameters<typeof shell.getIntegratedFunction>,
	any
> = vi.fn<
	ReturnType<typeof shell.getIntegratedFunction>,
	Parameters<typeof shell.getIntegratedFunction>
>((id) => [vi.fn(), false]);

export const useIntegratedFunction: Mock<
	ReturnType<typeof shell.useIntegratedFunction>,
	Parameters<typeof shell.useIntegratedFunction>,
	any
> = vi.fn<
	ReturnType<typeof shell.useIntegratedFunction>,
	Parameters<typeof shell.useIntegratedFunction>
>((id) => [vi.fn(), false]);

export const JSNS = { ...shell.JSNS };
