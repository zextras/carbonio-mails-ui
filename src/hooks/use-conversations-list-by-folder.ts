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
import { ConversationsIndexSliceState, Folder } from '../types';

export const useConversationListByFolder = (folder: Folder): ConversationsIndexSliceState => {
	const settings = useUserSettings();
	const prefLocale = useMemo(
		() => settings.prefs.zimbraPrefLocale,
		[settings.prefs.zimbraPrefLocale]
	);

	const previousFolderId = useRef<string>('');

	const conversationsIndexSlice = useConversationIndexSlice();
	const conversationsIds = useConversationsIdsByFolder(folder);

	const firstSearchCallback = useCallback(
		async (abortSignal: AbortSignal | undefined) => {
			updateConversationsResultsLoadingStatus(API_REQUEST_STATUS.pending);
			const searchResponse = await searchSoapApi({
				folderId: folder.id,
				limit: LIST_LIMIT.INITIAL_LIMIT,
				types: 'conversation',
				offset: 0,
				recip: '0',
				locale: prefLocale,
				abortSignal
			});
			handleSearchSoapApiResults({ searchResponse });
		},
		[folder.id, prefLocale]
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

	return { conversationsIndexSlice: { ...conversationsIndexSlice, conversationsIds } };
};
