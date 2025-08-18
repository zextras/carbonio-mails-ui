/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';

import { API_REQUEST_STATUS, LIST_LIMIT } from 'constants/index';
import { getFilterQuery, parseMessageSortingOptions } from 'helpers/sorting';
import { searchEmailStoreAction } from 'store/emails/actions/search-action';
import {
	updateMessagesResultsLoadingStatus,
	useMessageIndexSlice,
	useMessagesIdsByFolder
} from 'store/emails/store';
import { MessageIndexSliceState } from 'types/index.d';

export const useFetchMessagesByFolder = (folderId: string): MessageIndexSliceState => {
	const { prefs } = useUserSettings();
	const prefLocale = useMemo(() => prefs.zimbraPrefLocale, [prefs.zimbraPrefLocale]);

	const previousFolderId = useRef<string | null>(null);

	const messageIndexSlice = useMessageIndexSlice();
	const messageListIndex = useMessagesIdsByFolder(folderId);
	const prefSortOrder = useMemo(
		() => prefs?.zimbraPrefSortOrder,
		[prefs?.zimbraPrefSortOrder]
	) as string;
	const { sortType, sortDirection, filterType } = useMemo(
		() => parseMessageSortingOptions(folderId, prefSortOrder),
		[folderId, prefSortOrder]
	);
	const sortBy = useMemo(() => `${sortType}${sortDirection}`, [sortType, sortDirection]);

	const fetchMessages = useCallback(
		async (signal: AbortSignal | undefined) => {
			updateMessagesResultsLoadingStatus(API_REQUEST_STATUS.pending);
			searchEmailStoreAction({
				limit: LIST_LIMIT.INITIAL_LIMIT,
				sortBy,
				query: getFilterQuery(filterType, folderId),
				offset: 0,
				abortSignal: signal,
				locale: prefLocale,
				types: 'message'
			})
				.catch(() => {
					updateMessagesResultsLoadingStatus(API_REQUEST_STATUS.error);
				})
				.finally(() => {
					updateMessagesResultsLoadingStatus(API_REQUEST_STATUS.fulfilled);
				});
		},
		[filterType, folderId, prefLocale, sortBy]
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
				...messageIndexSlice,
				messageListIndex
			}
		}),
		[messageIndexSlice, messageListIndex]
	);
};
