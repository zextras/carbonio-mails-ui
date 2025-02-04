/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import { FolderActionsType, FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import * as shellMock from '../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { useLocalStorage } from '../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../../carbonio-ui-commons/test/mocks/store/folders';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { MAIL_APP_ID, MAILS_ROUTE } from '../../../constants';
import { setMessagesInEmailStore } from '../../../store/emails/store';
import { generateMessage } from '../../../tests/generators/generateMessage';
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

		createSoapAPIInterceptor('Search');
		const message = generateMessage();
		setMessagesInEmailStore([message], false);

		populateFoldersStore();
		const options = {
			initialEntries: [`/mails/folder/${folderId}`],
			path: '/mails'
		};

		const { user } = setupTest(<Sidebar expanded />, options);

		const inboxItem = await screen.findByTestId(`accordion-folder-item-${folderId}`);
		await user.hover(inboxItem);

		const contextMenu = await screen.findByTestId(`folder-context-menu-${folderId}`);
		expect(contextMenu).toBeInTheDocument();

		const child = await screen.findByTestId('folder-context-menu-child');
		expect(child).toBeInTheDocument();

		await user.rightClick(child);

		const actionMenuItem = await screen.findByTestId(
			`folder-action-${FolderActionsType.MARK_ALL_READ}`
		);

		const folderActionInterceptor = createSoapAPIInterceptor<{ action: SoapFolderAction }>(
			'FolderAction'
		);

		await user.click(actionMenuItem);
		const { action } = await folderActionInterceptor;
		expect(action.l).toBe(folderId);
		expect(action.op).toBe('read');
		expect(action.id).toBe(folderId);
	});
});
