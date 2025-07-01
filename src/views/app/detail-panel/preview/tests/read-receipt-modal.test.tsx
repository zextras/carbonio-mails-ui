/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { generateMessage } from '../../../../../tests/generators/generateMessage';
import ReadReceiptModal from '../read-receipt-modal';

const baseMessageWithReadReadReceiptRequested = generateMessage({
	id: '12345',
	isReadReceiptRequested: true
});

jest.mock('@zextras/carbonio-shell-ui', () => ({
	soapFetch: jest.fn(),
	t: jest.fn((key, defaultValue) => defaultValue)
}));

describe('ReadReceiptModal', () => {
	it('renders modal with correct texts when open', () => {
		setupTest(
			<ReadReceiptModal
				open
				onClose={jest.fn()}
				message={baseMessageWithReadReadReceiptRequested}
				readReceiptSetting="ask"
			/>
		);

		expect(screen.getByText('Read receipt required')).toBeInTheDocument();
		expect(screen.getByText(/The sender of this message has requested/)).toBeInTheDocument();
		expect(screen.getByText(/Do you wish to notify the sender/)).toBeInTheDocument();
		expect(screen.getByText('Notify')).toBeInTheDocument();
		expect(screen.getByText('Do not notify')).toBeInTheDocument();
	});

	it('should call onClose when "do not notify" action is triggered', async () => {
		const mockOnClose = jest.fn();
		const { user } = setupTest(
			<ReadReceiptModal
				open
				onClose={mockOnClose}
				message={baseMessageWithReadReadReceiptRequested}
				readReceiptSetting="ask"
			/>
		);

		const doNotNotifyButton = await screen.findByText('Do not notify');
		await user.click(doNotNotifyButton);

		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});

	it('should call onClose when "notify" action is triggered', async () => {
		const mockOnClose = jest.fn();
		const { user } = setupTest(
			<ReadReceiptModal
				open
				onClose={mockOnClose}
				message={baseMessageWithReadReadReceiptRequested}
				readReceiptSetting="ask"
			/>
		);

		const notifyButton = await screen.findByText('Notify');
		await user.click(notifyButton);

		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});
});
