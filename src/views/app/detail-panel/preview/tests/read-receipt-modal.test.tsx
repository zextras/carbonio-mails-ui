/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import type { Mock } from 'vitest';

import { ReadReceiptModal } from '../read-receipt-modal';
import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateMessage } from '__test__/generators/generateMessage';
import { MsgActionRequest, MsgActionResponse } from 'types/soap/msg-action';

const baseMessageWithReadReadReceiptRequested = generateMessage({
	id: '12345',
	isReadReceiptRequested: true
});

vi.mock('@zextras/carbonio-shell-ui', () => ({
	t: vi.fn((key, defaultValue) => defaultValue),
	useUserSettings: vi.fn()
}));

describe('ReadReceiptModal', () => {
	beforeEach(() => {
		(useUserSettings as Mock).mockReturnValue({
			prefs: {}
		});
	});

	it('renders modal with correct texts when open', () => {
		createSoapAPIInterceptor<{ mid: string }>('SendDeliveryReport');
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
		const msgActionInterceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
			'MsgAction',
			{ action: { id: '12345', op: 'update' } }
		);
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
		const request = await msgActionInterceptor;
		expect(request.action.op).toBe('update');
		expect(request.action.f).toBe('n');
	});

	it('should send flag "nu" when "do not notify" is clicked and message is unread with "Mark manually" setting', async () => {
		(useUserSettings as Mock).mockReturnValue({
			prefs: { zimbraPrefMarkMsgRead: '-1' }
		});

		const unreadMessage = generateMessage({
			id: '12345',
			isReadReceiptRequested: true,
			isRead: false
		});

		const msgActionInterceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
			'MsgAction',
			{ action: { id: '12345', op: 'update' } }
		);

		const { user } = setupTest(
			<ReadReceiptModal open onClose={vi.fn()} message={unreadMessage} readReceiptSetting="ask" />
		);

		const doNotNotifyButton = await screen.findByText('Do not notify');
		await user.click(doNotNotifyButton);

		const request = await msgActionInterceptor;
		expect(request.action.op).toBe('update');
		expect(request.action.f).toBe('nu');
	});

	it('should send flag "n" when "do not notify" is clicked and message is already read, even with "Mark manually" setting', async () => {
		(useUserSettings as Mock).mockReturnValue({
			prefs: { zimbraPrefMarkMsgRead: '-1' }
		});

		const readMessage = generateMessage({
			id: '12345',
			isReadReceiptRequested: true,
			isRead: true
		});

		const msgActionInterceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
			'MsgAction',
			{ action: { id: '12345', op: 'update' } }
		);

		const { user } = setupTest(
			<ReadReceiptModal open onClose={vi.fn()} message={readMessage} readReceiptSetting="ask" />
		);

		const doNotNotifyButton = await screen.findByText('Do not notify');
		await user.click(doNotNotifyButton);

		const request = await msgActionInterceptor;
		expect(request.action.op).toBe('update');
		expect(request.action.f).toBe('n');
	});

	it('should send flag "n" when "do not notify" is clicked and default (non-manual) mark-as-read setting is active', async () => {
		const msgActionInterceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
			'MsgAction',
			{ action: { id: '12345', op: 'update' } }
		);

		const { user } = setupTest(
			<ReadReceiptModal
				open
				onClose={vi.fn()}
				message={baseMessageWithReadReadReceiptRequested}
				readReceiptSetting="ask"
			/>
		);

		const doNotNotifyButton = await screen.findByText('Do not notify');
		await user.click(doNotNotifyButton);

		const request = await msgActionInterceptor;
		expect(request.action.op).toBe('update');
		expect(request.action.f).toBe('n');
	});

	it('should call onClose when "notify" action is triggered', async () => {
		createSoapAPIInterceptor<{ mid: string }>('SendDeliveryReport');
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
		createSoapAPIInterceptor<{ mid: string }>('SendDeliveryReport');
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

		const api = createSoapAPIInterceptor<{ mid: string }>('SendDeliveryReport');

		const onCloseMock = vi.fn();

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
		const request = await api;
		expect(request.mid).toBe('12345');

		expect(screen.getByTestId('snackbar')).toBeInTheDocument();
		expect(screen.getByText('A read receipt has been sent for this message')).toBeInTheDocument();

		expect(onCloseMock).toHaveBeenCalledTimes(1);
	});
});
