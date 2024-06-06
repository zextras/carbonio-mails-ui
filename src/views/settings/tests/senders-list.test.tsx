/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { SendersList, SendersListProps } from '../senders-list';

const buildProps = ({
	settingsObj = {},
	updateSettings = jest.fn(),
	listType = 'Allowed'
}: Partial<SendersListProps>): SendersListProps => ({
	settingsObj,
	updateSettings,
	listType
});

describe('Allowed sender list addresses settings', () => {
	it('should render the section title', () => {
		setupTest(<SendersList {...buildProps({ listType: 'Allowed' })} />);
		expect(screen.getByText('label.allowed_addresses')).toBeVisible();
	});
	it('should render the section message', () => {
		setupTest(<SendersList {...buildProps({ listType: 'Allowed' })} />);
		expect(screen.getByText('messages.allowed_addresses')).toBeVisible();
	});
	it('should render the "add" widget', () => {
		setupTest(<SendersList {...buildProps({ listType: 'Allowed' })} />);
		expect(screen.getByRole('button', { name: 'label.add' })).toBeVisible();
		const nameInput = screen.getByRole('textbox', { name: 'label.enter_single_email_address' });
		expect(nameInput).toBeVisible();
	});
});

describe('Blocked sender list addresses settings', () => {
	it('should render the section title', () => {
		setupTest(<SendersList {...buildProps({ listType: 'Blocked' })} />);
		expect(screen.getByText('label.blocked_addresses')).toBeVisible();
	});
	it('should render the section message', () => {
		setupTest(<SendersList {...buildProps({ listType: 'Blocked' })} />);
		expect(screen.getByText('messages.blocked_addresses')).toBeVisible();
	});
	it('should render the "add" widget', () => {
		setupTest(<SendersList {...buildProps({ listType: 'Blocked' })} />);
		expect(screen.getByRole('button', { name: 'label.add' })).toBeVisible();
		const nameInput = screen.getByRole('textbox', { name: 'label.enter_single_email_address' });
		expect(nameInput).toBeVisible();
	});
});
