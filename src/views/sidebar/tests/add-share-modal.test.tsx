/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { faker } from '@faker-js/faker';
import { screen, within } from '@testing-library/react';
import { FOLDERS, getFolder } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import { populateFoldersStore } from '@test-utils/store/folders';
import * as sendShareModule from 'api/send-share-notification-soap-api';
import * as shareFolderModule from 'api/share-folder-soap-api';
import { AddShareModal } from 'views/sidebar/add-share-modal';

beforeEach(() => {
	vi.spyOn(shareFolderModule, 'shareFolderSoapApi').mockResolvedValue({} as never);
	vi.spyOn(sendShareModule, 'sendShareNotificationSoapApi').mockResolvedValue([]);
});

describe('AddShareModal', () => {
	const defaultSetup = (): {
		user: ReturnType<typeof setupTest>['user'];
		folder: ReturnType<typeof getFolder>;
		onClose: ReturnType<typeof vi.fn>;
		goBack: ReturnType<typeof vi.fn>;
		onSuccess: ReturnType<typeof vi.fn>;
	} => {
		populateFoldersStore();
		const folder = getFolder(FOLDERS.INBOX);
		const onClose = vi.fn();
		const goBack = vi.fn();
		const onSuccess = vi.fn();
		const { user } = setupTest(
			<AddShareModal folder={folder!} onClose={onClose} goBack={goBack} onSuccess={onSuccess} />
		);
		return { user, folder, onClose, goBack, onSuccess };
	};

	const typeRecipientAndSubmit = async (
		user: ReturnType<typeof setupTest>['user'],
		email = faker.internet.email()
	): Promise<void> => {
		const chipInput = screen.getByRole('textbox', { name: /share\.recipients_address/i });
		await user.type(chipInput, email);
		await user.tab();
		await user.click(screen.getByRole('button', { name: /action\.share_folder/i }));
	};

	it('renders the contact input for new recipient', () => {
		defaultSetup();
		expect(screen.getByRole('textbox', { name: /share\.recipients_address/i })).toBeInTheDocument();
	});

	it('disables the confirm button when no recipient is entered', () => {
		defaultSetup();
		expect(screen.getByRole('button', { name: /action\.share_folder/i })).toBeDisabled();
	});

	it('role field has 4 options, viewer role is set by default', async () => {
		const { user } = defaultSetup();

		const roleLabel = screen.getByText(/share\.options\.share_calendar_role\.viewer/i);
		expect(roleLabel).toBeInTheDocument();

		await user.click(roleLabel);

		const dropdown = await screen.findByTestId('dropdown-popper-list');
		expect(
			within(dropdown).getByText(/share\.options\.share_calendar_role\.viewer/i)
		).toBeInTheDocument();
		expect(
			within(dropdown).getByText(/share\.options\.share_calendar_role\.none/i)
		).toBeInTheDocument();
		expect(
			within(dropdown).getByText(/share\.options\.share_calendar_role\.admin/i)
		).toBeInTheDocument();
		expect(
			within(dropdown).getByText(/share\.options\.share_calendar_role\.manager/i)
		).toBeInTheDocument();
	});

	it('message input is enabled by default and disables when notification is unchecked', async () => {
		const { user } = defaultSetup();

		const sendNotificationCheckbox = within(
			screen.getByTestId('sendNotificationCheckboxContainer')
		).getByTestId('icon: CheckmarkSquare');
		expect(sendNotificationCheckbox).toBeInTheDocument();

		const standardMessage = screen.getByRole('textbox', { name: /share\.standard_message/i });
		expect(standardMessage).toBeEnabled();

		await user.click(sendNotificationCheckbox);
		expect(
			within(screen.getByTestId('sendNotificationCheckboxContainer')).getByTestId('icon: Square')
		).toBeInTheDocument();
		expect(standardMessage).toBeDisabled();
		expect(standardMessage).toHaveValue('');
	});

	it('enables the confirm button when at least one chip is inserted without errors', async () => {
		const { user } = defaultSetup();
		const chipInput = screen.getByRole('textbox', { name: /share\.recipients_address/i });
		await user.type(chipInput, 'ale@test.com');
		await user.tab();
		expect(screen.getByText('ale@test.com')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /action\.share_folder/i })).toBeEnabled();
	});

	describe('API called with correct parameters', () => {
		it('calls shareFolderSoapApi with all entered recipients when multiple addresses are added', async () => {
			const { user, folder } = defaultSetup();
			const email1 = faker.internet.email();
			const email2 = faker.internet.email();
			const chipInput = screen.getByRole('textbox', { name: /share\.recipients_address/i });

			await user.type(chipInput, email1);
			await user.tab();
			await user.type(chipInput, email2);
			await user.tab();

			const shareFolderMock = vi.spyOn(shareFolderModule, 'shareFolderSoapApi');
			await user.click(screen.getByRole('button', { name: /action\.share_folder/i }));

			expect(shareFolderMock).toHaveBeenCalledWith(
				expect.objectContaining({
					contacts: expect.arrayContaining([{ email: email1 }, { email: email2 }]),
					folder
				})
			);
			expect(shareFolderMock.mock.calls[0][0].contacts).toHaveLength(2);
		});

		it('calls shareFolderSoapApi with viewer role', async () => {
			const { user, folder } = defaultSetup();
			const viewer = faker.internet.email();
			const userInput = screen.getByRole('textbox', { name: /share\.recipients_address/i });

			await user.type(userInput, viewer);
			await user.tab();

			const shareFolderMock = vi.spyOn(shareFolderModule, 'shareFolderSoapApi');
			await user.click(screen.getByRole('button', { name: /action\.share_folder/i }));

			expect(shareFolderMock).toHaveBeenCalledWith(
				expect.objectContaining({ shareWithUserRole: 'r', folder })
			);
		});

		it('calls shareFolderSoapApi with admin role', async () => {
			const { user, folder } = defaultSetup();
			const viewer = faker.internet.email();
			const userInput = screen.getByRole('textbox', { name: /share\.recipients_address/i });

			const roleLabel = screen.getByText(/share\.options\.share_calendar_role\.viewer/i);
			await user.click(roleLabel);
			await user.click(
				within(screen.getByTestId('dropdown-popper-list')).getByText(
					/share\.options\.share_calendar_role\.admin/i
				)
			);

			await user.type(userInput, viewer);
			await user.tab();

			const shareFolderMock = vi.spyOn(shareFolderModule, 'shareFolderSoapApi');
			await user.click(screen.getByRole('button', { name: /action\.share_folder/i }));

			expect(shareFolderMock).toHaveBeenCalledWith(
				expect.objectContaining({ shareWithUserRole: 'rwidxa', folder })
			);
		});

		it('calls shareFolderSoapApi with manager role', async () => {
			const { user, folder } = defaultSetup();
			const viewer = faker.internet.email();
			const userInput = screen.getByRole('textbox', { name: /share\.recipients_address/i });

			await user.click(screen.getByText(/share\.options\.share_calendar_role\.viewer/i));
			await user.click(
				within(screen.getByTestId('dropdown-popper-list')).getByText(
					/share\.options\.share_calendar_role\.manager/i
				)
			);

			await user.type(userInput, viewer);
			await user.tab();

			const shareFolderMock = vi.spyOn(shareFolderModule, 'shareFolderSoapApi');
			await user.click(screen.getByRole('button', { name: /action\.share_folder/i }));

			expect(shareFolderMock).toHaveBeenCalledWith(
				expect.objectContaining({ shareWithUserRole: 'rwidx', folder })
			);
		});
	});

	describe('on successful share', () => {
		it('shows a success snackbar', async () => {
			const { user } = defaultSetup();
			await typeRecipientAndSubmit(user);
			expect(await screen.findByTestId('snackbar')).toBeInTheDocument();
		});

		it('calls goBack', async () => {
			const { user, goBack } = defaultSetup();
			await typeRecipientAndSubmit(user);
			expect(goBack).toHaveBeenCalled();
		});

		it('calls onSuccess', async () => {
			const { user, onSuccess } = defaultSetup();
			await typeRecipientAndSubmit(user);
			expect(onSuccess).toHaveBeenCalled();
		});
	});

	describe('notification behavior', () => {
		it('calls sendShareNotificationSoapApi when notification is checked', async () => {
			const { user } = defaultSetup();
			const sendNotificationMock = vi.spyOn(sendShareModule, 'sendShareNotificationSoapApi');
			// notification checkbox is checked by default
			await typeRecipientAndSubmit(user);
			expect(sendNotificationMock).toHaveBeenCalled();
		});

		it('does not call sendShareNotificationSoapApi when notification is unchecked', async () => {
			const { user } = defaultSetup();
			const sendNotificationMock = vi.spyOn(sendShareModule, 'sendShareNotificationSoapApi');
			await user.click(
				within(screen.getByTestId('sendNotificationCheckboxContainer')).getByTestId(
					'icon: CheckmarkSquare'
				)
			);
			await typeRecipientAndSubmit(user);
			expect(sendNotificationMock).not.toHaveBeenCalled();
		});
	});

	describe('on API failure', () => {
		beforeEach(() => {
			vi.spyOn(shareFolderModule, 'shareFolderSoapApi').mockResolvedValue({
				Fault: {}
			} as never);
		});

		it('shows an error snackbar', async () => {
			const { user } = defaultSetup();
			await typeRecipientAndSubmit(user);
			expect(await screen.findByTestId('snackbar')).toBeInTheDocument();
		});

		it('calls goBack so the user is not stuck on the modal', async () => {
			const { user, goBack } = defaultSetup();
			await typeRecipientAndSubmit(user);
			expect(goBack).toHaveBeenCalled();
		});

		it('does not call onClose', async () => {
			const { user, onClose } = defaultSetup();
			await typeRecipientAndSubmit(user);
			expect(onClose).not.toHaveBeenCalled();
		});

		it('does not call onSuccess', async () => {
			const { user, onSuccess } = defaultSetup();
			await typeRecipientAndSubmit(user);
			expect(onSuccess).not.toHaveBeenCalled();
		});

		it('does not call sendShareNotificationSoapApi', async () => {
			const { user } = defaultSetup();
			const sendNotificationMock = vi.spyOn(sendShareModule, 'sendShareNotificationSoapApi');
			await typeRecipientAndSubmit(user);
			expect(sendNotificationMock).not.toHaveBeenCalled();
		});
	});

	describe('when notification sending fails', () => {
		beforeEach(() => {
			vi.spyOn(sendShareModule, 'sendShareNotificationSoapApi').mockRejectedValue(
				new Error('network error')
			);
		});

		it('shows a warning snackbar', async () => {
			const { user } = defaultSetup();
			await typeRecipientAndSubmit(user);
			expect(await screen.findByTestId('snackbar')).toBeInTheDocument();
		});

		it('still calls goBack after the notification failure', async () => {
			const { user, goBack } = defaultSetup();
			await typeRecipientAndSubmit(user);
			expect(goBack).toHaveBeenCalled();
		});

		it('still calls onSuccess after the notification failure', async () => {
			const { user, onSuccess } = defaultSetup();
			await typeRecipientAndSubmit(user);
			expect(onSuccess).toHaveBeenCalled();
		});
	});
});
