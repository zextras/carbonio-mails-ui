/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { waitFor } from '@testing-library/react';

import { populateConversationInEmailStore } from '../../tests/generators/generateConversation';
import { setupHook } from '@test-setup';
import { useShouldReplaceHistory } from 'hooks/use-should-replace-history';

describe('useShouldReplaceHistory Given a message as parameter', () => {
	it('should return false if there is no route in parent components', async () => {
		const { messages } = await waitFor(() => populateConversationInEmailStore());
		const {
			result: { current }
		} = setupHook(useShouldReplaceHistory, {
			initialProps: [messages[0]],
			initialEntries: [''],
			path: ''
		});
		expect(current).toEqual(false);
	});
	it('should return false if there are multiple messages in the conversation related to the folder', async () => {
		const { conversation, messages } = await waitFor(() =>
			populateConversationInEmailStore({ conversationMessagesNumber: 3 })
		);
		const message = messages[0];
		const {
			result: { current }
		} = setupHook(useShouldReplaceHistory, {
			initialProps: [message],
			initialEntries: [`/mails/folder/${message.parent}/conversation/${conversation.id}`],
			path: '/mails/folder/:folderId/conversation/:conversationId'
		});
		expect(current).toEqual(false);
	});
	it('should return true if there are multiple messages in a conversation but none of them are related to the folder', async () => {
		const { conversation, messages } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: {
					messageIds: ['22', '23', '24']
				},
				messageGeneratorParams: [
					{ id: '22', folderId: '3' },
					{ id: '23', folderId: '3' },
					{ id: '24', folderId: '3' }
				]
			})
		);
		const message = messages[0];
		const {
			result: { current }
		} = setupHook(useShouldReplaceHistory, {
			initialProps: [message],
			initialEntries: [`/mails/folder/2/conversation/${conversation.id}`],
			path: '/mails/folder/:folderId/conversation/:conversationId'
		});
		expect(current).toEqual(true);
	});
	it('should return true if there are multiple messages in a conversation but this is the only one related to the folder', async () => {
		const { conversation, messages } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: {
					messageIds: ['22', '23', '24']
				},
				messageGeneratorParams: [
					{ id: '22', folderId: '2' },
					{ id: '23', folderId: '3' },
					{ id: '24', folderId: '3' }
				]
			})
		);
		const message = messages[0];
		const {
			result: { current }
		} = setupHook(useShouldReplaceHistory, {
			initialProps: [message],
			initialEntries: [`/mails/folder/2/conversation/${conversation.id}`],
			path: '/mails/folder/:folderId/conversation/:conversationId'
		});
		expect(current).toEqual(true);
	});
	it('should return true if this is the only message in a conversation', async () => {
		const { conversation, messages } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: {
					id: '-234',
					messageIds: ['22']
				},
				messageGeneratorParams: [{ id: '22', folderId: '-234' }]
			})
		);
		const message = messages[0];
		const {
			result: { current }
		} = setupHook(useShouldReplaceHistory, {
			initialProps: [message],
			initialEntries: [`/mails/folder/2/conversation/${conversation.id}`],
			path: '/mails/folder/:folderId/conversation/:conversationId'
		});
		expect(current).toEqual(true);
	});
});
