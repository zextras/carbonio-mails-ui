/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
import { screen, within } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { faker } from '@faker-js/faker';
import { rest } from 'msw';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../tests/generators/store';
import { NewModal } from '../new-modal';
import { Folder } from '../../../carbonio-ui-commons/types/folder';
import { getSetupServer } from '../../../carbonio-ui-commons/test/jest-setup';
import { populateFoldersStore } from '../../../carbonio-ui-commons/test/mocks/store/folders';

describe('new-modal', () => {
	test('add folder name and create button should enabled', async () => {
		const closeFn = jest.fn();
		const store = generateStore();
		populateFoldersStore();
		const folder: Folder = {
			id: FOLDERS.INBOX,
			uuid: faker.datatype.uuid(),
			name: 'Inbox',
			absFolderPath: '/Inbox',
			l: FOLDERS.USER_ROOT,
			luuid: faker.datatype.uuid(),
			checked: false,
			f: 'ui',
			u: 37,
			rev: 1,
			ms: 2633,
			n: 889,
			s: 174031840,
			i4ms: 33663,
			i4next: 17222,
			activesyncdisabled: false,
			webOfflineSyncDays: 30,
			recursive: false,
			deletable: false,
			acl: {
				grant: []
			},
			isLink: false,
			children: [],
			parent: undefined,
			depth: 1
		};
		const { user } = setupTest(<NewModal onClose={closeFn} folder={folder} />, { store });

		expect(screen.getByTestId('new-folder-name')).toBeInTheDocument();
		const newFolder = screen.getByTestId('new-folder-name');
		const folderName = faker.lorem.word();
		const folderInputElement = within(newFolder).getByRole('textbox');

		expect(newFolder).toBeInTheDocument();
		await user.clear(folderInputElement);

		// Insert the new folder name into the text input
		await user.type(folderInputElement, folderName);

		const createButton = screen.getByRole('button', {
			name: /label.create/i
		});
		expect(createButton).toBeEnabled();

		const cancelButton = screen.getByRole('button', {
			name: /label.cancel/i
		});
		expect(cancelButton).toBeEnabled();
	});

	test('create button should be disabled on blank folder name', async () => {
		const closeFn = jest.fn();
		const store = generateStore();
		populateFoldersStore();
		const folder: Folder = {
			id: FOLDERS.INBOX,
			uuid: faker.datatype.uuid(),
			name: 'Inbox',
			absFolderPath: '/Inbox',
			l: FOLDERS.USER_ROOT,
			luuid: faker.datatype.uuid(),
			checked: false,
			f: 'ui',
			u: 37,
			rev: 1,
			ms: 2633,
			n: 889,
			s: 174031840,
			i4ms: 33663,
			i4next: 17222,
			activesyncdisabled: false,
			webOfflineSyncDays: 30,
			recursive: false,
			deletable: false,
			acl: {
				grant: []
			},
			isLink: false,
			children: [],
			parent: undefined,
			depth: 1
		};
		const { user } = setupTest(<NewModal onClose={closeFn} folder={folder} />, { store });

		expect(screen.getByTestId('new-folder-name')).toBeInTheDocument();
		const newFolder = screen.getByTestId('new-folder-name');
		const folderInputElement = within(newFolder).getByRole('textbox');

		expect(newFolder).toBeInTheDocument();
		await user.clear(folderInputElement);

		const createButton = screen.getByRole('button', {
			name: /label.create/i
		});
		expect(createButton).toBeDisabled();

		const cancelButton = screen.getByRole('button', {
			name: /label.cancel/i
		});
		expect(cancelButton).toBeEnabled();
	});

	test('API is called with the proper parameters to create new folder', async () => {
		const closeFn = jest.fn();
		const store = generateStore();
		populateFoldersStore();
		const folder: Folder = {
			id: FOLDERS.INBOX,
			uuid: faker.datatype.uuid(),
			name: 'Inbox',
			absFolderPath: '/Inbox',
			l: FOLDERS.USER_ROOT,
			luuid: faker.datatype.uuid(),
			checked: false,
			f: 'ui',
			u: 37,
			rev: 1,
			ms: 2633,
			n: 889,
			s: 174031840,
			i4ms: 33663,
			i4next: 17222,
			activesyncdisabled: false,
			webOfflineSyncDays: 30,
			recursive: false,
			deletable: false,
			acl: {
				grant: []
			},
			isLink: false,
			children: [],
			parent: undefined,
			depth: 1
		};
		const { user } = setupTest(<NewModal onClose={closeFn} folder={folder} />, { store });

		expect(screen.getByTestId('new-folder-name')).toBeInTheDocument();
		const newFolderName = screen.getByTestId('new-folder-name');
		const folderInputElement = within(newFolderName).getByRole('textbox');

		expect(newFolderName).toBeInTheDocument();
		await user.clear(folderInputElement);

		const folderName = faker.lorem.word();
		// Insert the new folder name into the text input
		await user.type(folderInputElement, folderName);

		const createButton = screen.getByRole('button', {
			name: /label.create/i
		});
		expect(createButton).toBeEnabled();

		const wipeInterceptor = new Promise<any>((resolve, reject) => {
			// Register a handler for the REST call
			getSetupServer().use(
				rest.post('/service/soap/CreateFolderRequest', async (req, res, ctx) => {
					if (!req) {
						reject(new Error('Empty request'));
					}

					const msg = (await req.json()).Body.CreateFolderRequest.folder;
					resolve(msg);

					// Don't care about the actual response
					return res(
						ctx.json({
							Body: {
								Fault: {}
							}
						})
					);
				})
			);
		});
		await user.click(createButton);

		const newFolder = await wipeInterceptor;
		expect(newFolder.view).toBe('message');
		expect(newFolder.l).toBe(folder.id);
		expect(newFolder.name).toBe(folderName);
	});
});
