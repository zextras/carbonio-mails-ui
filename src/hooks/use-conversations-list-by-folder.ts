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
	updateConversationsResultsLoadingStatus,
	useConversationIndexSlice,
	useConversationsIdsByFolder
} from '../store/zustand/emails/store';
import { ConversationIndexSliceState } from '../types';

/**
 * Manages the state and logic for retrieving and maintaining a list of conversation indices
 * for a specific folder. Fetches conversations via `searchSoapApi` on folder change.
 */
export const useConversationListByFolder = (folderId: string): ConversationIndexSliceState => {
	const { prefs } = useUserSettings();
	const prefLocale = useMemo(() => prefs.zimbraPrefLocale, [prefs.zimbraPrefLocale]);

	const previousFolderId = useRef<string | null>(null);

	const conversationIndexSlice = useConversationIndexSlice();
	const conversationListIndex = useConversationsIdsByFolder(folderId);

	const fetchConversations = useCallback(
		async (signal: AbortSignal | undefined) => {
			try {
				updateConversationsResultsLoadingStatus(API_REQUEST_STATUS.pending);

				const searchResponse = await searchSoapApi({
					folderId,
					limit: LIST_LIMIT.INITIAL_LIMIT,
					types: 'conversation',
					offset: 0,
					recip: '0',
					locale: prefLocale,
					abortSignal: signal
				});

				handleSearchSoapApiResults({ searchResponse });
			} catch (error) {
				updateConversationsResultsLoadingStatus(API_REQUEST_STATUS.error);
			} finally {
				updateConversationsResultsLoadingStatus(API_REQUEST_STATUS.fulfilled);
			}
		},
		[folderId, prefLocale]
	);

	useEffect(() => {
		const controller = new AbortController();
		const { signal } = controller;

		if (previousFolderId.current !== folderId) {
			previousFolderId.current = folderId;
			fetchConversations(signal);
		}

		return () => {
			controller.abort();
			previousFolderId.current = null;
		};
	}, [fetchConversations, folderId]);

	return useMemo(
		() => ({
			conversationIndexSlice: {
				...conversationIndexSlice,
				conversationListIndex
			}
		}),
		[conversationIndexSlice, conversationListIndex]
	);
};
