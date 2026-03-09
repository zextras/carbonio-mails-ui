/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import * as hooks from '@zextras/carbonio-shell-ui';
import { FolderActionsType, FOLDERS, SoapFolderAction } from '@zextras/carbonio-ui-commons';

import { makeListItemsVisible, setupTest } from '@test-setup';
import { getCurrentRoute, useLocalStorage } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { generateFolder } from '@test-utils/folders/folders-generator';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateFoldersStore } from '@test-utils/store/folders';
import { generateMessage } from '__test__/generators/generateMessage';
import { MAIL_APP_ID, MAILS_ROUTE } from 'constants/index';
import { setMessagesInEmailStore } from 'store/emails/store';
import { MsgActionRequest } from 'types/soap/msg-action';
import Sidebar from 'views/sidebar/sidebar';

function fakeCounter(): { count: number; setCount: (value: number) => void } {
	let count = 0;
	const setCount = (value: number): void => {
		count = value;
	};
	return { count, setCount };
}
describe('Sidebar', () => {
	getCurrentRoute.mockReturnValue({
		route: MAILS_ROUTE,
		id: MAIL_APP_ID,
		app: MAIL_APP_ID
	});
	describe('actions', () => {
		beforeEach(() => {
			useLocalStorage.mockReturnValue([[FOLDERS.USER_ROOT], vi.fn()]);
		});
		it('Marks all messages as read in the inbox folder', async () => {
			const folderId = FOLDERS.INBOX;

			createSoapAPIInterceptor('Search');
			const message = generateMessage();
			setMessagesInEmailStore([message], false);

			populateFoldersStore();
			const options = {
				initialEntries: [`/mails/folder/${folderId}`],
				path: '/mails/*'
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

		// FIXME: failing test
		it.skip('Creates a new folder when the NEW action is clicked', async () => {
			const folderId = FOLDERS.INBOX;
			const message = generateMessage();
			setMessagesInEmailStore([message], false);

			populateFoldersStore();
			const options = {
				initialEntries: [`/mails/folder/${folderId}`],
				path: '/mails/*'
			};

			const { user } = setupTest(<Sidebar expanded />, options);

			const inboxItem = await screen.findByTestId(`accordion-folder-item-${folderId}`);
			await user.hover(inboxItem);

			const contextMenu = await screen.findByTestId(`folder-context-menu-${folderId}`);
			expect(contextMenu).toBeInTheDocument();

			const child = await screen.findByTestId('folder-context-menu-child');
			expect(child).toBeInTheDocument();

			await user.rightClick(child);

			const actionMenuItem = await screen.findByTestId(`folder-action-${FolderActionsType.NEW}`);

			const interceptor = createSoapAPIInterceptor<{
				folder: { l: string; name: string; view: string };
			}>('CreateFolder');

			await user.click(actionMenuItem);

			const createButton = screen.getByRole('button', { name: /label\.create/i });
			await user.click(createButton);
			const { folder } = await interceptor;
			expect(folder.l).toBe(FOLDERS.INBOX);
			expect(folder.name).toBe('new_folder');
			expect(folder.view).toBe('message');
		});

		it.skip('delete all the folder messages when the EMPTY action is clicked', async () => {
			const folderId = FOLDERS.TRASH;

			createSoapAPIInterceptor('Search');
			const message = generateMessage();
			setMessagesInEmailStore([message], false);

			populateFoldersStore();
			const options = {
				initialEntries: [`/mails/folder/${folderId}`],
				path: '/mails/*'
			};

			const { user } = setupTest(<Sidebar expanded />, options);

			const inboxItem = await screen.findByTestId(`accordion-folder-item-${folderId}`);
			await user.hover(inboxItem);

			const contextMenu = await screen.findByTestId(`folder-context-menu-${folderId}`);
			expect(contextMenu).toBeInTheDocument();

			const child = await screen.findByTestId('folder-context-menu-child');
			expect(child).toBeInTheDocument();

			await user.rightClick(child);

			const actionMenuItem = await screen.findByTestId(`folder-action-${FolderActionsType.EMPTY}`);
			const interceptor = createSoapAPIInterceptor<{ action: SoapFolderAction & { type: string } }>(
				'FolderAction'
			);

			await user.click(actionMenuItem);

			const confirmButton = screen.getByRole('button', { name: /label\.empty/i });
			await user.click(confirmButton);
			const { action } = await interceptor;
			expect(action.id).toBe(folderId);
			expect(action.op).toBe('empty');
			expect(action.recursive).toBe(true);
			expect(action.type).toBe('emails');
		});

		it.skip('moves the folder messages when the RESTORE action is clicked', async () => {
			vi.spyOn(hooks, 'useAppContext').mockReturnValue(fakeCounter());
			const folderId = FOLDERS.TRASH;

			populateFoldersStore();

			createSoapAPIInterceptor('Search');
			const message = generateMessage({ folderId: FOLDERS.TRASH });
			setMessagesInEmailStore([message], false);

			const options = {
				initialEntries: [`/mails/folder/${FOLDERS.INBOX}`],
				path: '/mails/*'
			};

			const { user } = setupTest(<Sidebar expanded />, options);
			const interceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
			const inboxItem = await screen.findByTestId(`accordion-folder-item-${folderId}`);
			await user.hover(inboxItem);

			const contextMenu = await screen.findByTestId(`folder-context-menu-${folderId}`);
			expect(contextMenu).toBeInTheDocument();

			const child = await screen.findByTestId('folder-context-menu-child');
			expect(child).toBeInTheDocument();

			await user.rightClick(child);

			const actionMenuItem = await screen.findByTestId(`folder-action-${FolderActionsType.MOVE}`);

			await user.click(actionMenuItem);
			makeListItemsVisible();

			const destinationFolder = screen.getByTestId(`folder-accordion-item-${FOLDERS.INBOX}`);

			await user.click(destinationFolder);

			const confirmButton = screen.getByRole('button', { name: /move/i });
			await waitFor(() => expect(confirmButton).toBeEnabled());
			await user.click(confirmButton);
			const { action } = await waitFor(() => interceptor);
			expect(action.id).toBe(message.id);
			expect(action.op).toBe('move');
			expect(action.l).toBe(FOLDERS.INBOX);
		});

		// FIXME: timeout
		it.skip('delete the folder when the DELETE action is clicked', async () => {
			const folderId = '666';

			const folderToDelete = generateFolder({
				id: folderId,
				name: 'folderToDelete',
				isLink: false,
				view: 'message',
				l: FOLDERS.INBOX
			});
			createSoapAPIInterceptor('Search');
			const message = generateMessage();
			setMessagesInEmailStore([message], false);

			populateFoldersStore({ customFolders: [folderToDelete] });
			const options = {
				initialEntries: [`/mails/folder/${folderId}`],
				path: '/mails/*'
			};

			const { user } = setupTest(<Sidebar expanded />, options);

			const inboxItem = await screen.findByTestId(`accordion-folder-item-${folderId}`);
			await user.hover(inboxItem);

			const contextMenu = await screen.findByTestId(`folder-context-menu-${folderId}`);
			expect(contextMenu).toBeInTheDocument();

			const child = await screen.findByTestId('folder-context-menu-child');
			expect(child).toBeInTheDocument();

			await user.rightClick(child);

			const actionMenuItem = await screen.findByTestId(`folder-action-${FolderActionsType.DELETE}`);
			const interceptor = createSoapAPIInterceptor<{ action: SoapFolderAction }>('FolderAction');

			await user.click(actionMenuItem);

			const confirmButton = screen.getByRole('button', { name: /action\.ok/i });
			await user.click(confirmButton);
			const { action } = await interceptor;
			expect(action.id).toBe(folderId);
			expect(action.op).toBe('move');
			expect(action.l).toBe(FOLDERS.TRASH);
		});
	});
});
