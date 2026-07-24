/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import * as shell from '@zextras/carbonio-shell-ui';
import { FOLDERS, useFolderStore } from '@zextras/carbonio-ui-commons';

import { useConversationListByFolder } from '../../../../hooks/use-conversations-list-by-folder';
import { getNotificationManager, getUserSettings } from '@test-mocks/@zextras/carbonio-shell-ui';
import { setupHook } from '@test-setup';
import { generateFolders } from '@test-utils/folders/folders-generator';
import {
	generateConversation,
	populateConversationInEmailStore
} from '__test__/generators/generateConversation';
import { generateMessage } from '__test__/generators/generateMessage';
import { useCompleteConversationOrFetch } from 'store/emails/hooks/hooks';
import {
	appendConversationsToConversationIndexSlice,
	handleNotifyMessagesCreated,
	setConversationsInEmailStore,
	setMessagesInEmailStore,
	useConversationById,
	useMessageById,
	useMessageIndexSlice
} from 'store/emails/store';
import { triggerNotification } from 'store/emails/sync-data-handler/trigger-notification';

beforeEach(() => {
	window.history.pushState({}, '', `/folder/${FOLDERS.INBOX}`);
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

		it('should update conversationListIndex with ordered conversation ids by message date', async () => {
			getUserSettings.mockReturnValue({
				attrs: {},
				props: [],
				prefs: {
					zimbraPrefLocale: 'en',
					zimbraPrefSortOrder: '2:date-Desc'
				}
			});
			const folders = generateFolders();
			useFolderStore.setState({ folders });
			const { conversation: firstConv, messages: firstConvMessages } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: { id: '123', folderId: FOLDERS.INBOX },
					messageGeneratorParams: [
						{ id: '1000', receiveDate: new Date().setSeconds(new Date().getSeconds() - 30) }
					]
				})
			);
			const { conversation: secondConv, messages: secondConvMessages } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: { id: '124', folderId: FOLDERS.INBOX },
					messageGeneratorParams: [
						{ id: '1000', receiveDate: new Date().setSeconds(new Date().getSeconds() - 50) }
					]
				})
			);
			await act(async () => {
				await appendConversationsToConversationIndexSlice([firstConv, secondConv], 100, false);
			});
			await act(async () => {
				await setMessagesInEmailStore([...firstConvMessages, ...secondConvMessages], false);
			});

			const { result } = setupHook(useConversationListByFolder, {
				initialProps: [FOLDERS.INBOX]
			});

			expect(result.current.conversationIndexSlice.conversationListIndex).toEqual([
				firstConv.id,
				secondConv.id
			]);
			const newMessage = generateMessage({
				id: '2',
				receiveDate: new Date().valueOf(),
				cid: secondConv.id
			});

			await act(async () => {
				await handleNotifyMessagesCreated([newMessage]);
			});
			expect(result.current.conversationIndexSlice.conversationListIndex).toEqual([
				secondConv.id,
				firstConv.id
			]);
		});
	});

	describe('getOrderedMessagesForConversation', () => {
		it('should not duplicate messages', async () => {
			await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: { id: '123' },
					messageIds: ['2']
				})
			);

			const newMessage = { ...generateMessage({ id: '2' }), conversation: '123' };
			handleNotifyMessagesCreated([newMessage]);
			const { result } = renderHook(() =>
				useCompleteConversationOrFetch({ conversationId: '123' })
			);
			await waitFor(async () => {
				expect(result.current.conversation.messageIds).toEqual(['2']);
			});
		});

		it('should return messages in descending order when sortOrder is dateDesc', async () => {
			getUserSettings.mockReturnValue({
				attrs: {},
				props: [],
				prefs: { zimbraPrefConversationOrder: 'dateDesc' }
			});
			const message = generateMessage({ id: '1' });
			setConversationsInEmailStore(
				[generateConversation({ id: '123', messageIds: [message.id] })],
				false
			);
			const newMessage = { ...generateMessage({ id: '2' }), conversation: '123' };
			handleNotifyMessagesCreated([newMessage]);
			const { result } = renderHook(() => useConversationById('123'));
			await waitFor(async () => {
				expect(result.current.messageIds).toEqual(['2', '1']);
			});
		});

		it('should return messages in ascending order when sortOrder is not dateDesc', async () => {
			getUserSettings.mockReturnValue({
				attrs: {},
				props: [],
				prefs: { zimbraPrefConversationOrder: 'dateAsc' }
			});

			const message = generateMessage({ id: '1' });
			setConversationsInEmailStore(
				[generateConversation({ id: '123', messageIds: [message.id] })],
				false
			);
			const newMessage = { ...generateMessage({ id: '2' }), conversation: '123' };
			handleNotifyMessagesCreated([newMessage]);
			const { result } = renderHook(() => useConversationById('123'));
			await waitFor(async () => {
				const messagesIds = result.current.messageIds;
				expect(messagesIds).toEqual(expect.arrayContaining(['1', '2']));
			});
		});
	});
});

describe('triggerNotification', () => {
	it('multipleNotify is not called if IS_FOCUS_MODE is true', () => {
		const mockedMultipleNotify = vi.fn();
		vi.mocked(shell).IS_FOCUS_MODE = true;
		getNotificationManager.mockImplementation(() => ({
			multipleNotify: mockedMultipleNotify
		}));
		triggerNotification([generateMessage({ id: 'id-1' })], vi.fn());
		expect(mockedMultipleNotify).not.toHaveBeenCalled();
	});

	it('multipleNotify is called if IS_FOCUS_MODE is false', () => {
		const mockedMultipleNotify = vi.fn();
		vi.mocked(shell).IS_FOCUS_MODE = false;
		getNotificationManager.mockImplementation(() => ({
			multipleNotify: mockedMultipleNotify
		}));
		triggerNotification([generateMessage({ id: 'id-1' })], vi.fn());
		expect(mockedMultipleNotify).toHaveBeenCalled();
	});
});
