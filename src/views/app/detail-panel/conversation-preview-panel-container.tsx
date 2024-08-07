/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { replaceHistory, useTags, useUserSettings } from '@zextras/carbonio-shell-ui';
import { filter, findIndex, isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { ConversationPreviewPanel } from './conversation-preview-panel';
import PreviewPanelHeader from './preview/preview-panel-header';
import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { API_REQUEST_STATUS, LIST_LIMIT, SEARCHED_FOLDER_STATE_STATUS } from '../../../constants';
import { getFolderIdParts } from '../../../helpers/folders';
import { parseMessageSortingOptions } from '../../../helpers/sorting';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useFolderSortedConversations } from '../../../hooks/use-folder-sorted-conversations';
import { getConv, search, searchConv } from '../../../store/actions';
import {
	selectConversation,
	selectConversationExpandedStatus,
	selectFolderSearchStatus
} from '../../../store/conversations-slice';
import type { MailsStateType } from '../../../types';
import { setMsgRead } from '../../../ui-actions/message-actions';
import { useExtraWindow } from '../extra-windows/use-extra-window';

type ConversationPreviewPanelProps = { conversationId?: string; folderId?: string };

const useConversationPreviewPanelParameters = (
	props: ConversationPreviewPanelProps
): { conversationId: string; folderId: string } => {
	const params = useParams<{ conversationId: string; folderId: string }>();
	return {
		conversationId: props.conversationId ?? params.conversationId,
		folderId: props.folderId ?? params.folderId
	};
};

export const ConversationPreviewPanelContainer: FC<ConversationPreviewPanelProps> = (props) => {
	const { conversationId, folderId } = useConversationPreviewPanelParameters(props);
	const [t] = useTranslation();
	const tagsFromStore = useTags();
	const { isInsideExtraWindow } = useExtraWindow();
	const dispatch = useAppDispatch();
	const conversationsStatus = useAppSelector((state: MailsStateType) =>
		selectConversationExpandedStatus(state, conversationId)
	);
	const searchedInFolderStatus = useAppSelector(selectFolderSearchStatus(folderId));
	const conversations = useFolderSortedConversations(folderId);
	const conversation = useAppSelector(selectConversation(conversationId));

	const settings = useUserSettings();
	const convSortOrder = settings.prefs.zimbraPrefConversationOrder as string;
	const zimbraPrefMarkMsgRead = settings?.prefs?.zimbraPrefMarkMsgRead !== '-1';

	useEffect(() => {
		if (isEmpty(conversation)) {
			dispatch(getConv({ conversationId }));
		}
	}, [conversation, dispatch, conversationId]);

	useEffect(() => {
		if (
			(conversationsStatus !== API_REQUEST_STATUS.fulfilled &&
				conversationsStatus !== API_REQUEST_STATUS.pending) ||
			!conversationsStatus
		) {
			dispatch(searchConv({ conversationId, fetch: 'all', folderId, tags: tagsFromStore }));
		}
	}, [conversationId, conversationsStatus, dispatch, folderId, tagsFromStore]);

	const showPreviewPanel = useMemo(
		(): boolean | undefined =>
			getFolderIdParts(folderId).id === FOLDERS.TRASH
				? conversation && conversation?.messages?.length > 0
				: filter(conversation?.messages, (m) => getFolderIdParts(m.parent).id !== FOLDERS.TRASH)
						.length > 0,
		[conversation, folderId]
	);
	const conversationIndex = findIndex(conversations, (conv) => conv.id === conversationId);
	const hasMore = useMemo(
		() => searchedInFolderStatus === SEARCHED_FOLDER_STATE_STATUS.hasMore,
		[searchedInFolderStatus]
	);
	const isTheFirstListItem = useMemo(() => conversationIndex <= 0, [conversationIndex]);
	const isTheLastListItem = useMemo(
		() => conversationIndex === conversations.length - 1 && !hasMore,
		[hasMore, conversationIndex, conversations.length]
	);

	const onGoBackTooltip = useMemo(() => {
		if (!searchedInFolderStatus) {
			return t('tooltip.list_navigation.closeToNavigate', 'Close this email to navigate');
		}
		if (isTheFirstListItem) {
			return t('tooltip.list_navigation.noPreviousEmails', 'There are no previous emails');
		}
		return undefined;
	}, [isTheFirstListItem, searchedInFolderStatus, t]);

	const onGoForwardTooltip = useMemo(() => {
		if (!searchedInFolderStatus) {
			return t('tooltip.list_navigation.closeToNavigate', 'Close this email to navigate');
		}
		if (isTheLastListItem) {
			return t('tooltip.list_navigation.noMoreEmails', 'There are no more emails');
		}
		return undefined;
	}, [isTheLastListItem, searchedInFolderStatus, t]);

	const onGoForward = useCallback(() => {
		if (isTheLastListItem) return;
		const nextIndex = conversationIndex + 1;
		const newMsg = conversations[nextIndex];
		if (!newMsg.read && zimbraPrefMarkMsgRead) {
			setMsgRead({ ids: [newMsg.id], value: false, dispatch }).onClick();
		}
		replaceHistory(`/folder/${folderId}/conversation/${newMsg.id}`);
	}, [
		dispatch,
		folderId,
		isTheLastListItem,
		conversationIndex,
		conversations,
		zimbraPrefMarkMsgRead
	]);

	const onGoBack = useCallback(() => {
		if (isTheFirstListItem) return;
		const nextIndex = conversationIndex - 1;
		const newMsg = conversations[nextIndex];
		if (!newMsg.read && zimbraPrefMarkMsgRead) {
			setMsgRead({ ids: [newMsg.id], value: false, dispatch }).onClick();
		}
		replaceHistory(`/folder/${folderId}/conversation/${newMsg.id}`);
	}, [
		isTheFirstListItem,
		conversationIndex,
		conversations,
		zimbraPrefMarkMsgRead,
		folderId,
		dispatch
	]);

	const isLoadMoreNeeded = useMemo(
		() => conversationIndex >= conversations.length - 1 && hasMore,
		[hasMore, conversationIndex, conversations.length]
	);
	const { sortOrder } = parseMessageSortingOptions(
		folderId,
		settings.prefs.zimbraPrefSortOrder as string
	);
	useEffect(() => {
		if (isLoadMoreNeeded) {
			const offset = conversations.length;
			dispatch(
				search({
					folderId,
					limit: LIST_LIMIT.LOAD_MORE_LIMIT,
					sortBy: sortOrder,
					types: 'conversation',
					offset
				})
			);
		}
	}, [dispatch, folderId, isLoadMoreNeeded, conversations.length, sortOrder]);

	return (
		<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
			{showPreviewPanel && (
				<>
					{!isInsideExtraWindow && (
						<PreviewPanelHeader
							onGoForwardTooltip={onGoForwardTooltip}
							onGoBackTooltip={onGoBackTooltip}
							onGoForward={
								isTheLastListItem || conversationIndex >= conversations.length - 1
									? undefined
									: onGoForward
							}
							onGoBack={isTheFirstListItem ? undefined : onGoBack}
							subject={conversation.subject}
							isRead={conversation.read}
							folderId={folderId}
						/>
					)}
					<ConversationPreviewPanel
						conversation={conversation}
						isInsideExtraWindow={isInsideExtraWindow}
						convSortOrder={convSortOrder}
					/>
				</>
			)}
		</Container>
	);
};
