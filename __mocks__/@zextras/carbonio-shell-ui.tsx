/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactNode } from 'react';

import type * as shell from '@zextras/carbonio-shell-ui';
import type { Mock } from 'vitest';

import { generateAccount } from '@test-utils/accounts/account-generator';
import { generateSettings } from '@test-utils/settings/settings-generator';

export const useAuthenticated: Mock<typeof shell.useAuthenticated> = vi.fn(() => true);

export const mockedAccount = generateAccount();
const mockedAccounts = [mockedAccount];
const mockedSettings = generateSettings();

export const getUserAccount = vi.fn(() => mockedAccount);
export const useUserAccount = vi.fn(() => mockedAccount);
export const useUserAccounts = vi.fn(() => mockedAccounts);

export const useUserSettings = vi.fn(() => mockedSettings);
export const getUserSettings = vi.fn(() => mockedSettings);
export const t = vi.fn((key: string) => key);
export const replaceHistory = vi.fn();
export const pushHistory = vi.fn();

export const useBoard = vi.fn();

export const useAppContext: Mock<typeof shell.useAppContext> = vi.fn(() => mockedAccounts);
export const setAppContext = vi.fn();
export const getBridgedFunctions = vi.fn();
export const addBoard = vi.fn();
export const closeBoard = vi.fn();
export const updateBoardContext = vi.fn();
export const updateBoard = vi.fn();
export const useBoardHooks = vi.fn(() => ({
	closeBoard,
	updateBoard,
	setCurrentBoard: vi.fn(),
	getBoardContext: vi.fn(),
	getBoard: vi.fn()
}));
export const minimizeBoards = vi.fn();
export const getCurrentRoute = vi.fn();
export const useIsCarbonioCE = vi.fn(() => false);

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
export const getAction = vi.fn((type, id) => [undefined, false]);

export const useActions = vi.fn(() => []);

// Integrated functions
export const getIntegratedFunction: Mock<typeof shell.getIntegratedFunction> = vi.fn(
	<TFunction extends (...args: any[]) => any = (...args: any[]) => any>(
		_id: string
	): [TFunction, boolean] => {
		const fn: TFunction = ((..._args: any[]) => undefined) as TFunction;
		return [fn, false];
	}
);

export const useIntegratedFunction: Mock<typeof shell.useIntegratedFunction> = vi.fn(
	<TFunction extends (...args: any[]) => any = (...args: any[]) => any>(
		_id: string
	): [TFunction, boolean] => {
		const fn: TFunction = ((..._args: any[]) => undefined) as TFunction;
		return [fn, false];
	}
);

export const JSNS = {
	account: 'urn:zimbraAccount',
	admin: 'urn:zimbraAdmin',
	mail: 'urn:zimbraMail',
	all: 'urn:zimbra',
	sync: 'urn:zimbraSync'
};

export const getNotificationManager = vi.fn();
export const IS_FOCUS_MODE = false;
