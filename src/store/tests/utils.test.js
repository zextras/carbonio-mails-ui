/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { extractIdsFromMessagesAndConversations } from '../utils';

// write a unit test for function extractIdsFromMessagesAndConversations
// and make it pass
describe('extractIdsFromMessagesAndConversations', () => {
	test('should return an empty array when no messages or conversations are passed', () => {
		const result = extractIdsFromMessagesAndConversations();
		expect(result).toEqual([]);
	});
});
