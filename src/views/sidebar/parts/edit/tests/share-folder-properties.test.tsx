/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { t } from '@zextras/carbonio-shell-ui';
import type { Grant } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import { generateFolder } from '@test-utils/folders/folders-generator';
import * as sendShareModule from 'api/send-share-notification-soap-api';
import { ShareCalendarRoleOptions } from 'integrations/shared-invite-reply/parts/utils';
import {
	GranteeInfo,
	ShareFolderProperties
} from 'views/sidebar/parts/edit/share-folder-properties';

const shareCalendarRoleOptions = ShareCalendarRoleOptions(t);

const baseGrant: Grant = {
	perm: 'r',
	gt: 'usr',
	zid: 'abc-123',
	d: 'user@example.com'
};

describe('GranteeInfo', () => {
	it('displays the grantee email (d field) when present', () => {
		setupTest(
			<GranteeInfo grant={baseGrant} shareCalendarRoleOptions={shareCalendarRoleOptions} />,
			{}
		);
		expect(screen.getByText(/user@example\.com/i)).toBeInTheDocument();
	});

	it('falls back to zid when d field is absent', () => {
		const grant: Grant = { perm: 'r', gt: 'usr', zid: 'abc-123' };
		setupTest(
			<GranteeInfo grant={grant} shareCalendarRoleOptions={shareCalendarRoleOptions} />,
			{}
		);
		expect(screen.getByText(/abc-123/i)).toBeInTheDocument();
	});

	it('renders without crashing when both d and zid are absent (public share)', () => {
		const grant: Grant = { perm: 'r', gt: 'all' };
		setupTest(
			<GranteeInfo grant={grant} shareCalendarRoleOptions={shareCalendarRoleOptions} />,
			{}
		);
		expect(screen.getByTestId('chip')).toBeInTheDocument();
	});

	it('applies a different CSS class when hovered', () => {
		const { rerender } = setupTest(
			<GranteeInfo
				grant={baseGrant}
				shareCalendarRoleOptions={shareCalendarRoleOptions}
				hovered={false}
			/>,
			{}
		);
		const chip = screen.getByTestId('chip');
		const defaultClass = chip.className;

		rerender(
			<GranteeInfo grant={baseGrant} shareCalendarRoleOptions={shareCalendarRoleOptions} hovered />
		);
		expect(screen.getByTestId('chip')).not.toHaveClass(defaultClass, { exact: true });
	});
});

describe('ShareFolderProperties', () => {
	it('renders without crashing when grants array is empty', () => {
		const folder = generateFolder({ acl: undefined });
		setupTest(
			<ShareFolderProperties folder={folder} grants={[]} onEdit={vi.fn()} onRevoke={vi.fn()} />,
			{}
		);
		expect(screen.queryByText(/user@example\.com/i)).not.toBeInTheDocument();
	});

	it('displays grants passed as props', () => {
		const folder = generateFolder();
		setupTest(
			<ShareFolderProperties
				folder={folder}
				grants={[baseGrant]}
				onEdit={vi.fn()}
				onRevoke={vi.fn()}
			/>,
			{}
		);
		expect(
			screen.getByText(/user@example\.com - share\.options\.share_calendar_role\.viewer/i)
		).toBeInTheDocument();
	});

	describe('action buttons', () => {
		const setupWithGrant = (
			grant = baseGrant
		): {
			user: ReturnType<typeof setupTest>['user'];
			onEdit: ReturnType<typeof vi.fn>;
			onRevoke: ReturnType<typeof vi.fn>;
		} => {
			const onEdit = vi.fn();
			const onRevoke = vi.fn();
			const folder = generateFolder();
			const { user } = setupTest(
				<ShareFolderProperties
					folder={folder}
					grants={[grant]}
					onEdit={onEdit}
					onRevoke={onRevoke}
				/>,
				{}
			);
			return { user, onEdit, onRevoke };
		};

		it('Edit button calls onEdit with the correct grant', async () => {
			const { user, onEdit } = setupWithGrant();
			await user.click(screen.getByRole('button', { name: /label\.edit/i }));
			expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ zid: baseGrant.zid }));
		});

		it('Revoke button calls onRevoke with the correct grant', async () => {
			const { user, onRevoke } = setupWithGrant();
			await user.click(screen.getByRole('button', { name: /label\.revoke/i }));
			expect(onRevoke).toHaveBeenCalledWith(expect.objectContaining({ zid: baseGrant.zid }));
		});

		it('Resend button calls sendShareNotificationSoapApi with the grantee email', async () => {
			vi.spyOn(sendShareModule, 'sendShareNotificationSoapApi').mockResolvedValue([]);
			const { user } = setupWithGrant();
			const sendNotificationMock = vi
				.spyOn(sendShareModule, 'sendShareNotificationSoapApi')
				.mockResolvedValue([]);
			await user.click(screen.getByRole('button', { name: /label\.resend/i }));
			expect(sendNotificationMock).toHaveBeenCalledWith(
				expect.objectContaining({ contacts: [{ email: baseGrant.d }] })
			);
		});

		it('Resend button does NOT call sendShareNotificationSoapApi when grant.d is absent', async () => {
			const grantWithoutEmail: Grant = { perm: 'r', gt: 'usr', zid: 'no-email-zid' };
			vi.spyOn(sendShareModule, 'sendShareNotificationSoapApi').mockResolvedValue([]);
			const { user } = setupWithGrant(grantWithoutEmail);
			const sendNotificationMock = vi
				.spyOn(sendShareModule, 'sendShareNotificationSoapApi')
				.mockResolvedValue([]);
			await user.click(screen.getByRole('button', { name: /label\.resend/i }));
			expect(sendNotificationMock).not.toHaveBeenCalled();
		});

		it('Resend button shows a success snackbar when notification is sent successfully', async () => {
			vi.spyOn(sendShareModule, 'sendShareNotificationSoapApi').mockResolvedValue([]);
			const { user } = setupWithGrant();
			await user.click(screen.getByRole('button', { name: /label\.resend/i }));
			expect(await screen.findByTestId('snackbar')).toBeInTheDocument();
		});

		it('Resend button does not show a snackbar when the API response contains a Fault', async () => {
			const sendMock = vi
				.spyOn(sendShareModule, 'sendShareNotificationSoapApi')
				.mockResolvedValue([{ Fault: {} }] as never);
			const { user } = setupWithGrant();
			await user.click(screen.getByRole('button', { name: /label\.resend/i }));
			await vi.waitFor(() => expect(sendMock).toHaveBeenCalled());
			expect(screen.queryByTestId('snackbar')).not.toBeInTheDocument();
		});
	});

	it('each grantee row uses its own grant perm to determine the role label', () => {
		const folder = generateFolder();
		const viewerGrant: Grant = { perm: 'r', gt: 'usr', zid: 'viewer-zid', d: 'viewer@example.com' };
		const adminGrant: Grant = {
			perm: 'rwidxa',
			gt: 'usr',
			zid: 'admin-zid',
			d: 'admin@example.com'
		};
		setupTest(
			<ShareFolderProperties
				folder={folder}
				grants={[viewerGrant, adminGrant]}
				onEdit={vi.fn()}
				onRevoke={vi.fn()}
			/>,
			{}
		);
		expect(
			screen.getByText(/viewer@example\.com - share\.options\.share_calendar_role\.viewer/i)
		).toBeInTheDocument();
		expect(
			screen.getByText(/admin@example\.com - share\.options\.share_calendar_role\.admin/i)
		).toBeInTheDocument();
	});

	describe('hover behavior', () => {
		it('chip background changes on mouse enter and reverts on mouse leave', async () => {
			const folder = generateFolder();
			const { user } = setupTest(
				<ShareFolderProperties
					folder={folder}
					grants={[baseGrant]}
					onEdit={vi.fn()}
					onRevoke={vi.fn()}
				/>,
				{}
			);

			const chip = screen.getByTestId('chip');
			const defaultClass = chip.className;

			await user.hover(screen.getByRole('button', { name: /label\.edit/i }));
			expect(chip).not.toHaveClass(defaultClass, { exact: true });

			await user.unhover(screen.getByRole('button', { name: /label\.edit/i }));
			expect(chip).toHaveClass(defaultClass, { exact: true });
		});
	});
});
