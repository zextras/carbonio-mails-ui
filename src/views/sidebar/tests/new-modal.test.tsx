/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { faker } from '@faker-js/faker';
import { act, screen, within } from '@testing-library/react';
import { Folder, FOLDERS, SoapFolder } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateFoldersStore } from '@test-utils/store/folders';
import { NewModal } from 'views/sidebar/new-modal';

// TODO IMPROVE BECAUSE TAKES TOO LONG

describe('new-modal', () => {
	test('add folder name and create button should enabled', async () => {
		const closeFn = vi.fn();

		populateFoldersStore();
		const folder: Folder = {
			id: FOLDERS.INBOX,
			uuid: faker.string.uuid(),
			name: 'Inbox',
			absFolderPath: '/Inbox',
			l: FOLDERS.USER_ROOT,
			luuid: faker.string.uuid(),
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
		const { user } = setupTest(<NewModal onClose={closeFn} folder={folder} />);

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
	}, 20000);

	test('create button should be disabled on blank folder name', async () => {
		const closeFn = vi.fn();

		populateFoldersStore();
		const folder: Folder = {
			id: FOLDERS.INBOX,
			uuid: faker.string.uuid(),
			name: 'Inbox',
			absFolderPath: '/Inbox',
			l: FOLDERS.USER_ROOT,
			luuid: faker.string.uuid(),
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
		const { user } = setupTest(<NewModal onClose={closeFn} folder={folder} />);

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
	}, 20000);

	test('API is called with the proper parameters to create new folder', async () => {
		const closeFn = vi.fn();
		populateFoldersStore();
		const folder: Folder = {
			id: FOLDERS.INBOX,
			uuid: faker.string.uuid(),
			name: 'Inbox',
			absFolderPath: '/Inbox',
			l: FOLDERS.USER_ROOT,
			luuid: faker.string.uuid(),
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
		const { user } = setupTest(<NewModal onClose={closeFn} folder={folder} />);

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
		const apiInterceptor = createSoapAPIInterceptor<{ folder: SoapFolder }>('CreateFolder');

		await act(async () => {
			await user.click(createButton);
		});

		const { folder: newFolder } = await apiInterceptor;
		expect(newFolder.view).toBe('message');
		expect(newFolder.l).toBe(folder.id);
		expect(newFolder.name).toBe(folderName);
	}, 20000);

	test('Give error msg if creating with system folder name and create button should be disabled', async () => {
		const closeFn = vi.fn();

		populateFoldersStore();
		const folder: Folder = {
			id: FOLDERS.INBOX,
			uuid: faker.string.uuid(),
			name: 'Inbox',
			absFolderPath: '/Inbox',
			l: FOLDERS.USER_ROOT,
			luuid: faker.string.uuid(),
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
		const { user } = setupTest(<NewModal onClose={closeFn} folder={folder} />);

		expect(screen.getByTestId('new-folder-name')).toBeInTheDocument();
		const newFolder = screen.getByTestId('new-folder-name');
		const folderName = 'Inbox';
		const folderInputElement = within(newFolder).getByRole('textbox');

		expect(newFolder).toBeInTheDocument();
		await user.clear(folderInputElement);

		// Insert the new folder name into the text input
		await user.type(folderInputElement, folderName);

		expect(screen.getByTestId('error-message')).toBeInTheDocument();
		const createButton = screen.getByRole('button', {
			name: /label.create/i
		});
		expect(createButton).toBeDisabled();

		const cancelButton = screen.getByRole('button', {
			name: /label.cancel/i
		});
		expect(cancelButton).toBeEnabled();
	}, 20000);
});
