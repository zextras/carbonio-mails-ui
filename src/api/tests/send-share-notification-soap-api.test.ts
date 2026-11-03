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

	it('sends the action and escapes the notes', async () => {
		(global.fetch as Mock).mockResolvedValueOnce({
			json: async () => ({ Body: { SendShareNotificationResponse: {} } })
		});

		await sendShareNotificationSoapApi({
			contacts: [{ email: 'test@example.com' }],
			accounts: [{ name: 'testAccount' }],
			folder: { id: '123' },
			standardMessage: 'Tom & Jerry <3',
			action: 'revoke'
		});

		const { body } = (global.fetch as Mock).mock.calls[0][1];
		expect(body).toContain('<SendShareNotificationRequest xmlns="urn:zimbraMail" action="revoke">');
		expect(body).toContain('<notes>Tom &amp; Jerry &lt;3</notes>');
	});

	it('returns the body of the response, so a fault can be detected', async () => {
		const fault = { Code: { Value: 'soap:Sender' }, Reason: { Text: 'no matching grant' } };
		(global.fetch as Mock).mockResolvedValueOnce({
			json: async () => ({ Header: {}, Body: { Fault: fault } })
		});

		const result = await sendShareNotificationSoapApi({
			contacts: [{ email: 'test@example.com' }],
			accounts: [{ name: 'testAccount' }],
			folder: { id: '123' }
		});

		expect(result).toEqual([{ Fault: fault }]);
	});
});
