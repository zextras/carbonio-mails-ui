/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { faker } from '@faker-js/faker';
import { act, screen, within } from '@testing-library/react';
import { BatchResponse, ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { http } from 'msw';

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { ZIMBRA_STANDARD_COLORS } from '../../../carbonio-ui-commons/constants/utils';
import { getFolder } from '../../../carbonio-ui-commons/store/zustand/folder';
import { getSetupServer } from '../../../carbonio-ui-commons/test/jest-setup';
import { generateFolder } from '../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { handleGetFolderRequest } from '../../../carbonio-ui-commons/test/mocks/network/msw/handle-get-folder';
import { populateFoldersStore } from '../../../carbonio-ui-commons/test/mocks/store/folders';
import { buildSoapErrorResponseBody } from '../../../carbonio-ui-commons/test/mocks/utils/soap';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { Folder, FolderView } from '../../../carbonio-ui-commons/types/folder';
import { BatchRequest, SoapFolderAction } from '../../../types';
import { makeAllItemsVisible } from '../../settings/filters/tests/test-utils';
import { EditModal } from '../edit-modal';

const aFolderWithoutSharePermission = (folder: Partial<Folder> = {}): Folder => ({
	...generateFolder(folder),
	acl: undefined
});

describe('edit-modal', () => {
	test('edit the folder excepting the system folders', async () => {
		const closeModal = jest.fn();

		const folder: Folder = {
			id: '106',
			uuid: faker.string.uuid(),
			name: 'Confluence',
			absFolderPath: '/Inbox/Confluence',
			l: FOLDERS.INBOX,
			luuid: faker.string.uuid(),
			checked: false,
			f: 'u',
			u: 25,
			view: 'message' as FolderView,
			rev: 27896,
			ms: 27896,
			n: 101,
			s: 5550022,
			i4ms: 33607,
			i4next: 17183,
			activesyncdisabled: false,
			webOfflineSyncDays: 0,
			recursive: false,
			deletable: true,
			isLink: false,
			children: [],
			parent: undefined,
			depth: 2
		};

		const { user } = setupTest(
			<EditModal onClose={(): void => closeModal()} folder={folder} />,
			{}
		);

		const folderInputElement = screen.getByRole('textbox', { name: /folder name/i });
		expect(folderInputElement).toBeEnabled();

		const selectColor = screen.getByText(/select color/i);
		expect(selectColor).toBeInTheDocument();
		await act(async () => {
			await user.click(selectColor);
		});
		ZIMBRA_STANDARD_COLORS.forEach((el) => {
			within(screen.getByTestId('dropdown-popper-list')).getByText(el.zLabel);
		});
		const addShareButton = screen.getByRole('button', {
			name: /folder\.modal\.edit\.add_share/i
		});
		expect(addShareButton).toBeEnabled();

		const editButton = screen.getByRole('button', {
			name: /label\.edit/i
		});
		expect(editButton).toBeEnabled();
	});

	test('edit the system folder', async () => {
		const closeModal = jest.fn();

		const folder: Folder = {
			id: FOLDERS.INBOX,
			uuid: faker.string.uuid(),
			name: 'folders.inbox',
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
			isLink: false,
			children: [],
			parent: undefined,
			depth: 1
		};

		const { user } = setupTest(
			<EditModal onClose={(): void => closeModal()} folder={folder} />,
			{}
		);

		expect(screen.getByText(/folder name/i)).toBeInTheDocument();

		const selectColor = screen.getByText(/select color/i);
		expect(selectColor).toBeInTheDocument();
		await act(async () => {
			await user.click(selectColor);
		});
		ZIMBRA_STANDARD_COLORS.forEach((el) => {
			within(screen.getByTestId('dropdown-popper-list')).getByText(el.zLabel);
		});
		const addShareButton = screen.getByRole('button', {
			name: /folder\.modal\.edit\.add_share/i
		});
		expect(addShareButton).toBeEnabled();

		const editButton = screen.getByRole('button', {
			name: /label\.edit/i
		});
		expect(editButton).toBeEnabled();
	});

	test('edit the folder with default retention policy is collapse', async () => {
		const closeModal = jest.fn();

		const folder: Folder = {
			id: '106',
			uuid: faker.string.uuid(),
			name: 'Confluence',
			absFolderPath: '/Inbox/Confluence',
			l: FOLDERS.INBOX,
			luuid: faker.string.uuid(),
			checked: false,
			f: 'u',
			u: 25,
			view: 'message' as FolderView,
			rev: 27896,
			ms: 27896,
			n: 101,
			s: 5550022,
			i4ms: 33607,
			i4next: 17183,
			activesyncdisabled: false,
			webOfflineSyncDays: 0,
			recursive: false,
			deletable: true,
			isLink: false,
			children: [],
			parent: undefined,
			depth: 2
		};

		setupTest(<EditModal onClose={(): void => closeModal()} folder={folder} />, {});

		expect(screen.getByText(/folder name/i)).toBeInTheDocument();
		expect(screen.getByText(/folder name/i)).toBeEnabled();
		const retentionPolicy = within(screen.getByTestId('retention_policy-icon')).getByTestId(
			'icon: ChevronDownOutline'
		);
		expect(retentionPolicy).toBeInTheDocument();
	});

	test('Enable message retention and enable message disposal are uncheck by default', async () => {
		const closeModal = jest.fn();

		const folder: Folder = {
			id: '106',
			uuid: faker.string.uuid(),
			name: 'Confluence',
			absFolderPath: '/Inbox/Confluence',
			l: FOLDERS.INBOX,
			luuid: faker.string.uuid(),
			checked: false,
			f: 'u',
			u: 25,
			view: 'message' as FolderView,
			rev: 27896,
			ms: 27896,
			n: 101,
			s: 5550022,
			i4ms: 33607,
			i4next: 17183,
			activesyncdisabled: false,
			webOfflineSyncDays: 0,
			recursive: false,
			deletable: true,
			isLink: false,
			children: [],
			parent: undefined,
			depth: 2
		};

		setupTest(<EditModal onClose={(): void => closeModal()} folder={folder} />, {});

		expect(screen.getByText(/folder name/i)).toBeInTheDocument();
		expect(screen.getByText(/folder name/i)).toBeEnabled();
		const retentionPolicy = within(screen.getByTestId('retention_policy-icon')).getByTestId(
			'icon: ChevronDownOutline'
		);
		expect(retentionPolicy).toBeInTheDocument();

		const enableMsgDisposal = within(screen.getByTestId('enableMsgDisposal')).getByTestId(
			'icon: Square'
		);
		expect(enableMsgDisposal).toBeInTheDocument();
	});

	test('API is called with the proper parameters', async () => {
		const closeModal = jest.fn();

		populateFoldersStore();
		const folder = getFolder(FOLDERS.TRASH);
		if (!folder) {
			return;
		}

		const { user } = setupTest(
			<EditModal onClose={(): void => closeModal()} folder={folder} />,
			{}
		);

		const editButton = screen.getByRole('button', {
			name: /label\.edit/i
		});
		const wipeInterceptor = createSoapAPIInterceptor<{ action: SoapFolderAction }>('FolderAction');

		await act(async () => {
			await user.click(editButton);
		});
		const { action } = await wipeInterceptor;

		expect(action.id).toBe(FOLDERS.TRASH);
		expect(action.op).toBe('update');
		expect(action.color).toBe(folder?.color ?? 0);
		expect(action.name).toBe(folder.name);
	});

	test('edited folder name should be pass in parameter', async () => {
		const closeFn = jest.fn();

		const folder: Folder = {
			id: '106',
			uuid: faker.string.uuid(),
			name: 'Confluence',
			absFolderPath: '/Inbox/Confluence',
			l: FOLDERS.INBOX,
			luuid: faker.string.uuid(),
			checked: false,
			f: 'u',
			u: 25,
			view: 'message' as FolderView,
			rev: 27896,
			ms: 27896,
			n: 101,
			s: 5550022,
			i4ms: 33607,
			i4next: 17183,
			activesyncdisabled: false,
			webOfflineSyncDays: 0,
			recursive: false,
			deletable: true,
			isLink: false,
			children: [],
			parent: undefined,
			depth: 2
		};
		const { user } = setupTest(<EditModal onClose={closeFn} folder={folder} />, {});

		expect(screen.getByTestId('folder-name')).toBeInTheDocument();
		const newFolder = screen.getByTestId('folder-name');
		const folderInputElement = within(newFolder).getByRole('textbox');

		expect(folderInputElement).toBeInTheDocument();
		await user.clear(folderInputElement);

		const folderName = faker.lorem.word();
		await user.type(folderInputElement, folderName);

		expect(
			screen.getByRole('button', {
				name: /label\.edit/i
			})
		).toBeEnabled();

		const wipeInterceptor = createSoapAPIInterceptor<
			{ action: SoapFolderAction },
			ErrorSoapBodyResponse
		>('FolderAction', buildSoapErrorResponseBody());

		await user.click(
			screen.getByRole('button', {
				name: /label\.edit/i
			})
		);

		await screen.findByTestId('snackbar');
		const { action } = await wipeInterceptor;

		expect(action.id).toBe(folder.id);
		expect(action.op).toBe('update');
		expect(action.color).toBe(folder?.color ?? 0);
		expect(action.name).toBe(folderName);
	});

	test('folder name disable when edit system folder', async () => {
		const closeModal = jest.fn();

		const folder: Folder = {
			id: FOLDERS.INBOX,
			uuid: faker.string.uuid(),
			name: 'folders.inbox',
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
			isLink: false,
			children: [],
			parent: undefined,
			depth: 1
		};

		setupTest(<EditModal onClose={(): void => closeModal()} folder={folder} />, {});

		expect(screen.getByTestId('folder-name')).toBeInTheDocument();
		const newFolder = screen.getByTestId('folder-name');
		const folderInputElement = within(newFolder).getByRole('textbox');
		expect(newFolder).toBeInTheDocument();
		expect(folderInputElement).toBeDisabled();

		const editButton = screen.getByRole('button', {
			name: /label\.edit/i
		});
		expect(editButton).toBeEnabled();
	});

	describe('Shared folder', () => {
		it('should display "Sharing of this folder" panel acl is present', async () => {
			const acl = {
				grant: [
					{
						zid: '123',
						d: 'sharedTo@test.com',
						perm: 'r',
						gt: 'all' as const
					}
				]
			};
			createSoapAPIInterceptor('GetFolder', {
				folder: [
					{
						acl
					}
				]
			});
			const folder = {
				...generateFolder({ name: 'Test' }),
				acl
			};

			setupTest(<EditModal onClose={jest.fn()} folder={folder} />, {});

			expect(await screen.findByText('label.shares_folder_edit')).toBeVisible();
			expect(await screen.findByText('label.revoke')).toBeVisible();
			expect(await screen.findByText('label.resend')).toBeVisible();
			expect(
				await screen.findByText('sharedTo@test.com - share.options.share_calendar_role.viewer')
			).toBeVisible();
		});
	});

	describe('Folder name input', () => {
		it('should disable the submit button when folder name input is empty', async () => {
			const folder: Folder = aFolderWithoutSharePermission({ name: 'Test' });

			const { user } = setupTest(<EditModal onClose={jest.fn()} folder={folder} />, {});

			const newFolder = screen.getByTestId('folder-name');
			const folderInputElement = within(newFolder).getByRole('textbox');
			expect(folderInputElement).toHaveValue('Test');
			await user.clear(folderInputElement);
			expect(folderInputElement).toHaveValue('');

			const editButton = screen.getByRole('button', {
				name: /label\.edit/i
			});
			expect(editButton).toBeDisabled();
		});

		it('should enable the edit submit button when folder name input is not empty', async () => {
			const folder: Folder = aFolderWithoutSharePermission({ name: 'Test' });

			setupTest(<EditModal onClose={jest.fn()} folder={folder} />, {});

			const newFolder = screen.getByTestId('folder-name');
			const folderInputElement = within(newFolder).getByRole('textbox');
			expect(folderInputElement).toHaveValue('Test');

			const editButton = screen.getByRole('button', {
				name: /label\.edit/i
			});
			expect(editButton).toBeEnabled();
		});

		it('should display the "Cannot use a system folder name" error when folder name input is equal to a system folder', async () => {
			const folder: Folder = aFolderWithoutSharePermission({ name: 'Test' });

			const { user } = setupTest(<EditModal onClose={jest.fn()} folder={folder} />, {});

			const newFolder = screen.getByTestId('folder-name');
			const folderInputElement = within(newFolder).getByRole('textbox');
			expect(folderInputElement).toHaveValue('Test');
			await user.clear(folderInputElement);
			await user.type(folderInputElement, 'Inbox');

			expect(await screen.findByText('You cannot rename a folder as a system one')).toBeVisible();
		});

		it('should display the error message "Special characters not allowed" when folder name uses special chars', async () => {
			const folder: Folder = aFolderWithoutSharePermission({ name: 'Test' });

			const { user } = setupTest(
				<EditModal onClose={(): void => jest.fn()()} folder={folder} />,
				{}
			);

			expect(screen.getByTestId('folder-name')).toBeInTheDocument();
			const newFolder = screen.getByTestId('folder-name');
			const folderInputElement = within(newFolder).getByRole('textbox');
			expect(folderInputElement).toBeEnabled();
			expect(newFolder).toBeInTheDocument();

			// Insert the new folder name into the text input with system folder name
			await user.type(folderInputElement, '/something.with.dots/i');
			expect(
				await screen.findByText('Special characters not allowed. Max lenght is 128 characters.')
			).toBeVisible();

			const editButton = screen.getByRole('button', {
				name: /label\.edit/i
			});
			expect(editButton).toBeDisabled();
		});
	});

	describe('retention lifetime disposal ', () => {
		test('is displayed in years if divisible by 365, onConfirm should also pass the correct data', async () => {
			getSetupServer().use(http.post('/service/soap/GetFolderRequest', handleGetFolderRequest));
			const interceptor = createSoapAPIInterceptor<BatchRequest, BatchResponse>('Batch');
			const closeModal = jest.fn();
			const folder: Folder = {
				...aFolderWithoutSharePermission(),
				retentionPolicy: [
					{
						purge: [
							{
								policy: [{ lifetime: '730d' }]
							}
						]
					}
				]
			};
			const { user } = setupTest(<EditModal onClose={closeModal} folder={folder} />, {});

			makeAllItemsVisible();
			const input = screen.getByRole('textbox', { name: /disposal threshold/i });
			expect(input).toHaveValue('2');

			const unitDropdown = screen.getByText(/years/i);
			expect(unitDropdown).toBeInTheDocument();

			const confirmButton = screen.getByRole('button', { name: /label.edit/i });
			await user.click(confirmButton);
			await screen.findByTestId('snackbar');

			const request = await interceptor;
			expect(request.FolderActionRequest?.[1].action).toEqual({
				id: folder.id,
				op: 'retentionpolicy',
				retentionPolicy: {
					purge: {
						policy: {
							type: 'user',
							lifetime: '730d'
						}
					}
				}
			});
		});

		test('is displayed in months if divisible by 31, onConfirm should also pass the correct data', async () => {
			getSetupServer().use(http.post('/service/soap/GetFolderRequest', handleGetFolderRequest));
			const interceptor = createSoapAPIInterceptor<BatchRequest, BatchResponse>('Batch');
			const folder: Folder = {
				...aFolderWithoutSharePermission(),
				retentionPolicy: [
					{
						purge: [
							{
								policy: [{ lifetime: '62d' }]
							}
						]
					}
				]
			};
			const { user } = setupTest(<EditModal onClose={jest.fn()} folder={folder} />, {});
			makeAllItemsVisible();

			const input = screen.getByRole('textbox', { name: /disposal threshold/i });
			expect(input).toHaveValue('2');
			const unitDropdown = screen.getByText(/months/i);
			expect(unitDropdown).toBeInTheDocument();

			const confirmButton = screen.getByRole('button', { name: /label.edit/i });
			await user.click(confirmButton);

			await screen.findByTestId('snackbar');
			const request = await interceptor;
			expect(request.FolderActionRequest?.[1].action).toEqual({
				id: folder.id,
				op: 'retentionpolicy',
				retentionPolicy: {
					purge: {
						policy: {
							type: 'user',
							lifetime: '62d'
						}
					}
				}
			});
		});

		test('is displayed in weeks if divisible by 7, onConfirm should also pass the correct data', async () => {
			getSetupServer().use(http.post('/service/soap/GetFolderRequest', handleGetFolderRequest));
			const interceptor = createSoapAPIInterceptor<BatchRequest, BatchResponse>('Batch');
			const folder: Folder = {
				...aFolderWithoutSharePermission(),
				retentionPolicy: [
					{
						purge: [
							{
								policy: [{ lifetime: '14d' }]
							}
						]
					}
				]
			};
			const { user } = setupTest(<EditModal onClose={jest.fn()} folder={folder} />, {});
			makeAllItemsVisible();

			const input = screen.getByRole('textbox', { name: /disposal threshold/i });
			expect(input).toHaveValue('2');
			const unitDropdown = screen.getByText(/weeks/i);
			expect(unitDropdown).toBeInTheDocument();

			const confirmButton = screen.getByRole('button', { name: /label.edit/i });
			await user.click(confirmButton);
			await screen.findByTestId('snackbar');
			const request = await interceptor;
			expect(request.FolderActionRequest?.[1].action).toEqual({
				id: folder.id,
				op: 'retentionpolicy',
				retentionPolicy: {
					purge: {
						policy: {
							type: 'user',
							lifetime: '14d'
						}
					}
				}
			});
		});

		test('defaults to days if not divisible by 7, 31, or 365, onConfirm should also pass the correct data', async () => {
			getSetupServer().use(http.post('/service/soap/GetFolderRequest', handleGetFolderRequest));
			const interceptor = createSoapAPIInterceptor<BatchRequest, BatchResponse>('Batch');
			const folder: Folder = {
				...aFolderWithoutSharePermission(),
				retentionPolicy: [
					{
						purge: [
							{
								policy: [{ lifetime: '10d' }]
							}
						]
					}
				]
			};
			const { user } = setupTest(<EditModal onClose={jest.fn()} folder={folder} />, {});
			makeAllItemsVisible();

			const input = screen.getByRole('textbox', { name: /disposal threshold/i });
			expect(input).toHaveValue('10');
			const unitDropdown = screen.getByText(/days/i);
			expect(unitDropdown).toBeInTheDocument();

			const confirmButton = screen.getByRole('button', { name: /label.edit/i });
			await user.click(confirmButton);
			await screen.findByTestId('snackbar');
			const request = await interceptor;
			expect(request.FolderActionRequest?.[1].action).toEqual({
				id: folder.id,
				op: 'retentionpolicy',
				retentionPolicy: {
					purge: {
						policy: {
							type: 'user',
							lifetime: '10d'
						}
					}
				}
			});
		});
		test('changing the retention should send the updated values', async () => {
			getSetupServer().use(http.post('/service/soap/GetFolderRequest', handleGetFolderRequest));
			const interceptor = createSoapAPIInterceptor<BatchRequest, BatchResponse>('Batch');
			const folder: Folder = {
				...aFolderWithoutSharePermission(),
				retentionPolicy: [
					{
						purge: [
							{
								policy: [{ lifetime: '1d' }]
							}
						]
					}
				]
			};
			const { user } = setupTest(<EditModal onClose={jest.fn()} folder={folder} />, {});
			makeAllItemsVisible();

			const input = screen.getByRole('textbox', { name: /disposal threshold/i });
			await user.clear(input);
			await user.type(input, '2');
			const confirmButton = screen.getByRole('button', { name: /label.edit/i });
			await user.click(confirmButton);
			await screen.findByTestId('snackbar');
			const request = await interceptor;
			expect(request.FolderActionRequest?.[1].action).toEqual({
				id: folder.id,
				op: 'retentionpolicy',
				retentionPolicy: {
					purge: {
						policy: {
							type: 'user',
							lifetime: '2d'
						}
					}
				}
			});
		});
		test('should display an error message when the input is not a valid number', async () => {
			getSetupServer().use(http.post('/service/soap/GetFolderRequest', handleGetFolderRequest));
			const folder: Folder = {
				...aFolderWithoutSharePermission(),
				retentionPolicy: [
					{
						purge: [
							{
								policy: [{ lifetime: '1d' }]
							}
						]
					}
				]
			};
			const { user } = setupTest(<EditModal onClose={jest.fn()} folder={folder} />, {});
			makeAllItemsVisible();

			const input = screen.getByRole('textbox', { name: /disposal threshold/i });
			await user.clear(input);
			await user.type(input, 'a');
			const confirmButton = screen.getByRole('button', { name: /label.edit/i });
			await user.click(confirmButton);
			expect(
				await screen.findByText('The retention duration must be a positive number')
			).toBeVisible();
		});
	});
});
