import { Mock } from 'vitest';
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';
import { useUserSettings } from '@zextras/carbonio-shell-ui';

import * as sendDeliveryReportSoapApiMock from '../../../../../api/send-delivery-request-soap-api';
import { generateMessage } from '__test__/generators/generateMessage';
import ReadReceiptModal from '../read-receipt-modal';
import { setupTest } from '@test-setup';

const baseMessageWithReadReadReceiptRequested = generateMessage({
	id: '12345',
	isReadReceiptRequested: true
});

vi.mock('@zextras/carbonio-shell-ui', () => ({
	t: vi.fn((key, defaultValue) => defaultValue),
	useUserSettings: vi.fn()
}));

vi.mock('@zextras/carbonio-ui-soap-lib', () => ({
	legacySoapFetch: vi.fn()
}));

describe('ReadReceiptModal', () => {
	it('renders modal with correct texts when open', () => {
		setupTest(
			<ReadReceiptModal
				open
				onClose={vi.fn()}
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
		const mockOnClose = vi.fn();
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
		const mockOnClose = vi.fn();
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

	it('does not render modal when open is false', () => {
		setupTest(
			<ReadReceiptModal
				open={false}
				onClose={vi.fn()}
				message={baseMessageWithReadReadReceiptRequested}
				readReceiptSetting="ask"
			/>
		);
		expect(screen.queryByText('Read receipt required')).not.toBeInTheDocument();
	});

	it('should always trigger notify when read receipt setting is set to "always"', async () => {
		(useUserSettings as Mock).mockReturnValue({
			prefs: { zimbraPrefMailSendReadReceipts: 'always' }
		});

		const onCloseMock = vi.fn();

		const sendDeliveryReportSoapApiSpy = vi.spyOn(
			sendDeliveryReportSoapApiMock,
			'sendDeliveryReportSoapApi'
		);

		await act(async () => {
			setupTest(
				<ReadReceiptModal
					open={false}
					onClose={onCloseMock}
					message={baseMessageWithReadReadReceiptRequested}
					readReceiptSetting="always"
				/>
			);
		});

		expect(screen.queryByText('Read receipt required')).not.toBeInTheDocument();

		expect(sendDeliveryReportSoapApiSpy).toHaveBeenCalledWith('12345');

		expect(screen.getByTestId('snackbar')).toBeInTheDocument();
		expect(screen.getByText('A read receipt has been sent for this message')).toBeInTheDocument();

		expect(onCloseMock).toHaveBeenCalledTimes(1);
	});
});
