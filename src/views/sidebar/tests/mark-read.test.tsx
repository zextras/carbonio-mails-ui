/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen } from '@testing-library/react';

import { FolderActionsType, FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import * as shellMock from '../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { useLocalStorage } from '../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../../carbonio-ui-commons/test/mocks/store/folders';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { MAIL_APP_ID, MAILS_ROUTE } from '../../../constants';
import { generateStore } from '../../../tests/generators/store';
import { SoapFolderAction } from '../../../types';
import Sidebar from '../sidebar';

// Mocking the worker. In commons jest-setup the worker is already mocked, but is improperly defined with wrong types and
// is causing a call to "onMessage", which tries to alter the folders store and overrides the folders, breaking the test.
// It also causes warning/errors due the fact it tries to set an "undefined" in the folders.
// I think we should consider removing that mock or redefine it or make it configurable
jest.mock('../../../carbonio-ui-commons/worker', () => ({
	folderWorker: {
		postMessage: (msg: string): void => {}
	}
}));
describe('Mark all as read', () => {
	shellMock.getCurrentRoute.mockReturnValue({
		route: MAILS_ROUTE,
		id: MAIL_APP_ID,
		app: MAIL_APP_ID
	});

	test('Mark all messages as read in the inbox folder', async () => {
		const folderId = FOLDERS.INBOX;
		useLocalStorage.mockReturnValue([[FOLDERS.USER_ROOT], jest.fn()]);

		populateFoldersStore();
		const options = {
			store: generateStore(),
			initialEntries: [`/mails/folder/${folderId}`],
			path: '/mails'
		};

		const getFolderInterceptor = createSoapAPIInterceptor('GetFolder', {
			folder: [
				{
					id: '1',
					name: 'USER_ROOT',
					folder: [
						{
							id: '2',
							isLink: false,
							uuid: 'eb4d8118-ea4f-488c-a4ad-293bb11f7495',
							deletable: false,
							name: 'INBOX',
							absFolderPath: '/INBOX',
							l: '1',
							luuid: '86c8fdd1-f993-43d5-ae5c-06631f9150c5',
							view: 'message',
							rev: 1,
							ms: 1,
							webOfflineSyncDays: 0,
							activesyncdisabled: false,
							n: 0,
							s: 0,
							i4ms: 1,
							i4next: 15
						}
					]
				}
			]
		});

		const getShareInfoInterceptor = createSoapAPIInterceptor('GetShareInfo', undefined);

		const { user } = setupTest(<Sidebar expanded />, options);
		await getFolderInterceptor;
		await getShareInfoInterceptor;

		const inboxItem = screen.getByTestId(`accordion-folder-item-${folderId}`);

		act(() => {
			user.rightClick(inboxItem);
		});
		await screen.findByTestId(`folder-context-menu-${folderId}`);
		const actionMenuItem = await screen.findByTestId(
			`folder-action-${FolderActionsType.MARK_ALL_READ}`
		);
		const folderActionInterceptor = createSoapAPIInterceptor<{ action: SoapFolderAction }>(
			'FolderAction'
		);

		await act(async () => {
			await user.click(actionMenuItem);
		});

		const { action } = await folderActionInterceptor;
		expect(action.l).toBe(folderId);
		expect(action.op).toBe('read');
		expect(action.id).toBe(folderId);
	});
});
