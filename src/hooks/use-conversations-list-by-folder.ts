/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';

import { parseMessageSortingOptions } from '../helpers/parseMessageSortingOptions';
import { API_REQUEST_STATUS, LIST_LIMIT } from 'constants/index';
import { getFilterQuery } from 'helpers/sorting';
import { searchEmailStoreAction } from 'store/emails/actions/search-action';
import {
	updateConversationsResultsLoadingStatus,
	useConversationIndexSlice,
	useConversationsIdsByFolder
} from 'store/emails/store';
import { ConversationIndexSliceState } from 'types/search';
import { SortBy } from 'types/sorting';

/**
 * Manages the state and logic for retrieving and maintaining a list of conversation indices
 * for a specific folder. Fetches conversations via `searchSoapApi` on folder change.
 */
export const useConversationListByFolder = (folderId: string): ConversationIndexSliceState => {
	const { prefs } = useUserSettings();
	const prefLocale = useMemo(() => prefs.zimbraPrefLocale, [prefs.zimbraPrefLocale]);

	const previousFolderId = useRef<string | null>(null);

	const conversationIndexSlice = useConversationIndexSlice();
	const conversationListIndexByFolder = useConversationsIdsByFolder(folderId);
	const prefSortOrder = useMemo(
		() => prefs?.zimbraPrefSortOrder,
		[prefs?.zimbraPrefSortOrder]
	) as string;
	const { sortType, sortDirection, filterType } = useMemo(
		() => parseMessageSortingOptions(folderId, prefSortOrder),
		[folderId, prefSortOrder]
	);
	const sortBy = useMemo<SortBy>(() => `${sortType}${sortDirection}`, [sortType, sortDirection]);

	const fetchConversations = useCallback(
		async (signal: AbortSignal | undefined) => {
			updateConversationsResultsLoadingStatus(API_REQUEST_STATUS.pending);
			searchEmailStoreAction({
				limit: LIST_LIMIT.INITIAL_LIMIT,
				sortBy,
				query: getFilterQuery(filterType, folderId),
				types: 'conversation',
				offset: 0,
				abortSignal: signal,
				locale: prefLocale
			})
				.catch(() => {
					updateConversationsResultsLoadingStatus(API_REQUEST_STATUS.error);
				})
				.finally(() => {
					updateConversationsResultsLoadingStatus(API_REQUEST_STATUS.fulfilled);
				});
		},
		[filterType, folderId, prefLocale, sortBy]
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
				conversationListIndex: conversationListIndexByFolder
			}
		}),
		[conversationIndexSlice, conversationListIndexByFolder]
	);
};
