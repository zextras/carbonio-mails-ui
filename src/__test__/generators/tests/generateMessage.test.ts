/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { populateMessagesInEmailStore } from '__test__/generators/generateMessage';

describe('generateConversation', () => {
	describe('populateMessagesInEmailStore', () => {
		it('should populate the email store with messages of passed messageIds', () => {
			const messages = populateMessagesInEmailStore({
				messageIds: ['10', '22', '35']
			});

			expect(messages).toHaveLength(3);
			expect(messages[0].id).toBe('10');
			expect(messages[1].id).toBe('22');
			expect(messages[2].id).toBe('35');
		});

		it('should populate the email store with messages based on passed messagesNumber', () => {
			const messages = populateMessagesInEmailStore({
				messagesNumber: 2
			});

			expect(messages).toHaveLength(2);
			expect(messages[0].id).toBe('100');
			expect(messages[1].id).toBe('101');
		});

		it('should populate the email store with messages based on passed MessageGenerationParams', () => {
			const conversationId = '1';
			const messages = populateMessagesInEmailStore({
				messageGeneratorParams: [
					{ id: '100', cid: conversationId },
					{ id: '222', cid: conversationId }
				]
			});

			expect(messages).toHaveLength(2);
			expect(messages[0].id).toBe('100');
			expect(messages[1].id).toBe('222');
		});
	});
});
