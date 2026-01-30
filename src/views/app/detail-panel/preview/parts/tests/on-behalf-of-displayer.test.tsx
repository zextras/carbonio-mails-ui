/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupHook, setupTest } from '@test-setup';
import OnBehalfOfDisplayer from '../on-behalf-of-displayer';
import { Participant } from 'types/participant';
import { ParticipantRole } from '@zextras/carbonio-ui-commons';
import { MailMessage } from 'types/messages';
import { useTheme } from '@zextras/carbonio-design-system';

describe('OnBehalfOfDisplayer', () => {
	const mockSenderContact: Participant = {
		type: ParticipantRole.FROM,
		fullName: 'john doe',
		address: 'john.doe@example.com',
		name: 'john doe'
	};

	const mockMainContact: Participant = {
		type: ParticipantRole.TO,
		fullName: 'jane smith',
		name: 'jane smith',
		address: 'jane.smith@example.com'
	};

	const mockMessage = {
		id: 'msg1',
		read: false
	} as MailMessage;

	it('renders sender and main contact information correctly', () => {
		setupTest(
			<OnBehalfOfDisplayer
				compProps={{
					senderContact: mockSenderContact,
					mainContact: mockMainContact,
					message: mockMessage
				}}
			/>
		);

		expect(screen.getByText(/John doe/i)).toBeVisible();
		expect(screen.getByText(/<john.doe@example.com>/i)).toBeVisible();
		expect(screen.getByText(/behalf of/i)).toBeVisible();
		expect(screen.getByText(/Jane smith/i)).toBeVisible();
		expect(screen.getByText(/<jane.smith@example.com>/i)).toBeVisible();
	});

	it('capitalizes contact names', () => {
		setupTest(
			<OnBehalfOfDisplayer
				compProps={{
					senderContact: mockSenderContact,
					mainContact: mockMainContact,
					message: mockMessage
				}}
			/>
		);

		// Check that names are capitalized (first letter uppercase)
		expect(screen.getByText(/John doe/i)).toBeVisible();
		expect(screen.getByText(/Jane smith/i)).toBeVisible();
	});

	it('handles read message state', () => {
		const {
			result: { current: theme }
		} = setupHook(useTheme);
		const readMessage = { ...mockMessage, read: true };

		setupTest(
			<OnBehalfOfDisplayer
				compProps={{
					senderContact: mockSenderContact,
					mainContact: mockMainContact,
					message: readMessage
				}}
			/>
		);

		const name = screen.getByText(/John doe/i);

		expect(name).toBeVisible();
		expect(name).toHaveStyle({ color: theme.palette.text.regular });
	});

	it('handles unread message state', () => {
		const {
			result: { current: theme }
		} = setupHook(useTheme);
		const unreadMessage = { ...mockMessage, read: false };

		setupTest(
			<OnBehalfOfDisplayer
				compProps={{
					senderContact: mockSenderContact,
					mainContact: mockMainContact,
					message: unreadMessage
				}}
			/>
		);

		const name = screen.getByText(/John doe/i);

		expect(name).toBeVisible();
		expect(name).toHaveStyle({ color: theme.palette.primary.regular });
	});

	it('uses name when fullName is not available for main contact', () => {
		const mainContactWithoutFullName: Participant = {
			type: ParticipantRole.TO,
			name: 'jane',
			address: 'jane@example.com',
			fullName: ''
		};

		setupTest(
			<OnBehalfOfDisplayer
				compProps={{
					senderContact: mockSenderContact,
					mainContact: mainContactWithoutFullName,
					message: mockMessage
				}}
			/>
		);

		expect(screen.getByText('Jane')).toBeVisible();
	});

	it('displays complete behalf of message format', () => {
		setupTest(
			<OnBehalfOfDisplayer
				compProps={{
					senderContact: mockSenderContact,
					mainContact: mockMainContact,
					message: mockMessage
				}}
			/>
		);

		// Verify the complete format: "Sender <email> behalf of MainContact <email>"
		expect(screen.getByText(/John doe/i)).toBeVisible();
		expect(screen.getByText(/<john.doe@example.com>/i)).toBeVisible();
		expect(screen.getByText(/behalf of/i)).toBeVisible();
		expect(screen.getByText(/Jane smith/i)).toBeVisible();
		expect(screen.getByText(/<jane.smith@example.com>/i)).toBeVisible();
	});
});
