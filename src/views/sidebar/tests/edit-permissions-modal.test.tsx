/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { faker } from '@faker-js/faker';
import { act, screen, within } from '@testing-library/react';

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { getFolder } from '../../../carbonio-ui-commons/store/zustand/folder';
import { populateFoldersStore } from '../../../carbonio-ui-commons/test/mocks/store/folders';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import * as shareFolderModule from '../../../store/actions/share-folder';
import { generateStore } from '../../../tests/generators/store';
import EditPermissionsModal from '../edit-permissions-modal';

describe('edit-permissions-modal', () => {
	test('role field has 4 options, viewer role is set by default ', async () => {
		const closeFn = jest.fn();
		const goBack = jest.fn();
		const grant = [
			{
				zid: '1',
				gt: 'usr',
				perm: 'r'
			} as const
		];
		const store = generateStore();
		const folder = {
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
		const { user } = setupTest(
			<EditPermissionsModal
				folder={folder}
				onClose={closeFn}
				goBack={goBack}
				grant={grant}
				editMode={false}
			/>,
			{ store }
		);

		const roleLabel = screen.getByText(/share\.options\.share_calendar_role\.viewer/i);

		expect(roleLabel).toBeInTheDocument();

		await user.click(roleLabel);

		const viewerRoleOption = within(screen.getByTestId('dropdown-popper-list')).getByText(
			/share\.options\.share_calendar_role\.viewer/i
		);

		const noPermissionRoleOption = within(screen.getByTestId('dropdown-popper-list')).getByText(
			/share\.options\.share_calendar_role\.none/i
		);

		const adminRoleOption = within(screen.getByTestId('dropdown-popper-list')).getByText(
			/share\.options\.share_calendar_role\.admin/i
		);

		const managerRoleOption = within(screen.getByTestId('dropdown-popper-list')).getByText(
			/share\.options\.share_calendar_role\.manager/i
		);

		expect(noPermissionRoleOption).toBeInTheDocument();
		expect(viewerRoleOption).toBeInTheDocument();
		expect(adminRoleOption).toBeInTheDocument();
		expect(managerRoleOption).toBeInTheDocument();
	});
	test('message field empty and enable/disable as per send notification is unchecked and checked', async () => {
		const closeFn = jest.fn();
		const goBack = jest.fn();
		const grant = [
			{
				zid: '1',
				gt: 'usr',
				perm: 'r'
			} as const
		];
		const store = generateStore();
		const folder = {
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
		const { user } = setupTest(
			<EditPermissionsModal
				folder={folder}
				onClose={closeFn}
				goBack={goBack}
				grant={grant}
				editMode={false}
			/>,
			{ store }
		);

		const sendNotificationUnCheckbox = within(
			screen.getByTestId('sendNotificationCheckboxContainer')
		).getByTestId('icon: CheckmarkSquare');

		expect(sendNotificationUnCheckbox).toBeInTheDocument();

		const standardMessage = screen.getByRole('textbox', {
			name: /share\.standard_message/i
		});
		expect(standardMessage).toBeEnabled();

		await act(() => user.click(sendNotificationUnCheckbox));
		const sendNotificationCheckbox = within(
			screen.getByTestId('sendNotificationCheckboxContainer')
		).getByTestId('icon: Square');
		expect(sendNotificationCheckbox).toBeInTheDocument();

		expect(standardMessage).toBeDisabled();
		expect(standardMessage).toHaveValue('');
	});
	test.todo('when chips inside chipInput have errors, the confirm button is disabled');
	test('when at least a chip is inserted without errors, the confirm button is enabled', async () => {
		const closeFn = jest.fn();
		const goBack = jest.fn();
		const grant = [
			{
				zid: '1',
				gt: 'usr',
				perm: 'r'
			} as const
		];
		const store = generateStore();
		const folder = {
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
		const { user } = setupTest(
			<EditPermissionsModal
				folder={folder}
				onClose={closeFn}
				goBack={goBack}
				grant={grant}
				editMode={false}
			/>,
			{ store }
		);
		const chipInput = screen.getByRole('textbox', {
			name: /share\.recipients_address/i
		});
		const confirmButton = screen.getByRole('button', {
			name: /action\.share_folder/i
		});
		if (chipInput) {
			await user.type(chipInput, 'ale@test.com');
			await user.tab();
		}
		expect(screen.getByText('ale@test.com')).toBeInTheDocument();
		expect(confirmButton).toBeEnabled();
	});

	describe('API is called with the proper parameters to share the folder', () => {
		test('Share the inbox folder with a user giving the viewer role', async () => {
			const folderId = FOLDERS.INBOX;
			const closeFn = jest.fn();
			const goBack = jest.fn();
			const store = generateStore();
			populateFoldersStore();
			const folder = getFolder(folderId);
			const { user } = setupTest(
				<EditPermissionsModal
					folder={folder}
					onClose={closeFn}
					goBack={goBack}
					grant={{}}
					editMode={false}
				/>,
				{ store }
			);
			const userInput = screen.getByRole('textbox', {
				name: /share\.recipients_address/i
			});
			const confirmButton = screen.getByRole('button', {
				name: /action\.share_folder/i
			});

			const viewer = faker.internet.email();

			// Select viewer role
			const roleSelector = screen.getByTestId('share-role');
			await user.click(roleSelector);
			const roleItem = within(roleSelector).getByText('share.options.share_calendar_role.viewer');
			await user.click(roleItem);
			await user.type(userInput, viewer);
			await user.tab();

			const shareFolderMock = jest.spyOn(shareFolderModule, 'shareFolder');
			await user.click(confirmButton);

			// Check that the shareFolder and the data passed
			expect(shareFolderMock).toBeCalled();
			expect(shareFolderMock).toHaveBeenCalledWith(
				expect.objectContaining({ shareWithUserRole: 'r' })
			);
			expect(shareFolderMock).toHaveBeenCalledWith(expect.objectContaining({ folder }));
		});
		test('Share the inbox folder with a user giving the admin role', async () => {
			const folderId = FOLDERS.INBOX;
			const closeFn = jest.fn();
			const goBack = jest.fn();

			const store = generateStore();
			populateFoldersStore();
			const folder = getFolder(folderId);
			const { user } = setupTest(
				<EditPermissionsModal
					folder={folder}
					onClose={closeFn}
					goBack={goBack}
					grant={{}}
					editMode={false}
				/>,
				{ store }
			);
			const userInput = screen.getByRole('textbox', {
				name: /share\.recipients_address/i
			});
			const confirmButton = screen.getByRole('button', {
				name: /action\.share_folder/i
			});

			const viewer = faker.internet.email();

			// Select admin role
			const roleLabel = screen.getByText(/share\.options\.share_calendar_role\.viewer/i);
			expect(roleLabel).toBeInTheDocument();
			await user.click(roleLabel);

			const adminRoleOption = within(screen.getByTestId('dropdown-popper-list')).getByText(
				/share\.options\.share_calendar_role\.admin/i
			);
			// const roleItem = within(roleSelector).getByText('share.options.share_calendar_role.admin');
			await user.click(adminRoleOption);
			await user.type(userInput, viewer);
			await user.tab();

			const shareFolderMock = jest.spyOn(shareFolderModule, 'shareFolder');
			await user.click(confirmButton);

			// Check that the shareFolder and the data passed
			expect(shareFolderMock).toBeCalled();
			expect(shareFolderMock).toHaveBeenCalledWith(
				expect.objectContaining({ shareWithUserRole: 'rwidxa' })
			);
			expect(shareFolderMock).toHaveBeenCalledWith(expect.objectContaining({ folder }));
		});
		test('Share the inbox folder with a user giving the manager role', async () => {
			const folderId = FOLDERS.INBOX;
			const closeFn = jest.fn();
			const goBack = jest.fn();

			const store = generateStore();
			populateFoldersStore();
			const folder = getFolder(folderId);
			const { user } = setupTest(
				<EditPermissionsModal
					folder={folder}
					onClose={closeFn}
					goBack={goBack}
					grant={{}}
					editMode={false}
				/>,
				{ store }
			);
			const userInput = screen.getByRole('textbox', {
				name: /share\.recipients_address/i
			});
			const confirmButton = screen.getByRole('button', {
				name: /action\.share_folder/i
			});

			const viewer = faker.internet.email();

			// Select manager role from role select
			const roleLabel = screen.getByText(/share\.options\.share_calendar_role\.viewer/i);
			expect(roleLabel).toBeInTheDocument();
			await user.click(roleLabel);

			const managerRoleOption = within(screen.getByTestId('dropdown-popper-list')).getByText(
				/share\.options\.share_calendar_role\.manager/i
			);
			await user.click(managerRoleOption);
			await user.type(userInput, viewer);
			await user.tab();

			const shareFolderMock = jest.spyOn(shareFolderModule, 'shareFolder');
			await user.click(confirmButton);

			// Check that the shareFolder and the data passed
			expect(shareFolderMock).toBeCalled();
			expect(shareFolderMock).toHaveBeenCalledWith(
				expect.objectContaining({ shareWithUserRole: 'rwidx' })
			);

			expect(shareFolderMock).toHaveBeenCalledWith(expect.objectContaining({ folder }));
		});
		test('Share the inbox folder with a user giving the manager role and note to the standard message', async () => {
			const folderId = FOLDERS.INBOX;
			const closeFn = jest.fn();
			const goBack = jest.fn();

			const store = generateStore();
			populateFoldersStore();
			const folder = getFolder(folderId);
			const { user } = setupTest(
				<EditPermissionsModal
					folder={folder}
					onClose={closeFn}
					goBack={goBack}
					grant={{}}
					editMode={false}
				/>,
				{ store }
			);
			const userInput = screen.getByRole('textbox', {
				name: /share\.recipients_address/i
			});
			const confirmButton = screen.getByRole('button', {
				name: /action\.share_folder/i
			});

			const viewer = faker.internet.email();
			const note = faker.lorem.sentences(2);

			// Select manager role from role select
			const roleLabel = screen.getByText(/share\.options\.share_calendar_role\.viewer/i);
			expect(roleLabel).toBeInTheDocument();
			await user.click(roleLabel);

			const managerRoleOption = within(screen.getByTestId('dropdown-popper-list')).getByText(
				/share\.options\.share_calendar_role\.manager/i
			);
			await user.click(managerRoleOption);
			await user.type(userInput, viewer);
			await user.tab();

			const sendNotificationUnCheckbox = within(
				screen.getByTestId('sendNotificationCheckboxContainer')
			).getByTestId('icon: CheckmarkSquare');

			expect(sendNotificationUnCheckbox).toBeInTheDocument();

			const standardMessage = screen.getByRole('textbox', {
				name: /share\.standard_message/i
			});
			expect(standardMessage).toBeEnabled();
			await user.click(standardMessage);
			await user.type(standardMessage, note);

			const shareFolderMock = jest.spyOn(shareFolderModule, 'shareFolder');
			await user.click(confirmButton);

			// Check that the shareFolder and the data passed
			expect(shareFolderMock).toBeCalled();
			expect(shareFolderMock).toHaveBeenCalledWith(
				expect.objectContaining({ shareWithUserRole: 'rwidx' })
			);
			expect(shareFolderMock).toHaveBeenCalledWith(expect.objectContaining({ folder }));
		});
		test('Share the inbox folder with a user giving the manager role and without send notification message', async () => {
			const folderId = FOLDERS.INBOX;
			const closeFn = jest.fn();
			const goBack = jest.fn();

			const store = generateStore();
			populateFoldersStore();
			const folder = act(() => {
				getFolder(folderId);
			});
			const { user } = setupTest(
				<EditPermissionsModal
					folder={folder}
					onClose={closeFn}
					goBack={goBack}
					grant={{}}
					editMode={false}
				/>,
				{ store }
			);
			const userInput = screen.getByRole('textbox', {
				name: /share\.recipients_address/i
			});
			const confirmButton = screen.getByRole('button', {
				name: /action\.share_folder/i
			});

			const viewer = faker.internet.email();

			// Select manager role from role select
			const roleLabel = screen.getByText(/share\.options\.share_calendar_role\.viewer/i);
			expect(roleLabel).toBeInTheDocument();
			await user.click(roleLabel);

			const managerRoleOption = within(screen.getByTestId('dropdown-popper-list')).getByText(
				/share\.options\.share_calendar_role\.manager/i
			);
			await user.click(managerRoleOption);
			await user.type(userInput, viewer);
			await user.tab();
			const sendNotificationUnCheckbox = within(
				screen.getByTestId('sendNotificationCheckboxContainer')
			).getByTestId('icon: CheckmarkSquare');

			expect(sendNotificationUnCheckbox).toBeInTheDocument();

			const standardMessage = screen.getByRole('textbox', {
				name: /share\.standard_message/i
			});
			expect(standardMessage).toBeEnabled();

			await act(() => user.click(sendNotificationUnCheckbox));
			const sendNotificationCheckbox = within(
				screen.getByTestId('sendNotificationCheckboxContainer')
			).getByTestId('icon: Square');
			expect(sendNotificationCheckbox).toBeInTheDocument();

			expect(standardMessage).toBeDisabled();

			const shareFolderMock = jest.spyOn(shareFolderModule, 'shareFolder');
			await user.click(confirmButton);

			// Check that the shareFolder and the data passed
			expect(shareFolderMock).toBeCalled();
			expect(shareFolderMock).toHaveBeenCalledWith(
				expect.objectContaining({ shareWithUserRole: 'rwidx' })
			);
			expect(shareFolderMock).toHaveBeenCalledWith(expect.objectContaining({ folder }));
		});
	});
});
