import type { Mock } from 'vitest';
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { sendShareNotificationSoapApi } from 'api/send-share-notification-soap-api';

describe('sendShareNotificationSoapApi', () => {
	const mockResponse = { success: true };

	beforeEach(() => {
		global.fetch = vi.fn();
	});

	it('handles successful share notification', async () => {
		(global.fetch as Mock).mockResolvedValueOnce({
			json: async () => mockResponse
		});

		const result = await sendShareNotificationSoapApi({
			// eslint-disable-next-line sonarjs/no-duplicate-string
			contacts: [{ email: 'test@example.com' }],
			accounts: [{ name: 'testAccount' }],
			folder: { id: '123' },
			// eslint-disable-next-line sonarjs/no-duplicate-string
			standardMessage: 'Test message'
		});

		expect(global.fetch).toHaveBeenCalledWith(
			// eslint-disable-next-line sonarjs/no-duplicate-string
			'/service/soap/SendShareNotificationRequest',
			expect.any(Object)
		);
		expect(result).toEqual([mockResponse]);
	});

	it('handles error during share notification', async () => {
		(global.fetch as Mock).mockRejectedValueOnce(new Error('Error'));

		const result = await sendShareNotificationSoapApi({
			contacts: [{ email: 'test@example.com' }],
			accounts: [{ name: 'testAccount' }],
			folder: { id: '123' },
			standardMessage: 'Test message'
		});

		expect(global.fetch).toHaveBeenCalledWith(
			'/service/soap/SendShareNotificationRequest',
			expect.any(Object)
		);
		expect(result).toEqual([{ error: new Error('Error') }]);
	});

	it('handles empty standard message', async () => {
		(global.fetch as Mock).mockResolvedValueOnce({
			json: async () => mockResponse
		});

		const result = await sendShareNotificationSoapApi({
			contacts: [{ email: 'test@example.com' }],
			accounts: [{ name: 'testAccount' }],
			folder: { id: '123' }
		});

		expect(global.fetch).toHaveBeenCalledWith(
			'/service/soap/SendShareNotificationRequest',
			expect.any(Object)
		);
		expect(result).toEqual([mockResponse]);
	});

	it('handles multiple contacts', async () => {
		(global.fetch as Mock).mockResolvedValue({
			json: vi.fn().mockResolvedValue(mockResponse)
		});

		const result = await sendShareNotificationSoapApi({
			contacts: [{ email: 'test1@example.com' }, { email: 'test2@example.com' }],
			accounts: [{ name: 'testAccount' }],
			folder: { id: '123' },
			standardMessage: 'Test message'
		});

		expect(global.fetch).toHaveBeenCalledTimes(2);
		expect(result).toEqual([mockResponse, mockResponse]);
	});

	it('handles empty contacts array', async () => {
		const result = await sendShareNotificationSoapApi({
			contacts: [],
			accounts: [{ name: 'testAccount' }],
			folder: { id: '123' },
			standardMessage: 'Test message'
		});

		expect(global.fetch).not.toHaveBeenCalled();
		expect(result).toEqual([]);
	});
});
