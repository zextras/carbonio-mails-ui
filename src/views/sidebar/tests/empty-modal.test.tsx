/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { faker } from '@faker-js/faker';
import { act, screen } from '@testing-library/react';

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { getFolder } from '../../../carbonio-ui-commons/store/zustand/folder/hooks';
import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../../carbonio-ui-commons/test/mocks/store/folders';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { Folder } from '../../../carbonio-ui-commons/types/folder';
import { generateStore } from '../../../tests/generators/store';
import { SoapFolderAction } from '../../../types';
import { EmptyModal } from '../empty-modal';

describe('empty-modal', () => {
	test('empty the folder except the trash folder', async () => {
		const closeModal = jest.fn();
		const store = generateStore();
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

		setupTest(<EmptyModal onClose={(): void => closeModal()} folder={folder} />, {
			store
		});

		expect(screen.getByText(/folder_panel\.modal\.wipe\.body\.message1/i)).toBeInTheDocument();
		expect(screen.getByText(/folder_panel\.modal\.wipe\.body\.message2/i)).toBeInTheDocument();

		const wipeButton = screen.getByRole('button', {
			name: /label\.wipe/i
		});

		expect(wipeButton).toBeEnabled();
	});

	test('empty the trash folder', async () => {
		const closeModal = jest.fn();
		const store = generateStore();
		const folder: Folder = {
			id: `dfer4567-hy0e-i984-kjh6-c842dfr5tgyh:${FOLDERS.TRASH}`,
			uuid: faker.string.uuid(),
			name: 'Trash',
			absFolderPath: '/Trash',
			l: FOLDERS.USER_ROOT,
			luuid: faker.string.uuid(),
			checked: false,
			rev: 1,
			ms: 28502,
			n: 16,
			s: 319017,
			i4ms: 33653,
			i4next: 17212,
			activesyncdisabled: false,
			webOfflineSyncDays: 30,
			recursive: false,
			deletable: false,
			isLink: false,
			children: [],
			parent: undefined,
			depth: 1
		};

		setupTest(<EmptyModal onClose={(): void => closeModal()} folder={folder} />, {
			store
		});

		expect(screen.getByText(/folder_panel\.modal\.empty\.body\.message1/i)).toBeInTheDocument();
		expect(screen.getByText(/folder_panel\.modal\.empty\.body\.message2/i)).toBeInTheDocument();

		const wipeButton = screen.getByRole('button', {
			name: /label\.empty/i
		});
		expect(wipeButton).toBeEnabled();
	});

	test('empty the trash folder of the shared account', async () => {
		const closeModal = jest.fn();
		const store = generateStore();
		const folder: Folder = {
			id: `dfer4567-hy0e-i984-kjh6-c842dfr5tgyh:${FOLDERS.TRASH}`,
			uuid: faker.string.uuid(),
			name: 'Trash',
			absFolderPath: '/Trash',
			l: FOLDERS.USER_ROOT,
			luuid: faker.string.uuid(),
			checked: false,
			rev: 1,
			ms: 28502,
			n: 16,
			s: 319017,
			i4ms: 33653,
			i4next: 17212,
			activesyncdisabled: false,
			webOfflineSyncDays: 30,
			recursive: false,
			deletable: false,
			isLink: false,
			children: [],
			parent: undefined,
			depth: 1
		};

		setupTest(<EmptyModal onClose={(): void => closeModal()} folder={folder} />, {
			store
		});

		expect(screen.getByText(/folder_panel\.modal\.empty\.body\.message1/i)).toBeInTheDocument();
		expect(screen.getByText(/folder_panel\.modal\.empty\.body\.message2/i)).toBeInTheDocument();

		const wipeButton = screen.getByRole('button', {
			name: /label\.empty/i
		});
		expect(wipeButton).toBeEnabled();
	});

	test('API is called with the proper parameters', async () => {
		const closeModal = jest.fn();
		const store = generateStore();
		populateFoldersStore();
		const folder = getFolder(FOLDERS.TRASH);
		if (!folder) {
			return;
		}

		const { user } = setupTest(<EmptyModal onClose={(): void => closeModal()} folder={folder} />, {
			store
		});

		const wipeButton = screen.getByRole('button', {
			name: /label\.empty/i
		});
		const wipeInterceptor = createSoapAPIInterceptor<{ action: SoapFolderAction }>('FolderAction');

		await act(() => user.click(wipeButton));

		const { action } = await wipeInterceptor;

		expect(action.id).toBe(FOLDERS.TRASH);
		expect(action.op).toBe('empty');
		expect(action.recursive).toBe(true);
	});
});
