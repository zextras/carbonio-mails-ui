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
 *
 * Manages the state and logic for retrieving and maintaining a list of conversation indices
 * for a specific folder. Fetches conversations via `searchSoapApi` on folder change.
 *
 */
export const useConversationListByFolder = (folderId: string): ConversationIndexSliceState => {
	const settings = useUserSettings();
	const prefLocale = useMemo(
		() => settings.prefs.zimbraPrefLocale,
		[settings.prefs.zimbraPrefLocale]
	);

	const previousFolderId = useRef<string>('');

	const conversationIndexSlice = useConversationIndexSlice();
	const conversationsIds = useConversationsIdsByFolder(folderId);

	const firstSearchCallback = useCallback(
		async (abortSignal: AbortSignal | undefined) => {
			updateConversationsResultsLoadingStatus(API_REQUEST_STATUS.pending);
			const searchResponse = await searchSoapApi({
				folderId,
				limit: LIST_LIMIT.INITIAL_LIMIT,
				types: 'conversation',
				offset: 0,
				recip: '0',
				locale: prefLocale,
				abortSignal
			});
			handleSearchSoapApiResults({ searchResponse });
		},
		[folderId, prefLocale]
	);

	useEffect(() => {
		const controller = new AbortController();
		const { signal } = controller;
		if (previousFolderId.current !== folderId) {
			previousFolderId.current = folderId;
			firstSearchCallback(signal);
		}
		return () => {
			previousFolderId.current = '';
			controller.abort();
		};
	}, [firstSearchCallback, folderId]);

	return {
		conversationIndexSlice: { ...conversationIndexSlice, conversationListIndex: conversationsIds }
	};
};
