/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useMemo } from 'react';

import { type ErrorSoapBodyResponse, useUserSettings } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import { useParams } from 'react-router-dom';

import { searchSoapApi } from '../api/search';
import { getTags } from '../carbonio-ui-commons/store/zustand/tags';
import { Tags } from '../carbonio-ui-commons/types/tags';
import { API_REQUEST_STATUS, LIST_LIMIT } from '../constants';
import { normalizeMailMessageFromSoap } from '../normalizations/normalize-message';
import {
	resetMessagesAndPopulatedItems,
	setMessagesInEmailStore,
	updateMessagesResultsLoadingStatus,
	useMessagesSlice
} from '../store/zustand/emails/store';
import { MessageSliceState, SearchResponse } from '../types';

export const useMessageList = (): MessageSliceState => {
	const { folderId } = useParams<{ folderId: string }>();

	const settings = useUserSettings();
	const prefLocale = useMemo(
		() => settings.prefs.zimbraPrefLocale,
		[settings.prefs.zimbraPrefLocale]
	);

	const messagesSlice = useMessagesSlice();

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
				folderId,
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
		[folderId, handleMessageResults, prefLocale]
	);

	useEffect(() => {
		const controller = new AbortController();
		const { signal } = controller;
		// TODO CO-1725: previousQuery is not defined
		if (true) {
			firstSearchCallback(signal);
		}
		return () => {
			controller.abort();
		};
	}, [firstSearchCallback]);

	return { messagesSlice };
};
