/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { type ErrorSoapBodyResponse, useUserSettings } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { searchSoapApi } from '../api/search';
import { getTags } from '../carbonio-ui-commons/store/zustand/tags';
import { Tags } from '../carbonio-ui-commons/types/tags';
import { API_REQUEST_STATUS, LIST_LIMIT } from '../constants';
import { normalizeMailMessageFromSoap } from '../normalizations/normalize-message';
import {
	resetMessagesAndPopulatedItems,
	setMessagesInEmailStore,
	updateMessagesResultsLoadingStatus,
	useMessagesIdsByFolder,
	useMessagesSlice
} from '../store/zustand/emails/store';
import { Folder, MessageSliceState, SearchResponse } from '../types';

export const useMessageListByFolder = (folder: Folder): MessageSliceState => {
	const settings = useUserSettings();
	const prefLocale = useMemo(
		() => settings.prefs.zimbraPrefLocale,
		[settings.prefs.zimbraPrefLocale]
	);

	const previousFolderId = useRef<string>('');

	const messagesSlice = useMessagesSlice();
	const messagesIds = useMessagesIdsByFolder(folder);

	function handleFulFilledMessagesResultsInEmailStore({
		searchResponse
	}: {
		searchResponse: SearchResponse;
		tags: Tags;
	}): void {
		const normalizedMessages = map(searchResponse.m, (msg) =>
			normalizeMailMessageFromSoap(msg, false)
		);

		setMessagesInEmailStore(normalizedMessages, searchResponse.more);
	}

	const handleMessageResults = useCallback(
		({ searchResponse }: { searchResponse: SearchResponse | ErrorSoapBodyResponse }): void => {
			if ('Fault' in searchResponse) {
				updateMessagesResultsLoadingStatus(API_REQUEST_STATUS.error);
				return;
			}
			const tags = getTags();

			if (searchResponse.m) {
				handleFulFilledMessagesResultsInEmailStore({ searchResponse, tags });
			}
			if (searchResponse && !searchResponse.m) {
				resetMessagesAndPopulatedItems();
				updateMessagesResultsLoadingStatus(API_REQUEST_STATUS.fulfilled);
			}
		},
		[]
	);

	const firstSearchCallback = useCallback(
		async (abortSignal: AbortSignal | undefined) => {
			updateMessagesResultsLoadingStatus(API_REQUEST_STATUS.pending);
			const searchResponse = await searchSoapApi({
				folderId: folder.id,
				limit: LIST_LIMIT.INITIAL_LIMIT,
				types: 'message',
				offset: 0,
				recip: '0',
				locale: prefLocale,
				abortSignal
			});
			if (
				'Fault' in searchResponse &&
				searchResponse?.Fault?.Detail?.Error?.Code === 'mail.QUERY_PARSE_ERROR'
			) {
				updateMessagesResultsLoadingStatus(API_REQUEST_STATUS.error);
			} else {
				handleMessageResults({ searchResponse });
			}
		},
		[folder.id, handleMessageResults, prefLocale]
	);

	useEffect(() => {
		const controller = new AbortController();
		const { signal } = controller;
		if (previousFolderId.current !== folder.id) {
			previousFolderId.current = folder.id;
			firstSearchCallback(signal);
		}
		return () => {
			previousFolderId.current = '';
			controller.abort();
		};
	}, [firstSearchCallback, folder.id]);

	return { messagesSlice: { ...messagesSlice, messageIds: messagesIds } };
};
