/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { faker } from '@faker-js/faker';
import { screen, within } from '@testing-library/react';
import { FOLDERS, getFolder } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateFoldersStore } from '@test-utils/store/folders';
import * as shareFolderModule from 'api/share-folder-soap-api';
import EditPermissionsModal from 'views/sidebar/edit-permissions-modal';

beforeAll(() => {
	createSoapAPIInterceptor('Batch');
	createSoapAPIInterceptor('SendShareNotification');
});

const defaultSetup = (): {
	user: ReturnType<typeof setupTest>['user'];
	folder: ReturnType<typeof getFolder>;
} => {
	const folderId = FOLDERS.INBOX;
	const grant = {
		zid: '1',
		gt: 'usr',
		perm: 'r'
	} as const;
	populateFoldersStore();
	const folder = getFolder(folderId);
	const { user } = setupTest(
		<EditPermissionsModal
			folder={folder!}
			onClose={vi.fn()}
			goBack={vi.fn()}
			grant={grant}
			editMode={false}
		/>
	);

	return { user, folder };
};

describe('edit-permissions-modal', () => {
	test('role field has 4 options, viewer role is set by default ', async () => {
		const { user } = defaultSetup();

		const roleLabel = screen.getByText(/share\.options\.share_calendar_role\.viewer/i);

		expect(roleLabel).toBeInTheDocument();

		await user.click(roleLabel);

		const viewerRoleOption = within(await screen.findByTestId('dropdown-popper-list')).getByText(
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
		const { user } = defaultSetup();

		const sendNotificationUnCheckbox = within(
			screen.getByTestId('sendNotificationCheckboxContainer')
		).getByTestId('icon: CheckmarkSquare');

		expect(sendNotificationUnCheckbox).toBeInTheDocument();

		const standardMessage = screen.getByRole('textbox', {
			name: /share\.standard_message/i
		});
		expect(standardMessage).toBeEnabled();

		await user.click(sendNotificationUnCheckbox);
		const sendNotificationCheckbox = within(
			screen.getByTestId('sendNotificationCheckboxContainer')
		).getByTestId('icon: Square');
		expect(sendNotificationCheckbox).toBeInTheDocument();

		expect(standardMessage).toBeDisabled();
		expect(standardMessage).toHaveValue('');
	});
	test.todo('when chips inside chipInput have errors, the confirm button is disabled');
	test('when at least a chip is inserted without errors, the confirm button is enabled', async () => {
		const { user } = defaultSetup();

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
			const { user, folder } = defaultSetup();

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

			await user.type(userInput, viewer);
			await user.tab();
			await user.click(roleItem);

			const shareFolderMock = vi.spyOn(shareFolderModule, 'shareFolderSoapApi');

			await user.click(confirmButton);

			// Check that the shareFolder and the data passed
			expect(shareFolderMock).toHaveBeenCalled();
			expect(shareFolderMock).toHaveBeenCalledWith(
				expect.objectContaining({ shareWithUserRole: 'r' })
			);
			expect(shareFolderMock).toHaveBeenCalledWith(expect.objectContaining({ folder }));
		});
		test('Share the inbox folder with a user giving the admin role', async () => {
			const { user, folder } = defaultSetup();

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

			await user.click(adminRoleOption);
			await user.type(userInput, viewer);
			await user.tab();

			const shareFolderMock = vi.spyOn(shareFolderModule, 'shareFolderSoapApi');
			await user.click(confirmButton);

			// Check that the shareFolder and the data passed
			expect(shareFolderMock).toHaveBeenCalled();
			expect(shareFolderMock).toHaveBeenCalledWith(
				expect.objectContaining({ shareWithUserRole: 'rwidxa' })
			);
			expect(shareFolderMock).toHaveBeenCalledWith(expect.objectContaining({ folder }));
		});
		test('Share the inbox folder with a user giving the manager role', async () => {
			const { user, folder } = defaultSetup();

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

			const shareFolderMock = vi.spyOn(shareFolderModule, 'shareFolderSoapApi');

			await user.click(confirmButton);

			// Check that the shareFolder and the data passed
			expect(shareFolderMock).toHaveBeenCalled();
			expect(shareFolderMock).toHaveBeenCalledWith(
				expect.objectContaining({ shareWithUserRole: 'rwidx' })
			);

			expect(shareFolderMock).toHaveBeenCalledWith(expect.objectContaining({ folder }));
		});
		test('Share the inbox folder with a user giving the manager role and note to the standard message', async () => {
			const { user, folder } = defaultSetup();

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

			const allButLast = viewer.slice(0, -1);
			const lastChar = viewer.slice(-1);

			await user.click(managerRoleOption);

			await user.pasteInto(userInput, allButLast);
			await user.type(userInput, lastChar);

			const sendNotificationUnCheckbox = within(
				screen.getByTestId('sendNotificationCheckboxContainer')
			).getByTestId('icon: CheckmarkSquare');

			expect(sendNotificationUnCheckbox).toBeInTheDocument();

			const standardMessage = screen.getByRole('textbox', {
				name: /share\.standard_message/i
			});
			expect(standardMessage).toBeEnabled();

			await user.click(standardMessage);
			await user.pasteInto(standardMessage, note);

			const shareFolderMock = vi.spyOn(shareFolderModule, 'shareFolderSoapApi');
			await user.click(confirmButton);
			// Check that the shareFolder and the data passed
			expect(shareFolderMock).toHaveBeenCalledWith(
				expect.objectContaining({ shareWithUserRole: 'rwidx' })
			);
			expect(shareFolderMock).toHaveBeenCalledWith(expect.objectContaining({ folder }));
		});
		test('Share the inbox folder with a user giving the manager role and without send notification message', async () => {
			const { user, folder } = defaultSetup();

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

			const allButLast = viewer.slice(0, -1);
			const lastChar = viewer.slice(-1);

			await user.click(managerRoleOption);

			await user.pasteInto(userInput, allButLast);
			await user.type(userInput, lastChar);

			const sendNotificationUnCheckbox = within(
				screen.getByTestId('sendNotificationCheckboxContainer')
			).getByTestId('icon: CheckmarkSquare');

			expect(sendNotificationUnCheckbox).toBeInTheDocument();

			const standardMessage = screen.getByRole('textbox', {
				name: /share\.standard_message/i
			});
			expect(standardMessage).toBeEnabled();

			await user.click(sendNotificationUnCheckbox);
			const sendNotificationCheckbox = within(
				screen.getByTestId('sendNotificationCheckboxContainer')
			).getByTestId('icon: Square');
			expect(sendNotificationCheckbox).toBeInTheDocument();

			expect(standardMessage).toBeDisabled();

			const shareFolderMock = vi.spyOn(shareFolderModule, 'shareFolderSoapApi');
			await user.click(confirmButton);

			// Check that the shareFolder and the data passed
			expect(shareFolderMock).toHaveBeenCalledWith(
				expect.objectContaining({ shareWithUserRole: 'rwidx' })
			);
			expect(shareFolderMock).toHaveBeenCalledWith(expect.objectContaining({ folder }));
		});
	});
});
