/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';

import { parseMessageSortingOptions } from '../helpers/parseMessageSortingOptions';
import { API_REQUEST_STATUS, LIST_LIMIT } from 'constants/index';
import { MailboxRefreshedEvent } from 'event-bus/events/mailbox-refreshed';
import { getFilterQuery } from 'helpers/sorting';
import {
	refreshSearchEmailStoreAction,
	searchEmailStoreAction
} from 'store/emails/actions/search-action';
import { SearchRequestStatus } from 'types/search';
import { SortBy } from 'types/sorting';

type UseFolderListSearchParams = {
	folderId: string;
	types: 'message' | 'conversation';
	updateLoadingStatus: (status: SearchRequestStatus) => void;
};

/**
 * Searches the messages or conversations of a folder when the folder (or the sorting) changes,
 * and repeats the search when the mailbox is refreshed. Each search aborts the one in progress,
 * so a refresh received while the folder is loading replaces its search.
 */
export const useFolderListSearch = ({
	folderId,
	types,
	updateLoadingStatus
}: UseFolderListSearchParams): void => {
	const { prefs } = useUserSettings();
	const prefLocale = useMemo(() => prefs.zimbraPrefLocale, [prefs.zimbraPrefLocale]);
	const prefSortOrder = useMemo(
		() => prefs?.zimbraPrefSortOrder,
		[prefs?.zimbraPrefSortOrder]
	) as string;
	const { sortType, sortDirection, filterType } = useMemo(
		() => parseMessageSortingOptions(folderId, prefSortOrder),
		[folderId, prefSortOrder]
	);
	const sortBy = useMemo<SortBy>(() => `${sortType}${sortDirection}`, [sortType, sortDirection]);

	const controllerRef = useRef<AbortController>();

	const search = useCallback(
		(isRefresh: boolean): void => {
			controllerRef.current?.abort();
			const controller = new AbortController();
			controllerRef.current = controller;
			const params = {
				limit: LIST_LIMIT.INITIAL_LIMIT,
				sortBy,
				query: getFilterQuery(filterType, folderId),
				types,
				abortSignal: controller.signal,
				locale: prefLocale
			};

			if (isRefresh) {
				// the list is replaced without resetting the open item, and a failed refresh leaves it as it is
				refreshSearchEmailStoreAction(params).catch(noop);
				return;
			}

			updateLoadingStatus(API_REQUEST_STATUS.pending);
			searchEmailStoreAction({ ...params, offset: 0 })
				.catch(() => {
					if (!controller.signal.aborted) {
						updateLoadingStatus(API_REQUEST_STATUS.error);
					}
				})
				.finally(() => {
					updateLoadingStatus(API_REQUEST_STATUS.fulfilled);
				});
		},
		[filterType, folderId, prefLocale, sortBy, types, updateLoadingStatus]
	);

	useEffect(() => {
		search(false);
		return () => {
			controllerRef.current?.abort();
		};
	}, [search]);

	useEffect(() => {
		const handler = (): void => {
			search(true);
		};

		window.addEventListener(MailboxRefreshedEvent.EventName, handler);
		return () => {
			window.removeEventListener(MailboxRefreshedEvent.EventName, handler);
		};
	}, [search]);
};
