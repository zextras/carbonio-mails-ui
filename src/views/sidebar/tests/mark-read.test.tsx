/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { fireEvent, screen } from '@testing-library/react';

import { FolderActionsType } from '../../../carbonio-ui-commons/constants/folders';
import * as shellMock from '../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { useLocalStorage } from '../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { FOLDERS } from '../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui-constants';
import { createAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../../carbonio-ui-commons/test/mocks/store/folders';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { MAIL_APP_ID, MAILS_ROUTE } from '../../../constants';
import { generateStore } from '../../../tests/generators/store';
import { SoapFolderAction } from '../../../types';
import Sidebar from '../sidebar';

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

		const { user } = setupTest(<Sidebar expanded />, options);

		const inboxItem = screen.getByTestId(`accordion-folder-item-${folderId}`);
		fireEvent.contextMenu(inboxItem);
		await screen.findByTestId(`folder-context-menu-${folderId}`);
		const actionMenuItem = await screen.findByTestId(
			`folder-action-${FolderActionsType.MARK_ALL_READ}`
		);
		const folderActionInterceptor = createAPIInterceptor<SoapFolderAction>(
			'FolderAction',
			'action'
		);

		await user.click(actionMenuItem);

		const actionParams = await folderActionInterceptor;
		expect(actionParams.l).toBe(folderId);
		expect(actionParams.op).toBe('read');
		expect(actionParams.id).toBe(folderId);
	});
});
