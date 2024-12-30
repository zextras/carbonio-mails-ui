/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { replaceHistory, useUserSettings } from '@zextras/carbonio-shell-ui';
import { findIndex } from 'lodash';
import { useTranslation } from 'react-i18next';

import { msgActionSoapApi } from '../api/msg-action';
import { API_REQUEST_STATUS, LIST_LIMIT } from '../constants';
import { parseMessageSortingOptions } from '../helpers/sorting';
import { convAction } from '../store/actions';
import {
	useConversationsByIds,
	useConversationsResultsLoadingStatus,
	useMessagesByIds,
	useMessagesResultsLoadingStatus
} from '../store/zustand/emails/store';
import { SearchRequestStatus } from '../types';
import { useLoadMoreForConversationList } from '../views/app/folder-panel/conversations/conversation-list-hooks';
import { useLoadMoreForMessageList } from '../views/app/folder-panel/messages/message-list-hooks';

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
	itemIds,
	folderId,
	currentItemId,
	itemsType,
	hasMore,
	searchedInFolderStatus
}: {
	itemIds: Array<string>;
	folderId: string;
	hasMore: boolean;
	currentItemId: string;
	itemsType: 'conversation' | 'message';
	searchedInFolderStatus: SearchRequestStatus;
}): PreviewHeaderNavigationActions => {
	const [t] = useTranslation();
	const settings = useUserSettings();
	const prefMarkMsgRead = settings?.prefs?.zimbraPrefMarkMsgRead !== '-1';
	const loadingMore = useRef(false);
	const conversations = useConversationsByIds(itemIds);
	const messages = useMessagesByIds(itemIds);
	const isMessageView = itemsType === 'message';
	const conversationLoadingStatus = useConversationsResultsLoadingStatus();
	const messageLoadingStatus = useMessagesResultsLoadingStatus();
	const loadMoreStatus = isMessageView ? messageLoadingStatus : conversationLoadingStatus;
	const isLoadMoreFailed = loadMoreStatus === API_REQUEST_STATUS.error;

	const items = isMessageView ? messages : conversations;

	const itemIndex = findIndex(itemIds, (item) => item === currentItemId);

	const { sortOrder } = parseMessageSortingOptions(
		folderId,
		settings.prefs.zimbraPrefSortOrder as string
	);

	const isTheFirstListItem = useMemo(() => itemIndex <= 0, [itemIndex]);

	const isTheLastListItem = useMemo(
		() => itemIndex === items.length - 1 && !hasMore,
		[itemIndex, items.length, hasMore]
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
				convAction({
					operation: 'read',
					ids: [itemId]
				});
			} else if (itemsType === 'message') {
				msgActionSoapApi({
					operation: 'read',
					ids: [itemId]
				});
			}
		},
		[itemsType]
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

	const loadMoreConversations = useLoadMoreForConversationList({
		sortBy: sortOrder,
		offset: items.length,
		limit: LIST_LIMIT.LOAD_MORE_LIMIT,
		hasMore,
		loadingMore,
		folderId
	});

	const loadMoreMessages = useLoadMoreForMessageList({
		limit: LIST_LIMIT.LOAD_MORE_LIMIT,
		sortBy: sortOrder,
		offset: items.length,
		hasMore,
		loadingMore,
		folderId
	});

	const loadMore = isMessageView ? loadMoreMessages : loadMoreConversations;

	useEffect(() => {
		if (isLoadMoreNeeded) {
			loadMore();
		}
	}, [isLoadMoreNeeded, loadMore]);

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
