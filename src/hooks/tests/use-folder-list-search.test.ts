/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from 'react';

import { renderHook, waitFor } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import {
	generateConvMessageFromAPI,
	generateConversationFromAPI,
	generateMessageFromAPI,
	toSearchConversationHit
} from '__test__/generators/api';
import { generateMessage } from '__test__/generators/generateMessage';
import * as searchApi from 'api/search-soap-api';
import { API_REQUEST_STATUS } from 'constants/index';
import { MailboxRefreshedEvent } from 'event-bus/events/mailbox-refreshed';
import { useFolderListSearch } from 'hooks/use-folder-list-search';
import { recordNotifiedItems } from 'store/emails/notified-items';
import {
	getConversationListIndex,
	getMessageListIndex,
	handleNotifyDeleted,
	handleNotifyMessagesModified,
	updateConversationsResultsLoadingStatus,
	updateMessages,
	updateMessagesResultsLoadingStatus,
	useConversationIndexSlice,
	useMessageById,
	useMessageIndexSlice
} from 'store/emails/store';
import { MailMessage } from 'types/messages';
import { SearchRequest, SearchResponse } from 'types/soap/search';

const FOLDER_ID = FOLDERS.INBOX;

function renderMessageListSearch(
	updateLoadingStatus = updateMessagesResultsLoadingStatus
): ReturnType<typeof renderHook<void, { shownListLength: number }>> {
	return renderHook(
		({ shownListLength }) =>
			useFolderListSearch({
				folderId: FOLDER_ID,
				types: 'message',
				updateLoadingStatus,
				getListIndex: getMessageListIndex,
				shownListLength
			}),
		{ initialProps: { shownListLength: 0 } }
	);
}

function refreshMailbox(): void {
	act(() => {
		window.dispatchEvent(new MailboxRefreshedEvent());
	});
}

describe('useFolderListSearch', () => {
	describe('on mailbox refresh', () => {
		it('should replace the message list and keep the open message as it is shown', async () => {
			const firstSearch = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				m: [generateMessageFromAPI({ id: '1', l: FOLDER_ID })],
				more: false
			});
			renderMessageListSearch();
			await act(async () => {
				await firstSearch;
			});
			const openMessage: MailMessage = {
				...generateMessage({ id: '1', folderId: FOLDER_ID, isComplete: true }),
				messageIsFromExternalDomain: true
			};
			await act(async () => {
				updateMessages([openMessage]);
			});

			const refreshSearch = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				m: [
					generateMessageFromAPI({ id: '2', l: FOLDER_ID }),
					generateMessageFromAPI({ id: '1', l: FOLDER_ID })
				],
				more: false
			});
			refreshMailbox();

			expect(await refreshSearch).toEqual(
				expect.objectContaining({ limit: 100, offset: 0, types: 'message' })
			);
			const { result: index } = renderHook(() => useMessageIndexSlice());
			await waitFor(() => {
				expect(index.current.messageListIndex).toEqual(['2', '1']);
			});
			const { result: message } = renderHook(() => useMessageById('1'));
			expect(message.current).toEqual(
				expect.objectContaining({
					isComplete: true,
					body: openMessage.body,
					messageIsFromExternalDomain: true
				})
			);
		});

		it('should replace the conversation list', async () => {
			const firstSearch = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [
					toSearchConversationHit(
						generateConversationFromAPI({ id: '10', m: [generateConvMessageFromAPI({ id: '1' })] })
					)
				],
				more: false
			});
			renderHook(() =>
				useFolderListSearch({
					folderId: FOLDER_ID,
					types: 'conversation',
					updateLoadingStatus: updateConversationsResultsLoadingStatus,
					getListIndex: getConversationListIndex,
					shownListLength: 1
				})
			);
			await act(async () => {
				await firstSearch;
			});

			const refreshSearch = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [
					toSearchConversationHit(
						generateConversationFromAPI({ id: '20', m: [generateConvMessageFromAPI({ id: '2' })] })
					),
					toSearchConversationHit(
						generateConversationFromAPI({ id: '10', m: [generateConvMessageFromAPI({ id: '1' })] })
					)
				],
				more: true
			});
			refreshMailbox();

			expect(await refreshSearch).toEqual(expect.objectContaining({ types: 'conversation' }));
			const { result: index } = renderHook(() => useConversationIndexSlice());
			await waitFor(() => {
				expect(index.current.conversationListIndex).toEqual(['20', '10']);
			});
			expect(index.current.more).toBe(true);
		});

		it('should search again the pages loaded by scrolling', async () => {
			const firstSearch = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				more: true
			});
			const { rerender } = renderMessageListSearch();
			await act(async () => {
				await firstSearch;
			});
			// the list shows 150 messages after loading a page by scrolling
			rerender({ shownListLength: 150 });

			const refreshSearch = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				more: false
			});
			refreshMailbox();

			expect(await refreshSearch).toEqual(expect.objectContaining({ limit: 150, offset: 0 }));
		});

		it('should remove the flags and the tags removed from a message meanwhile', async () => {
			const firstSearch = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				m: [generateMessageFromAPI({ id: '1', l: FOLDER_ID, f: 'f', t: '5', tn: 'work' })],
				more: false
			});
			renderMessageListSearch();
			await act(async () => {
				await firstSearch;
			});
			const { result: message } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(message.current).toEqual(expect.objectContaining({ flagged: true, tags: ['5'] }));
			});

			// the server leaves out the flags and the tags of a message which has none
			const refreshSearch = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				m: [generateMessageFromAPI({ id: '1', l: FOLDER_ID })],
				more: false
			});
			refreshMailbox();
			await act(async () => {
				await refreshSearch;
			});

			await waitFor(() => {
				expect(message.current).toEqual(expect.objectContaining({ flagged: false, tags: [] }));
			});
		});

		it('should keep what is notified while the list is searched again', async () => {
			const firstSearch = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				m: [
					generateMessageFromAPI({ id: '1', l: FOLDER_ID, f: 'u' }),
					generateMessageFromAPI({ id: '2', l: FOLDER_ID, f: 'u' })
				],
				more: false
			});
			renderMessageListSearch();
			await act(async () => {
				await firstSearch;
			});
			let resolveRefreshSearch: ((response: SearchResponse) => void) | undefined;
			vi.spyOn(searchApi, 'searchSoapApi').mockImplementationOnce(
				() =>
					new Promise<SearchResponse>((resolve) => {
						resolveRefreshSearch = resolve;
					})
			);
			refreshMailbox();

			// while the list is searched again, message 1 is deleted and message 2 is read
			await act(async () => {
				recordNotifiedItems({ deletedIds: ['1'], changedIds: ['2'] });
				handleNotifyDeleted(['1']);
				handleNotifyMessagesModified([{ id: '2', read: true }]);
			});
			// the search ran before those changes
			await act(async () => {
				resolveRefreshSearch?.({
					m: [
						generateMessageFromAPI({ id: '1', l: FOLDER_ID, f: 'u' }),
						generateMessageFromAPI({ id: '2', l: FOLDER_ID, f: 'u' })
					],
					more: false
				});
			});

			const { result: index } = renderHook(() => useMessageIndexSlice());
			await waitFor(() => {
				expect(index.current.messageListIndex).toEqual(['2']);
			});
			const { result: deletedMessage } = renderHook(() => useMessageById('1'));
			expect(deletedMessage.current).toBeUndefined();
			const { result: readMessage } = renderHook(() => useMessageById('2'));
			expect(readMessage.current).toEqual(expect.objectContaining({ read: true }));
		});

		it('should load the folder again when the refresh is received while the folder is loading', async () => {
			let resolveFirstSearch: ((response: SearchResponse) => void) | undefined;
			const searchSpy = vi
				.spyOn(searchApi, 'searchSoapApi')
				.mockImplementationOnce(
					() =>
						new Promise<SearchResponse>((resolve) => {
							resolveFirstSearch = resolve;
						})
				)
				.mockResolvedValueOnce({
					m: [generateMessageFromAPI({ id: '2', l: FOLDER_ID })],
					more: false
				});
			const updateLoadingStatus = vi.fn(updateMessagesResultsLoadingStatus);
			renderMessageListSearch(updateLoadingStatus);

			refreshMailbox();

			await waitFor(() => {
				expect(updateLoadingStatus).toHaveBeenLastCalledWith(API_REQUEST_STATUS.fulfilled);
			});
			expect(searchSpy).toHaveBeenCalledTimes(2);
			expect(updateLoadingStatus.mock.calls).toEqual([
				[API_REQUEST_STATUS.pending],
				[API_REQUEST_STATUS.pending],
				[API_REQUEST_STATUS.fulfilled]
			]);

			// the search replaced by the refresh changes neither the status nor the list
			await act(async () => {
				resolveFirstSearch?.({
					m: [generateMessageFromAPI({ id: '1', l: FOLDER_ID })],
					more: false
				});
			});
			expect(updateLoadingStatus).toHaveBeenCalledTimes(3);
			const { result: index } = renderHook(() => useMessageIndexSlice());
			expect(index.current.messageListIndex).toEqual(['2']);
		});
	});
});
