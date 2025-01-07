/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';

import { searchSoapApi } from '../api/search';
import { API_REQUEST_STATUS, LIST_LIMIT } from '../constants';
import { handleSearchSoapApiResults } from '../store/zustand/emails/hooks/hooks';
import {
	updateMessagesResultsLoadingStatus,
	useMessagesIdsByFolder,
	useMessagesSlice
} from '../store/zustand/emails/store';
import { MessageIndexSliceState } from '../types';

export const useFetchMessagesByFolder = (folderId: string): MessageIndexSliceState => {

	const { prefs } = useUserSettings();
	const prefLocale = useMemo(() => prefs.zimbraPrefLocale, [prefs.zimbraPrefLocale]);

	const previousFolderId = useRef<string | null>(null);

	const messagesSlice = useMessagesSlice();
	const messageListIndex = useMessagesIdsByFolder(folderId);

	const fetchMessages = useCallback(
		async (signal: AbortSignal | undefined) => {
			try {
				updateMessagesResultsLoadingStatus(API_REQUEST_STATUS.pending);

				const searchResponse = await searchSoapApi({
					folderId,
					limit: LIST_LIMIT.INITIAL_LIMIT,
					types: 'message',
					offset: 0,
					recip: '0',
					locale: prefLocale,
					abortSignal: signal
				});

				handleSearchSoapApiResults({ searchResponse });
			} catch (error) {
				if (signal?.aborted) {
					console.log('API call aborted');
				} else {
					console.error('Error fetching messages:', error);
				}
				updateMessagesResultsLoadingStatus(API_REQUEST_STATUS.error);
			} finally {
				updateMessagesResultsLoadingStatus(API_REQUEST_STATUS.fulfilled);
			}
		},
		[folderId, prefLocale]
	);

	useEffect(() => {
		const controller = new AbortController();
		const { signal } = controller;

		if (previousFolderId.current !== folderId) {
			previousFolderId.current = folderId;
			fetchMessages(signal);
		}

		return () => {
			controller.abort();
			previousFolderId.current = null;
		};
	}, [fetchMessages, folderId]);

	return useMemo(
		() => ({
			messageIndexSlice: {
				...messagesSlice,
				messageListIndex
			}
		}),
		[messagesSlice, messageListIndex]
	);
};
