/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, within } from '@testing-library/react';
import { FOLDERS, getFolder } from '@zextras/carbonio-ui-commons';
import type { Grant } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import { populateFoldersStore } from '@test-utils/store/folders';
import * as sendShareModule from 'api/send-share-notification-soap-api';
import * as shareFolderModule from 'api/share-folder-soap-api';
import { EditShareModal } from 'views/sidebar/edit-share-modal';

beforeEach(() => {
	vi.spyOn(shareFolderModule, 'shareFolderSoapApi').mockResolvedValue({} as never);
	vi.spyOn(sendShareModule, 'sendShareNotificationSoapApi').mockResolvedValue([]);
});

describe('EditShareModal', () => {
	const baseGrant: Grant = {
		zid: 'grantee-id',
		gt: 'usr',
		perm: 'r',
		d: 'grantee@example.com'
	};

	const editModeSetup = (
		grant: Grant = baseGrant
	): {
		user: ReturnType<typeof setupTest>['user'];
		folder: ReturnType<typeof getFolder>;
		grant: Grant;
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
			<EditShareModal
				folder={folder!}
				onClose={onClose}
				goBack={goBack}
				grant={grant}
				onSuccess={onSuccess}
			/>
		);
		return { user, folder, grant, onClose, goBack, onSuccess };
	};

	const changeRoleAndSubmit = async (user: ReturnType<typeof setupTest>['user']): Promise<void> => {
		const roleSelect = screen.getByTestId('share-role');
		await user.click(within(roleSelect).getByText(/share\.options\.share_calendar_role\.viewer/i));
		await user.click(
			within(screen.getByTestId('dropdown-popper-list')).getByText(
				/share\.options\.share_calendar_role\.admin/i
			)
		);
		await user.click(screen.getByRole('button', { name: /action\.edit_share/i }));
	};

	it('renders grantee info instead of contact input', () => {
		editModeSetup();
		expect(screen.getByText(/grantee@example\.com/i)).toBeInTheDocument();
		expect(
			screen.queryByRole('textbox', { name: /share\.recipients_address/i })
		).not.toBeInTheDocument();
	});

	it('shows the "Edit Share" confirm button', () => {
		editModeSetup();
		expect(screen.getByRole('button', { name: /action\.edit_share/i })).toBeInTheDocument();
	});

	it('disables the confirm button when the role has not changed', () => {
		editModeSetup();
		expect(screen.getByRole('button', { name: /action\.edit_share/i })).toBeDisabled();
	});

	it('enables the confirm button after changing the role', async () => {
		const { user } = editModeSetup();
		const roleSelect = screen.getByTestId('share-role');
		await user.click(within(roleSelect).getByText(/share\.options\.share_calendar_role\.viewer/i));
		await user.click(
			within(screen.getByTestId('dropdown-popper-list')).getByText(
				/share\.options\.share_calendar_role\.admin/i
			)
		);
		expect(screen.getByRole('button', { name: /action\.edit_share/i })).toBeEnabled();
	});

	it('calls shareFolderSoapApi with the grantee email when confirming', async () => {
		const { user, folder, grant } = editModeSetup();
		const roleSelect = screen.getByTestId('share-role');
		await user.click(within(roleSelect).getByText(/share\.options\.share_calendar_role\.viewer/i));
		await user.click(
			within(screen.getByTestId('dropdown-popper-list')).getByText(
				/share\.options\.share_calendar_role\.admin/i
			)
		);
		const shareFolderMock = vi.spyOn(shareFolderModule, 'shareFolderSoapApi');
		await user.click(screen.getByRole('button', { name: /action\.edit_share/i }));
		expect(shareFolderMock).toHaveBeenCalledWith(
			expect.objectContaining({
				contacts: [{ email: grant.d }],
				folder
			})
		);
	});

	describe('on successful edit', () => {
		it('shows a success snackbar', async () => {
			const { user } = editModeSetup();
			await changeRoleAndSubmit(user);
			expect(await screen.findByTestId('snackbar')).toBeInTheDocument();
		});

		it('calls goBack', async () => {
			const { user, goBack } = editModeSetup();
			await changeRoleAndSubmit(user);
			expect(goBack).toHaveBeenCalled();
		});

		it('calls onSuccess', async () => {
			const { user, onSuccess } = editModeSetup();
			await changeRoleAndSubmit(user);
			expect(onSuccess).toHaveBeenCalled();
		});
	});

	describe('notification behavior', () => {
		it('calls sendShareNotificationSoapApi when notification is checked', async () => {
			const { user } = editModeSetup();
			const sendNotificationMock = vi.spyOn(sendShareModule, 'sendShareNotificationSoapApi');
			// notification is checked by default
			await changeRoleAndSubmit(user);
			expect(sendNotificationMock).toHaveBeenCalled();
		});

		it('does not call sendShareNotificationSoapApi when notification is unchecked', async () => {
			const { user } = editModeSetup();
			const sendNotificationMock = vi.spyOn(sendShareModule, 'sendShareNotificationSoapApi');
			await user.click(
				within(screen.getByTestId('sendNotificationCheckboxContainer')).getByTestId(
					'icon: CheckmarkSquare'
				)
			);
			await changeRoleAndSubmit(user);
			expect(sendNotificationMock).not.toHaveBeenCalled();
		});

		it('does not call sendShareNotificationSoapApi when grant.d is absent even if notification is checked', async () => {
			const grantWithoutEmail: Grant = { zid: 'grantee-id', gt: 'usr', perm: 'r' };
			const { user } = editModeSetup(grantWithoutEmail);
			const sendNotificationMock = vi.spyOn(sendShareModule, 'sendShareNotificationSoapApi');
			// notification checkbox is checked by default; but grant.d is absent so it must be skipped
			await changeRoleAndSubmit(user);
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
			const { user } = editModeSetup();
			await changeRoleAndSubmit(user);
			expect(await screen.findByTestId('snackbar')).toBeInTheDocument();
		});

		it('calls goBack so the user is not stuck on the modal', async () => {
			const { user, goBack } = editModeSetup();
			await changeRoleAndSubmit(user);
			expect(goBack).toHaveBeenCalled();
		});

		it('does not call onClose', async () => {
			const { user, onClose } = editModeSetup();
			await changeRoleAndSubmit(user);
			expect(onClose).not.toHaveBeenCalled();
		});

		it('does not call onSuccess', async () => {
			const { user, onSuccess } = editModeSetup();
			await changeRoleAndSubmit(user);
			expect(onSuccess).not.toHaveBeenCalled();
		});

		it('does not call sendShareNotificationSoapApi', async () => {
			const { user } = editModeSetup();
			const sendNotificationMock = vi.spyOn(sendShareModule, 'sendShareNotificationSoapApi');
			await changeRoleAndSubmit(user);
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
			const { user } = editModeSetup();
			await changeRoleAndSubmit(user);
			expect(await screen.findByTestId('snackbar')).toBeInTheDocument();
		});

		it('still calls goBack after the notification failure', async () => {
			const { user, goBack } = editModeSetup();
			await changeRoleAndSubmit(user);
			expect(goBack).toHaveBeenCalled();
		});

		it('still calls onSuccess after the notification failure', async () => {
			const { user, onSuccess } = editModeSetup();
			await changeRoleAndSubmit(user);
			expect(onSuccess).toHaveBeenCalled();
		});
	});
});
