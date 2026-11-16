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
import {
	getConversationListIndex,
	getMessageListIndex,
	setMessagesInEmailStore,
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
): ReturnType<typeof renderHook> {
	return renderHook(() =>
		useFolderListSearch({
			folderId: FOLDER_ID,
			types: 'message',
			updateLoadingStatus,
			getListIndex: getMessageListIndex
		})
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
					getListIndex: getConversationListIndex
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
			renderMessageListSearch();
			await act(async () => {
				await firstSearch;
			});
			const loadedMessages = Array.from({ length: 150 }, (_, index) =>
				generateMessage({ id: `${index}`, folderId: FOLDER_ID })
			);
			await act(async () => {
				setMessagesInEmailStore(loadedMessages, true);
			});

			const refreshSearch = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				more: false
			});
			refreshMailbox();

			expect(await refreshSearch).toEqual(expect.objectContaining({ limit: 150, offset: 0 }));
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
