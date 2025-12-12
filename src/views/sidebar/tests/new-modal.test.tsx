/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { faker } from '@faker-js/faker';
import { screen, within } from '@testing-library/react';
import { Folder, FOLDERS, SoapFolder } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateFoldersStore } from '@test-utils/store/folders';
import { NewModal } from 'views/sidebar/new-modal';

const NEW_FOLDER_NAME_TEST_ID = 'new-folder-name';

const createMockFolder = (): Folder => ({
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
});

describe('new-modal', () => {
	beforeEach(() => {
		populateFoldersStore();
	});

	test('add folder name and create button should be enabled', async () => {
		const closeFn = vi.fn();
		const folder = createMockFolder();
		const { user } = setupTest(<NewModal onClose={closeFn} folder={folder} />, {
			setupOptions: { delay: null }
		});

		const folderInputElement = within(screen.getByTestId(NEW_FOLDER_NAME_TEST_ID)).getByRole(
			'textbox'
		);
		const folderName = faker.lorem.word();

		await user.clear(folderInputElement);
		await user.type(folderInputElement, folderName);

		expect(screen.getByRole('button', { name: /label.create/i })).toBeEnabled();
	});

	test('create button should be disabled on blank folder name', async () => {
		const closeFn = vi.fn();
		const folder = createMockFolder();
		const { user } = setupTest(<NewModal onClose={closeFn} folder={folder} />, {
			setupOptions: { delay: null }
		});

		const folderInputElement = within(screen.getByTestId(NEW_FOLDER_NAME_TEST_ID)).getByRole(
			'textbox'
		);

		await user.clear(folderInputElement);

		expect(screen.getByRole('button', { name: /label.create/i })).toBeDisabled();
	});

	test('API is called with the proper parameters to create new folder', async () => {
		const closeFn = vi.fn();
		const folder = createMockFolder();
		const { user } = setupTest(<NewModal onClose={closeFn} folder={folder} />, {
			setupOptions: { delay: null }
		});

		const folderInputElement = within(screen.getByTestId(NEW_FOLDER_NAME_TEST_ID)).getByRole(
			'textbox'
		);
		const folderName = faker.lorem.word();

		const apiInterceptor = createSoapAPIInterceptor<{ folder: SoapFolder }>('CreateFolder');

		await user.clear(folderInputElement);
		await user.type(folderInputElement, folderName);
		await user.click(screen.getByRole('button', { name: /label.create/i }));

		const { folder: newFolder } = await apiInterceptor;
		expect(newFolder.view).toBe('message');
		expect(newFolder.l).toBe(folder.id);
		expect(newFolder.name).toBe(folderName);
	});

	test('Give error msg if creating with system folder name and create button should be disabled', async () => {
		const closeFn = vi.fn();
		const folder = createMockFolder();
		const { user } = setupTest(<NewModal onClose={closeFn} folder={folder} />, {
			setupOptions: { delay: null }
		});

		const folderInputElement = within(screen.getByTestId(NEW_FOLDER_NAME_TEST_ID)).getByRole(
			'textbox'
		);

		await user.clear(folderInputElement);
		await user.type(folderInputElement, 'Inbox');

		expect(screen.getByTestId('error-message')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /label.create/i })).toBeDisabled();
	});
});
