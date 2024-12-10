/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { type ErrorSoapBodyResponse, useUserSettings } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import { useParams } from 'react-router-dom';

import { searchSoapApi } from '../api/search';
import { getFolder } from '../carbonio-ui-commons/store/zustand/folder/hooks';
import { getTags } from '../carbonio-ui-commons/store/zustand/tags';
import { Tags } from '../carbonio-ui-commons/types/tags';
import { API_REQUEST_STATUS, LIST_LIMIT } from '../constants';
import { parseMessageSortingOptions } from '../helpers/sorting';
import { normalizeMailMessageFromSoap } from '../normalizations/normalize-message';
import {
	resetMessagesAndPopulatedItems,
	setMessagesInEmailStore,
	updateMessagesResultsLoadingStatus,
	useMessages
} from '../store/zustand/emails/store';
import { MessageSliceState, SearchResponse } from '../types';

type RouteParams = {
	folderId: string;
};

export const useMessageList = (): MessageSliceState => {
	const { folderId } = <RouteParams>useParams();
	const { prefs: userSettings } = useUserSettings();
	const { sortOrder } = parseMessageSortingOptions(
		folderId,
		userSettings.zimbraPrefSortOrder as string
	);

	const messages = useMessages();
	const folder = getFolder(folderId);

	// const filteredMessages = useMemo(() => {
	//
	// 	if (folder) {
	// 		const wantedFolderId =
	// 			'rid' in folder && folder?.rid ? `${folder.zid}:${folder.rid}` : folder.id;
	// 		messages.messageIds.forEach((id) => {
	// 			if (id === wantedFolderId) {
	// 				messageSet.add(id);
	// 			}
	// 		});
	// 	}
	// 	return messageSet;
	// }, [folder, messages]);

	const queryPart = [`inId:"${folderId}"`];

	let finalsortBy = sortOrder;
	switch (sortOrder) {
		case 'readAsc':
			queryPart.push('is:unread');
			finalsortBy = 'dateAsc';
			break;
		case 'readDesc':
			queryPart.push('is:unread');
			finalsortBy = 'dateDesc';
			break;
		case 'priorityAsc':
		case 'priorityDesc':
			queryPart.push('priority:high');
			break;
		case 'flagAsc':
		case 'flagDesc':
			queryPart.push('is:flagged');
			break;
		case 'attachAsc':
		case 'attachDesc':
			queryPart.push('has:attachment');
			break;
		default:
			break;
	}
	const settings = useUserSettings();

	const prefLocale = useMemo(
		() => settings.prefs.zimbraPrefLocale,
		[settings.prefs.zimbraPrefLocale]
	);

	let finalQuery = '';

	if (folderId) {
		finalQuery = queryPart.join(' ');
	}

	const previousQuery = useRef(finalQuery);

	function handleFulFilledMessagesResultsInEmailStore({
		searchResponse,
		tags
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
				query: finalQuery,
				limit: LIST_LIMIT.INITIAL_LIMIT,
				sortBy: finalsortBy,
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
		[finalQuery, finalsortBy, handleMessageResults, prefLocale]
	);

	useEffect(() => {
		const controller = new AbortController();
		const { signal } = controller;
		if (finalQuery.length > 0) {
			firstSearchCallback(signal);
			previousQuery.current = finalQuery;
		}
		return () => {
			controller.abort();
			previousQuery.current = finalQuery;
		};
	}, [finalQuery, firstSearchCallback]);

	return { messages };
};
