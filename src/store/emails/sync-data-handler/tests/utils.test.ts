/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { SoapNotify, useRefresh } from '@zextras/carbonio-shell-ui';

import { useNotify } from '../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { normalizeConversations } from '../../../../normalizations/normalize-conversation';
import { SoapConversation, SoapIncompleteMessage, SoapMailMessage } from '../../../../types';
import { useSyncDataHandler } from '../../../../views/sidebar/commons/sync-data-handler-hooks';
import { setConversationsInEmailStore, useConversationsByIds } from '../../store';

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
		act(() => {
			setConversationsInEmailStore(normalizeConversations([getSoapConversation('1')]), false);
		});

		const newConversation = getSoapConversation('2');

		mockSoapCreateConversation([newConversation]);

		renderHook(() => useSyncDataHandler(), {});

		const expectedConversationsInStore = ['1', '2'];
		const { result: conversationsInStore } = renderHook(() =>
			useConversationsByIds(expectedConversationsInStore)
		);

		await waitFor(() => {
			expect(conversationsInStore.current.length).toBe(2);
		});
		expect(conversationsInStore.current.map((c) => c.id)).toEqual(expectedConversationsInStore);
	});

	// TODO: CO-1725 - Fix this test with proper act wrapping
	// it('should not duplicate conversations in the index', async () => {
	// 	act(() => {
	// 		setConversationsInEmailStore(normalizeConversations([getSoapConversation('1')]), false);
	// 	});
	//
	// 	const newConversation = getSoapConversation('1');
	// 	mockSoapCreateConversation([newConversation]);
	//
	// 	renderHook(() => useSyncDataHandler());
	// 	const { result: conversationsInStore } = renderHook(() => useConversationsByIds(['1']));
	//
	// 	await waitFor(() => {
	// 		expect(conversationsInStore.current.length).toBe(1);
	// 	});
	// 	await waitFor(() => {
	// 		expect(conversationsInStore.current.map((c) => c.id)).toEqual(['1']);
	// 	});
	// });
	//
	// it('should handle empty conversations array', async () => {
	// 	mockSoapCreateConversation([]);
	//
	// 	renderHook(() => useSyncDataHandler());
	//
	// 	const { result: conversationsInStore } = renderHook(() => useConversationsByIds([]));
	//
	// 	expect(conversationsInStore.current).toEqual([]);
	// });
});
