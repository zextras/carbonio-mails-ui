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
import { useEventSubscribe } from 'event-bus/use-event-subscribe';
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
	getListIndex: () => Array<string>;
	// the items the list shows, including the pages loaded by scrolling
	shownListLength: number;
};

/**
 * Searches the messages or conversations of a folder when the folder (or the sorting) changes,
 * and repeats the search when the mailbox is refreshed. Each search aborts the one in progress.
 */
export const useFolderListSearch = ({
	folderId,
	types,
	updateLoadingStatus,
	getListIndex,
	shownListLength
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
	const isLoadingRef = useRef(false);
	// read when the mailbox is refreshed, without searching again when it changes
	const shownListLengthRef = useRef(shownListLength);
	shownListLengthRef.current = shownListLength;

	const search = useCallback(
		(isRefresh: boolean): void => {
			controllerRef.current?.abort();
			const controller = new AbortController();
			controllerRef.current = controller;
			const query = getFilterQuery(filterType, folderId);

			// a refresh received while the folder is still loading repeats the loading search instead
			if (isRefresh && !isLoadingRef.current) {
				// the pages loaded by scrolling are searched again too, and a failed refresh leaves the list as it is
				refreshSearchEmailStoreAction({
					searchedListIndex: getListIndex(),
					limit: Math.max(LIST_LIMIT.INITIAL_LIMIT, shownListLengthRef.current),
					sortBy,
					query,
					types,
					abortSignal: controller.signal,
					locale: prefLocale
				}).catch(noop);
				return;
			}

			isLoadingRef.current = true;
			updateLoadingStatus(API_REQUEST_STATUS.pending);
			searchEmailStoreAction({
				limit: LIST_LIMIT.INITIAL_LIMIT,
				sortBy,
				query,
				types,
				offset: 0,
				abortSignal: controller.signal,
				locale: prefLocale
			})
				.catch(() => {
					if (!controller.signal.aborted) {
						updateLoadingStatus(API_REQUEST_STATUS.error);
					}
				})
				.finally(() => {
					// the status of an aborted search is left to the search that replaced it
					if (!controller.signal.aborted) {
						isLoadingRef.current = false;
						updateLoadingStatus(API_REQUEST_STATUS.fulfilled);
					}
				});
		},
		[filterType, folderId, getListIndex, prefLocale, sortBy, types, updateLoadingStatus]
	);

	useEffect(() => {
		search(false);
		return () => {
			controllerRef.current?.abort();
			controllerRef.current = undefined;
		};
	}, [search]);

	const subscribeBusEvent = useEventSubscribe();

	useEffect(
		() =>
			subscribeBusEvent(MailboxRefreshedEvent.EventName, () => {
				search(true);
			}),
		[search, subscribeBusEvent]
	);
};
