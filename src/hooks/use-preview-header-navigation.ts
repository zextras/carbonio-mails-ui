/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { replaceHistory, useUserSettings } from '@zextras/carbonio-shell-ui';
import { findIndex } from 'lodash';
import { useTranslation } from 'react-i18next';

import { useAppDispatch } from './redux';
import { LIST_LIMIT, SEARCHED_FOLDER_STATE_STATUS } from '../constants';
import { parseMessageSortingOptions } from '../helpers/sorting';
import { convAction, msgAction, search } from '../store/actions';

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
	itemsType,
	searchedInFolderStatus
}: {
	items: Array<{ id: string; read: boolean | string }>;
	folderId: string;
	currentItemId: string;
	itemsType: 'conversation' | 'message';
	searchedInFolderStatus: string | undefined;
}): PreviewHeaderNavigationActions => {
	const dispatch = useAppDispatch();
	const [t] = useTranslation();
	const settings = useUserSettings();
	const prefMarkMsgRead = settings?.prefs?.zimbraPrefMarkMsgRead !== '-1';
	const [isLoadMoreFailed, setIsLoadMoreFailed] = useState(false);

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

	const previousActionTooltipLabel = useMemo(() => {
		if (!searchedInFolderStatus) {
			return t('tooltip.list_navigation.closeToNavigate', 'Close this email to navigate');
		}
		if (isTheFirstListItem) {
			return t('tooltip.list_navigation.noPreviousEmails', 'There are no previous emails');
		}
		return t('tooltip.list_navigation.goToPrevious', 'Go to previous email');
	}, [isTheFirstListItem, searchedInFolderStatus, t]);

	const nextActionTooltipLabel = useMemo(() => {
		if (!searchedInFolderStatus) {
			return t('tooltip.list_navigation.closeToNavigate', 'Close this email to navigate');
		}
		if (isLoadMoreNeeded && !isLoadMoreFailed) {
			return t('tooltip.list_navigation.loadingNextEmail', 'Loading next email');
		}
		if (isLoadMoreNeeded && isLoadMoreFailed) {
			return t(
				'tooltip.list_navigation.unableToLoadNextEmail',
				'Unable to load next email. Try again later'
			);
		}
		if (isTheLastListItem) {
			return t('tooltip.list_navigation.noMoreEmails', 'There are no more emails');
		}
		return t('tooltip.list_navigation.goToNext', 'Go to next email');
	}, [isLoadMoreFailed, isLoadMoreNeeded, isTheLastListItem, searchedInFolderStatus, t]);

	const isNextActionDisabled = useMemo(
		() => isTheLastListItem || itemIndex >= items.length - 1,
		[itemIndex, items.length, isTheLastListItem]
	);

	const isPreviousActionDisabled = useMemo(() => isTheFirstListItem, [isTheFirstListItem]);

	const setItemAsRead = useCallback(
		(itemId: string) => {
			if (itemsType === 'conversation') {
				dispatch(
					convAction({
						operation: 'read',
						ids: [itemId]
					})
				);
			} else if (itemsType === 'message') {
				dispatch(
					msgAction({
						operation: 'read',
						ids: [itemId]
					})
				);
			}
		},
		[dispatch, itemsType]
	);

	const onNextAction = useCallback(() => {
		if (isTheLastListItem) return;
		const nextIndex = itemIndex + 1;
		const nextItem = items[nextIndex];
		if (!nextItem.read && prefMarkMsgRead) {
			setItemAsRead(nextItem.id);
		}
		replaceHistory(`/folder/${folderId}/${itemsType}/${nextItem.id}`);
	}, [isTheLastListItem, itemIndex, items, prefMarkMsgRead, folderId, itemsType, setItemAsRead]);

	const onPreviousAction = useCallback(() => {
		if (isTheFirstListItem) return;
		const previousIndex = itemIndex - 1;
		const previousItem = items[previousIndex];
		if (!previousItem.read && prefMarkMsgRead) {
			setItemAsRead(previousItem.id);
		}
		replaceHistory(`/folder/${folderId}/${itemsType}/${previousItem.id}`);
	}, [isTheFirstListItem, itemIndex, items, prefMarkMsgRead, folderId, itemsType, setItemAsRead]);

	useEffect(() => {
		if (isLoadMoreNeeded) {
			dispatch(
				search({
					folderId,
					limit: LIST_LIMIT.LOAD_MORE_LIMIT,
					sortBy: sortOrder,
					types: itemsType,
					offset: items.length
				})
			).then((res) => {
				// @ts-expect-error apparently the return type is wrong
				if (res.error) {
					setIsLoadMoreFailed(true);
				}
			});
		}
	}, [dispatch, folderId, isLoadMoreNeeded, items.length, sortOrder, itemsType]);

	const nextActionItem = useMemo(
		() => ({
			tooltipLabel: nextActionTooltipLabel,
			disabled: isNextActionDisabled,
			action: onNextAction,
			icon: 'ArrowIosForward'
		}),
		[onNextAction, isNextActionDisabled, nextActionTooltipLabel]
	);

	const previousActionItem = useMemo(
		() => ({
			tooltipLabel: previousActionTooltipLabel,
			disabled: isPreviousActionDisabled,
			action: onPreviousAction,
			icon: 'ArrowIosBack'
		}),
		[onPreviousAction, isPreviousActionDisabled, previousActionTooltipLabel]
	);

	return useMemo(
		() => ({
			nextActionItem,
			previousActionItem
		}),
		[nextActionItem, previousActionItem]
	);
};
