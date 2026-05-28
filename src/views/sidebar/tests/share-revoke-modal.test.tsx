/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import type { Grant } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import { generateFolder } from '@test-utils/folders/folders-generator';
import * as folderActionModule from 'api/folder-action-soap-api';
import * as sendShareModule from 'api/send-share-notification-soap-api';
import { ShareRevokeModal } from 'views/sidebar/parts/edit/share-revoke-modal';

const baseGrant: Grant = {
	zid: 'grantee-zid',
	gt: 'usr',
	perm: 'r',
	d: 'grantee@example.com'
};

const defaultSetup = (
	onSuccess?: () => void,
	grant: Grant = baseGrant
): {
	user: ReturnType<typeof setupTest>['user'];
	goBack: ReturnType<typeof vi.fn>;
} => {
	const folder = generateFolder();
	const goBack = vi.fn();
	const { user } = setupTest(
		<ShareRevokeModal folder={folder} grant={grant} goBack={goBack} onSuccess={onSuccess} />,
		{}
	);
	return { user, goBack };
};

describe('ShareRevokeModal', () => {
	beforeEach(() => {
		vi.spyOn(folderActionModule, 'folderActionSoapApi').mockResolvedValue({} as never);
		vi.spyOn(sendShareModule, 'sendShareNotificationSoapApi').mockResolvedValue([]);
	});

	describe('initial rendering', () => {
		it('renders the grantee email and role in the chip', () => {
			defaultSetup();
			expect(
				screen.getByText(/grantee@example\.com - share\.options\.share_calendar_role\.viewer/i)
			).toBeInTheDocument();
		});

		it('send notification checkbox is unchecked by default', () => {
			defaultSetup();
			expect(screen.getByTestId('icon: Square')).toBeInTheDocument();
		});

		it('message input is disabled when notification is unchecked', () => {
			defaultSetup();
			const input = screen.getByRole('textbox', { name: /share\.standard_message/i });
			expect(input).toBeDisabled();
		});
	});

	describe('interactions', () => {
		it('enables the message input when notification checkbox is checked', async () => {
			const { user } = defaultSetup();
			const checkbox = screen.getByTestId('icon: Square');
			await user.click(checkbox);
			expect(screen.getByTestId('icon: CheckmarkSquare')).toBeInTheDocument();
			const input = screen.getByRole('textbox', { name: /share\.standard_message/i });
			expect(input).toBeEnabled();
		});
	});

	describe('revoke without notification', () => {
		it('calls folderActionSoapApi with op !grant and the correct zid', async () => {
			const { user } = defaultSetup();
			const folderActionMock = vi
				.spyOn(folderActionModule, 'folderActionSoapApi')
				.mockResolvedValue({} as never);
			await user.click(screen.getByRole('button', { name: /label\.revoke/i }));
			expect(folderActionMock).toHaveBeenCalledWith(
				expect.objectContaining({ op: '!grant', zid: baseGrant.zid })
			);
		});

		it('does not call sendShareNotificationSoapApi', async () => {
			const { user } = defaultSetup();
			const sendNotificationMock = vi
				.spyOn(sendShareModule, 'sendShareNotificationSoapApi')
				.mockResolvedValue([]);
			await user.click(screen.getByRole('button', { name: /label\.revoke/i }));
			expect(sendNotificationMock).not.toHaveBeenCalled();
		});

		it('calls goBack after confirming', async () => {
			const { user, goBack } = defaultSetup();
			await user.click(screen.getByRole('button', { name: /label\.revoke/i }));
			expect(goBack).toHaveBeenCalled();
		});

		it('shows success snackbar after revoke', async () => {
			const { user } = defaultSetup();
			await user.click(screen.getByRole('button', { name: /label\.revoke/i }));
			expect(await screen.findByTestId('snackbar')).toBeInTheDocument();
		});

		it('calls onSuccess after revoke', async () => {
			const onSuccess = vi.fn();
			const { user } = defaultSetup(onSuccess);
			await user.click(screen.getByRole('button', { name: /label\.revoke/i }));
			expect(onSuccess).toHaveBeenCalled();
		});
	});

	describe('revoke with notification', () => {
		it('calls sendShareNotification before folderAction', async () => {
			const { user } = defaultSetup();
			const callOrder: string[] = [];
			vi.spyOn(sendShareModule, 'sendShareNotificationSoapApi').mockImplementation(() => {
				callOrder.push('notify');
				return Promise.resolve([]);
			});
			vi.spyOn(folderActionModule, 'folderActionSoapApi').mockImplementation(() => {
				callOrder.push('revoke');
				return Promise.resolve({} as never);
			});
			await user.click(screen.getByTestId('icon: Square'));
			await user.click(screen.getByRole('button', { name: /label\.revoke/i }));
			expect(callOrder).toEqual(['notify', 'revoke']);
		});

		it('calls goBack after confirming with notification', async () => {
			const { user, goBack } = defaultSetup();
			await user.click(screen.getByTestId('icon: Square'));
			await user.click(screen.getByRole('button', { name: /label\.revoke/i }));
			expect(goBack).toHaveBeenCalled();
		});

		it('calls sendShareNotificationSoapApi with the grantee email', async () => {
			const { user } = defaultSetup();
			const sendNotificationMock = vi
				.spyOn(sendShareModule, 'sendShareNotificationSoapApi')
				.mockResolvedValue([]);
			await user.click(screen.getByTestId('icon: Square'));
			await user.click(screen.getByRole('button', { name: /label\.revoke/i }));
			expect(sendNotificationMock).toHaveBeenCalledWith(
				expect.objectContaining({ contacts: [{ email: baseGrant.d }] })
			);
		});
	});

	describe('on API failure', () => {
		beforeEach(() => {
			vi.spyOn(folderActionModule, 'folderActionSoapApi').mockResolvedValue({
				Fault: {}
			} as never);
		});

		it('still calls goBack even when folderActionSoapApi fails', async () => {
			const { user, goBack } = defaultSetup();
			await user.click(screen.getByRole('button', { name: /label\.revoke/i }));
			expect(goBack).toHaveBeenCalled();
		});

		it('shows an error snackbar', async () => {
			const { user } = defaultSetup();
			await user.click(screen.getByRole('button', { name: /label\.revoke/i }));
			expect(await screen.findByTestId('snackbar')).toBeInTheDocument();
		});

		it('does not call onSuccess', async () => {
			const onSuccess = vi.fn();
			const { user } = defaultSetup(onSuccess);
			await user.click(screen.getByRole('button', { name: /label\.revoke/i }));
			expect(onSuccess).not.toHaveBeenCalled();
		});
	});

	describe('when grant.zid is missing', () => {
		const grantWithoutZid: Grant = { gt: 'usr', perm: 'r', d: 'grantee@example.com' };

		beforeEach(() => {
			vi.spyOn(folderActionModule, 'folderActionSoapApi').mockResolvedValue({} as never);
		});

		it('calls goBack immediately without calling folderActionSoapApi', async () => {
			const { user, goBack } = defaultSetup(undefined, grantWithoutZid);
			await user.click(screen.getByRole('button', { name: /label\.revoke/i }));
			expect(goBack).toHaveBeenCalled();
			expect(folderActionModule.folderActionSoapApi).not.toHaveBeenCalled();
		});

		it('shows an error snackbar', async () => {
			const { user } = defaultSetup(undefined, grantWithoutZid);
			await user.click(screen.getByRole('button', { name: /label\.revoke/i }));
			expect(await screen.findByTestId('snackbar')).toBeInTheDocument();
		});
	});

	describe('when notification sending fails during revoke', () => {
		beforeEach(() => {
			vi.spyOn(sendShareModule, 'sendShareNotificationSoapApi').mockRejectedValue(
				new Error('network error')
			);
			vi.spyOn(folderActionModule, 'folderActionSoapApi').mockResolvedValue({} as never);
		});

		it('shows a warning snackbar and still proceeds with the revoke', async () => {
			const { user, goBack } = defaultSetup();
			await user.click(screen.getByTestId('icon: Square'));
			await user.click(screen.getByRole('button', { name: /label\.revoke/i }));
			expect(await screen.findByTestId('snackbar')).toBeInTheDocument();
			expect(goBack).toHaveBeenCalled();
		});

		it('still calls folderActionSoapApi after the notification failure', async () => {
			const { user } = defaultSetup();
			const folderActionMock = vi.spyOn(folderActionModule, 'folderActionSoapApi');
			await user.click(screen.getByTestId('icon: Square'));
			await user.click(screen.getByRole('button', { name: /label\.revoke/i }));
			expect(folderActionMock).toHaveBeenCalled();
		});
	});
});
