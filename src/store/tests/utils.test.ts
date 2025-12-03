import { getUserAccount } from '@zextras/carbonio-shell-ui';
import type { Mock } from 'vitest';
/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { extractIdsFromMessagesAndConversations, getCompleteMessageId } from 'store/utils';

describe('extractIdsFromMessagesAndConversations', () => {
	test('should return an empty array when no messages or conversations are passed', () => {
		const result = extractIdsFromMessagesAndConversations({});
		expect(result).toEqual([]);
	});
});

describe('getCompleteMessageId', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return the same messageId if it already contains a colon', () => {
		const messageId = '7ed9fffc-cb18-4ee6-817b-e2479b58eae2:456';
		const result = getCompleteMessageId(messageId);
		expect(result).toBe(messageId);
	});

	it('should return the complete messageId with account id if it does not contain a colon', () => {
		const messageId = '456';
		(getUserAccount as Mock).mockReturnValue({
			id: '7ed9fffc-cb18-4ee6-817b-e2479b58eae2'
		});
		const result = getCompleteMessageId(messageId);
		expect(result).toBe('7ed9fffc-cb18-4ee6-817b-e2479b58eae2:456');
	});

	it('should return undefined if messageId is undefined', () => {
		const result = getCompleteMessageId(undefined);
		expect(result).toBeUndefined();
	});

	it('should return the same messageId if getUserAccount returns undefined', () => {
		const messageId = '456';
		(getUserAccount as Mock).mockReturnValue(undefined);
		const result = getCompleteMessageId(messageId);
		expect(result).toBe(messageId);
	});
});
