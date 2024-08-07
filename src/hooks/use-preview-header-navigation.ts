/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useMemo } from 'react';

import { replaceHistory, useUserSettings } from '@zextras/carbonio-shell-ui';
import { findIndex } from 'lodash';
import { useTranslation } from 'react-i18next';

import { useAppDispatch } from './redux';
import { LIST_LIMIT, SEARCHED_FOLDER_STATE_STATUS } from '../constants';
import { parseMessageSortingOptions } from '../helpers/sorting';
import { search } from '../store/actions';
import { setMsgRead } from '../ui-actions/message-actions';

export type HeaderNavigationActionItem = {
	tooltipLabel: string | undefined;
	disabled: boolean;
	action: () => void;
	icon: string;
};

export type PreviewHeaderNavigationActions = {
	nextActionItem: HeaderNavigationActionItem;
	previousActionItem: HeaderNavigationActionItem;
};

export const usePreviewHeaderNavigation = ({
	items,
	folderId,
	currentItemId,
	types,
	searchedInFolderStatus
}: {
	items: Array<{ id: string; read: boolean | string }>;
	folderId: string;
	currentItemId: string;
	types: string;
	searchedInFolderStatus: string | undefined;
}): PreviewHeaderNavigationActions => {
	const dispatch = useAppDispatch();
	const [t] = useTranslation();
	const settings = useUserSettings();
	const zimbraPrefMarkMsgRead = settings?.prefs?.zimbraPrefMarkMsgRead !== '-1';

	const itemIndex = findIndex(items, (item) => item.id === currentItemId);

	const { sortOrder } = parseMessageSortingOptions(
		folderId,
		settings.prefs.zimbraPrefSortOrder as string
	);

	const hasMore = useMemo(
		() => searchedInFolderStatus === SEARCHED_FOLDER_STATE_STATUS.hasMore,
		[searchedInFolderStatus]
	);

	const isTheFirstListItem = useMemo(() => itemIndex <= 0, [itemIndex]);

	const isTheLastListItem = useMemo(
		() => itemIndex === items.length - 1 && !hasMore,
		[hasMore, itemIndex, items.length]
	);

	const isLoadMoreNeeded = useMemo(
		() => itemIndex >= items.length - 1 && hasMore,
		[itemIndex, items.length, hasMore]
	);

	const onGoBackTooltip = useMemo(() => {
		if (!searchedInFolderStatus) {
			return t('tooltip.list_navigation.closeToNavigate', 'Close this email to navigate');
		}
		if (isTheFirstListItem) {
			return t('tooltip.list_navigation.noPreviousEmails', 'There are no previous emails');
		}
		return t('tooltip.list_navigation.onGoBack', 'Go to previous email');
	}, [isTheFirstListItem, searchedInFolderStatus, t]);

	const onGoForwardTooltip = useMemo(() => {
		if (!searchedInFolderStatus) {
			return t('tooltip.list_navigation.closeToNavigate', 'Close this email to navigate');
		}
		if (isTheLastListItem) {
			return t('tooltip.list_navigation.noMoreEmails', 'There are no more emails');
		}
		return t('tooltip.list_navigation.onGoForward', 'Go to next email');
	}, [isTheLastListItem, searchedInFolderStatus, t]);

	const onGoForwardDisabled = useMemo(
		() => isTheLastListItem || itemIndex >= items.length - 1,
		[itemIndex, items.length, isTheLastListItem]
	);
	const onGoBackDisabled = useMemo(() => isTheFirstListItem, [isTheFirstListItem]);
	const onGoForward = useCallback(() => {
		if (isTheLastListItem) return;
		const nextIndex = itemIndex + 1;
		const nextItem = items[nextIndex];
		if (!nextItem.read && zimbraPrefMarkMsgRead) {
			setMsgRead({ ids: [nextItem.id], value: false, dispatch }).onClick();
		}
		replaceHistory(`/folder/${folderId}/${types}/${nextItem.id}`);
	}, [isTheLastListItem, itemIndex, items, zimbraPrefMarkMsgRead, folderId, types, dispatch]);

	const onGoBack = useCallback(() => {
		if (isTheFirstListItem) return;
		const previousIndex = itemIndex - 1;
		const previousItem = items[previousIndex];
		if (!previousItem.read && zimbraPrefMarkMsgRead) {
			setMsgRead({ ids: [previousItem.id], value: false, dispatch }).onClick();
		}
		replaceHistory(`/folder/${folderId}/${types}/${previousItem.id}`);
	}, [isTheFirstListItem, itemIndex, items, zimbraPrefMarkMsgRead, folderId, types, dispatch]);

	useEffect(() => {
		if (isLoadMoreNeeded) {
			dispatch(
				search({
					folderId,
					limit: LIST_LIMIT.LOAD_MORE_LIMIT,
					sortBy: sortOrder,
					types,
					offset: items.length
				})
			);
		}
	}, [dispatch, folderId, isLoadMoreNeeded, items.length, sortOrder, types]);

	const nextActionItem = useMemo(
		() => ({
			tooltipLabel: onGoForwardTooltip,
			disabled: onGoForwardDisabled,
			action: onGoForward,
			icon: 'ArrowIosForward'
		}),
		[onGoForward, onGoForwardDisabled, onGoForwardTooltip]
	);
	const previousActionItem = useMemo(
		() => ({
			tooltipLabel: onGoBackTooltip,
			disabled: onGoBackDisabled,
			action: onGoBack,
			icon: 'ArrowIosBack'
		}),
		[onGoBack, onGoBackDisabled, onGoBackTooltip]
	);
	return {
		nextActionItem,
		previousActionItem
	};
};
