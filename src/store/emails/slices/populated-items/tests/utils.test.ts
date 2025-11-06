/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { cloneDeep, map } from 'lodash';

import { CONVERSATION_INDEX_SLICE_INITIAL_STATE } from '../../conversations/conversations-index-slice';
import { MESSAGE_INDEX_SLICE_INITIAL_STATE } from '../../messages/messages-slice';
import { SEARCH_INDEX_SLICE_INITIAL_STATE } from '../../search/search-slice';
import { deleteMessagesFromConversation } from '../utils';
import { generateConversation } from '__test__/generators/generateConversation';
import { generateMessage } from '__test__/generators/generateMessage';
import { ConvMessage, EmailsStoreState, MailMessage, NormalizedConversation } from 'types';

function arrayToRecord<T extends { id: string }>(items: Array<T> | undefined): Record<string, T> {
	if (!items) return {};
	return items.reduce(
		(acc, item) => {
			acc[item.id as string] = item;
			return acc;
		},
		{} as Record<string, T>
	);
}

function generateEmailsStoreState(
	conversations: Array<NormalizedConversation>,
	messages?: Array<MailMessage>
): EmailsStoreState {
	return {
		messageIndexSlice: MESSAGE_INDEX_SLICE_INITIAL_STATE,
		searchIndexSlice: SEARCH_INDEX_SLICE_INITIAL_STATE,
		conversationIndexSlice: CONVERSATION_INDEX_SLICE_INITIAL_STATE,
		populatedItemsSlice: {
			conversations: arrayToRecord(conversations),
			messages: arrayToRecord(messages),
			messagesStatus: {},
			conversationsStatus: {}
		}
	};
}

describe('deleteMessagesFromConversation', () => {
	describe('When called with valid message IDs', () => {
		it('should delete the specified messages from the conversation', () => {
			const messages = [generateMessage({ id: '1' }), generateMessage({ id: '2' })];
			const conversation = { ...generateConversation({ id: '123' }), messageIds: ['1', '2'] };
			const state = generateEmailsStoreState([conversation], messages);
			deleteMessagesFromConversation(['1', '2'], state);
			expect(state.populatedItemsSlice.conversations['123'].messageIds).toHaveLength(0);
		});

		it('should not affect other messages in the conversation', () => {
			const messages = [
				generateMessage({ id: '1' }),
				generateMessage({ id: '2' }),
				generateMessage({ id: '3' })
			];
			const conversation = {
				...generateConversation({ id: '123' }),
				messageIds: messages.map((m) => m.id)
			};
			const state = generateEmailsStoreState([conversation], messages);
			deleteMessagesFromConversation(['1', '2'], state);
			expect(state.populatedItemsSlice.conversations['123'].messageIds).toHaveLength(1);
		});
	});

	describe('When called with an empty array of IDs', () => {
		it('should not modify any messages in the conversations', () => {
			const messages = [
				generateMessage({ id: '1' }),
				generateMessage({ id: '2' }),
				generateMessage({ id: '3' })
			];
			const conversation = {
				...generateConversation({ id: '123' }),
				messageIds: ['1', '2', '3']
			};
			const state = generateEmailsStoreState([conversation], messages);
			deleteMessagesFromConversation([], state);
			expect(state.populatedItemsSlice.conversations['123'].messageIds).toHaveLength(3);
		});
	});

	describe('When called with non-existent message IDs', () => {
		it('should not delete any messages from the conversations', () => {
			const messages = [
				generateMessage({ id: '1' }),
				generateMessage({ id: '2' }),
				generateMessage({ id: '3' })
			];
			const conversation = {
				...generateConversation({ id: '123' }),
				messageIds: messages.map((m) => m.id)
			};
			const state = generateEmailsStoreState([conversation], messages);
			deleteMessagesFromConversation(['4', '5'], state);
			expect(state.populatedItemsSlice.conversations['123'].messageIds).toHaveLength(3);
		});
	});

	describe('When conversations have no messages', () => {
		it('should leave the state unchanged', () => {
			const messages = [] as Array<ConvMessage>;
			const conversation = { ...generateConversation({ id: '123' }), messages };
			const state = generateEmailsStoreState([conversation]);
			deleteMessagesFromConversation(['1', '2'], state);
			expect(state.populatedItemsSlice.conversations['123']).toMatchObject(
				expect.objectContaining({ id: '123', messages: [] })
			);
		});
	});

	describe('When the conversations array is empty', () => {
		it('should leave the state unchanged', () => {
			const state = generateEmailsStoreState([]);
			const expectedState = cloneDeep(state);
			deleteMessagesFromConversation(['1', '2'], state);
			expect(state).toMatchObject(expectedState);
		});
	});

	describe('Performance and scalability', () => {
		it('should handle a large number of conversations efficiently', () => {
			const numberOfConversations = 1000;
			const conversationIds = Array.from({ length: numberOfConversations }, (_, index) =>
				index.toString()
			);

			const conversations = conversationIds.map((id) => generateConversation({ id }));
			const state = generateEmailsStoreState(conversations);
			const start = performance.now();
			deleteMessagesFromConversation(['1', '2'], state);
			const end = performance.now();
			expect(end - start).toBeLessThan(10);
		});
		it('should handle a large number of conversations and messages efficiently', () => {
			const numberOfMessages = 1000;
			const numberOfConversations = 1000;
			const messageIds = Array.from({ length: numberOfMessages }, (_, index) => index.toString());
			const conversationIds = Array.from({ length: numberOfConversations }, (_, index) =>
				index.toString()
			);
			const messages = map(messageIds, (id) => generateMessage({ id }));
			const conversations = conversationIds.map((id) => generateConversation({ id }));

			const state = generateEmailsStoreState(conversations, messages);
			const start = performance.now();
			deleteMessagesFromConversation(['1'], state);
			const end = performance.now();
			expect(end - start).toBeLessThan(10);
		});
	});
});
