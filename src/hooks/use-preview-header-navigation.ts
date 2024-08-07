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
		return t('tooltip.list_navigation.goToPreviews', 'Go to previous email');
	}, [isTheFirstListItem, searchedInFolderStatus, t]);

	const nextActionTooltipLabel = useMemo(() => {
		if (!searchedInFolderStatus) {
			return t('tooltip.list_navigation.closeToNavigate', 'Close this email to navigate');
		}
		if (isLoadMoreNeeded) {
			return t('tooltip.list_navigation.loadingEmail', 'Loading next email');
		}
		if (isTheLastListItem) {
			return t('tooltip.list_navigation.noMoreEmails', 'There are no more emails');
		}
		return t('tooltip.list_navigation.goToNext', 'Go to next email');
	}, [isLoadMoreNeeded, isTheLastListItem, searchedInFolderStatus, t]);

	const isNextActionDisabled = useMemo(
		() => isTheLastListItem || itemIndex >= items.length - 1,
		[itemIndex, items.length, isTheLastListItem]
	);

	const isPreviousActionDisabled = useMemo(() => isTheFirstListItem, [isTheFirstListItem]);

	const onNextAction = useCallback(() => {
		if (isTheLastListItem) return;
		const nextIndex = itemIndex + 1;
		const nextItem = items[nextIndex];
		if (!nextItem.read && prefMarkMsgRead) {
			setMsgRead({ ids: [nextItem.id], value: false, dispatch }).onClick();
		}
		replaceHistory(`/folder/${folderId}/${itemsType}/${nextItem.id}`);
	}, [isTheLastListItem, itemIndex, items, prefMarkMsgRead, folderId, itemsType, dispatch]);

	const onPreviousAction = useCallback(() => {
		if (isTheFirstListItem) return;
		const previousIndex = itemIndex - 1;
		const previousItem = items[previousIndex];
		if (!previousItem.read && prefMarkMsgRead) {
			setMsgRead({ ids: [previousItem.id], value: false, dispatch }).onClick();
		}
		replaceHistory(`/folder/${folderId}/${itemsType}/${previousItem.id}`);
	}, [isTheFirstListItem, itemIndex, items, prefMarkMsgRead, folderId, itemsType, dispatch]);

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
			);
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
