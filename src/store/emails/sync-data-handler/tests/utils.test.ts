/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { getUserSettings, SoapNotify, useRefresh } from '@zextras/carbonio-shell-ui';

import { useNotify } from '../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { normalizeConversations } from '../../../../normalizations/normalize-conversation';
import { generateConversation } from '../../../../tests/generators/generateConversation';
import { generateMessage } from '../../../../tests/generators/generateMessage';
import { SoapConversation, SoapIncompleteMessage, SoapMailMessage } from '../../../../types';
import { useSyncDataHandler } from '../../../../views/sidebar/commons/sync-data-handler-hooks';
import {
	handleNotifyMessagesCreated,
	setConversationsInEmailStore,
	setMessagesInEmailStore,
	useConversationById,
	useConversationsByIds,
	useMessageById,
	useMessageIndexSlice
} from '../../store';

function mockSoapRefresh(mailbox: number): void {
	(useRefresh as jest.Mock).mockReturnValue({
		mbx: [{ s: mailbox }]
	});
}

function generateSoapAction(partial?: Partial<SoapNotify>): SoapNotify {
	return {
		deleted: [],
		seq: 0,
		...partial
	};
}

function mockSoapCreateConversation(soapConversations: Array<SoapConversation>): void {
	const mailboxNumber = 1000;
	mockSoapRefresh(mailboxNumber);
	const soapNotify = generateSoapAction({
		created: {
			c: soapConversations,
			m: []
		}
	});
	(useNotify as jest.Mock).mockReturnValue([soapNotify]);
}

function getSoapMessage(
	messageId: string,
	initialData?: Partial<SoapIncompleteMessage>
): SoapMailMessage {
	return {
		id: messageId,
		cid: '1',
		e: [],
		su: 'message Subject',
		s: 71116,
		l: '2',
		f: 'au',
		fr: 'fragment',
		mp: [],
		d: 1717752296000,
		...initialData
	};
}

function getSoapConversation(id: string): SoapConversation {
	return {
		id,
		n: 1,
		u: 1,
		f: 'flag',
		tn: 'tag names',
		d: 123,
		m: [getSoapMessage('123')],
		e: [],
		su: 'conversations Subject',
		fr: 'fragment'
	};
}

jest.mock('../../../../carbonio-ui-commons/store/zustand/tags', () => ({
	...jest.requireActual('../../../../carbonio-ui-commons/store/zustand/tags'),
	getTags: jest.fn()
}));

describe('handleNotifyConversationsCreated', () => {
	it('should add new conversations to the store', async () => {
		setConversationsInEmailStore(normalizeConversations([getSoapConversation('1')]), false);
		const newConversation = getSoapConversation('2');
		mockSoapCreateConversation([newConversation]);

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => {
			renderHook(() => useSyncDataHandler());
		});

		const expectedConversationsInStore = ['1', '2'];
		const { result: conversationsInStore } = renderHook(() =>
			useConversationsByIds(expectedConversationsInStore)
		);

		expect(conversationsInStore.current.length).toBe(2);

		expect(conversationsInStore.current.map((c) => c.id)).toEqual(expectedConversationsInStore);
	});

	it('should not duplicate conversations', async () => {
		setConversationsInEmailStore(normalizeConversations([getSoapConversation('1')]), false);

		const newConversation = getSoapConversation('1');
		mockSoapCreateConversation([newConversation]);

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => {
			renderHook(() => useSyncDataHandler());
		});
		const { result: conversationsInStore } = renderHook(() => useConversationsByIds(['1']));

		expect(conversationsInStore.current.length).toBe(1);
		expect(conversationsInStore.current.map((c) => c.id)).toEqual(['1']);
	});

	it('should handle empty conversations array', async () => {
		mockSoapCreateConversation([]);

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => {
			renderHook(() => useSyncDataHandler());
		});

		const { result: conversationsInStore } = renderHook(() => useConversationsByIds([]));
		await waitFor(() => {
			expect(conversationsInStore.current).toEqual([]);
		});
	});
});

describe('handleNotifyMessagesCreated', () => {
	describe('addMessagesToMessageSlice', () => {
		it('should add messages to populatedItemsSlice.messages', async () => {
			const message = generateMessage({ id: '1' });
			setMessagesInEmailStore([message], false);
			const newMessage = generateMessage({ id: '2' });
			handleNotifyMessagesCreated([newMessage]);
			const { result } = renderHook(() => useMessageById(newMessage.id));
			await waitFor(async () => {
				expect(result.current).toEqual(newMessage);
			});
		});

		it('should update messageListIndex with new message ids', async () => {
			const message = generateMessage({ id: '1' });
			setMessagesInEmailStore([message], false);
			const newMessage = generateMessage({ id: '2' });
			handleNotifyMessagesCreated([newMessage]);
			const { result } = renderHook(() => useMessageIndexSlice());
			await waitFor(async () => {
				expect(result.current?.messageListIndex).toEqual(['2', '1']);
			});
		});
	});

	describe('getOrderedMessagesForConversation', () => {
		it('should return messages in descending order when sortOrder is dateDesc', async () => {
			(getUserSettings as jest.Mock).mockReturnValue({
				prefs: { zimbraPrefConversationOrder: 'dateDesc' }
			});
			const message = generateMessage({ id: '1' });
			setConversationsInEmailStore(
				[generateConversation({ id: '123', messages: [message] })],
				false
			);
			const newMessage = { ...generateMessage({ id: '2' }), conversation: '123' };
			handleNotifyMessagesCreated([newMessage]);
			const { result } = renderHook(() => useConversationById('123'));
			await waitFor(async () => {
				const messagesIds = result.current.messages.map((m) => m.id);
				expect(messagesIds).toEqual(['2', '1']);
			});
		});

		it('should return messages in ascending order when sortOrder is not dateDesc', async () => {
			(getUserSettings as jest.Mock).mockReturnValue({
				prefs: { zimbraPrefConversationOrder: 'dateAsc' }
			});

			const message = generateMessage({ id: '1' });
			setConversationsInEmailStore(
				[generateConversation({ id: '123', messages: [message] })],
				false
			);
			const newMessage = { ...generateMessage({ id: '2' }), conversation: '123' };
			handleNotifyMessagesCreated([newMessage]);
			const { result } = renderHook(() => useConversationById('123'));
			await waitFor(async () => {
				const messagesIds = result.current.messages.map((m) => m.id);
				expect(messagesIds).toEqual(['1', '2']);
			});
		});
	});
});
