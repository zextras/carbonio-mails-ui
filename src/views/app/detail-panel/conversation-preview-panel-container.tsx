/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { replaceHistory, useTags, useUserSettings } from '@zextras/carbonio-shell-ui';
import { filter, findIndex, isEmpty } from 'lodash';
import { useParams } from 'react-router-dom';

import { ConversationPreviewPanel } from './conversation-preview-panel';
import PreviewPanelHeader from './preview/preview-panel-header';
import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { API_REQUEST_STATUS, SEARCHED_FOLDER_STATE_STATUS } from '../../../constants';
import { getFolderIdParts } from '../../../helpers/folders';
import { parseMessageSortingOptions } from '../../../helpers/sorting';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useFolderSortedConversations } from '../../../hooks/use-folder-sorted-conversations';
import { getConv, searchConv } from '../../../store/actions';
import {
	selectConversation,
	selectConversationExpandedStatus,
	selectFolderSearchStatus
} from '../../../store/conversations-slice';
import type { MailsStateType } from '../../../types';
import { setConversationsRead } from '../../../ui-actions/conversation-actions';
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
	const tagsFromStore = useTags();
	const { isInsideExtraWindow } = useExtraWindow();
	const dispatch = useAppDispatch();
	const conversationsStatus = useAppSelector((state: MailsStateType) =>
		selectConversationExpandedStatus(state, conversationId)
	);

	const conversations = useFolderSortedConversations(folderId);
	const conversation = useAppSelector(selectConversation(conversationId));
	const searchedInFolderStatus = useAppSelector(selectFolderSearchStatus(folderId));

	const hasMore = useMemo(
		() => searchedInFolderStatus === SEARCHED_FOLDER_STATE_STATUS.hasMore,
		[searchedInFolderStatus]
	);
	const conversationIndex = useMemo(() => {
		const index = findIndex(conversations, (conv) => conv.id === conversationId);
		return index === -1 ? 0 : index;
	}, [conversationId, conversations]);

	const [currentConversationIndex, setCurrentConversationIndex] = useState(conversationIndex);

	const settings = useUserSettings();
	const convSortOrder = settings.prefs.zimbraPrefConversationOrder as string;
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
	const { prefs } = useUserSettings();

	const zimbraPrefMarkMsgRead = useUserSettings()?.prefs?.zimbraPrefMarkMsgRead !== '-1';
	const { sortOrder } = parseMessageSortingOptions(folderId, prefs.zimbraPrefSortOrder as string);

	const setReadAndPush = useCallback((): void => {
		const nextIndex = conversationIndex + 1;
		const newConv = conversations[nextIndex];
		if (newConv?.read === false && zimbraPrefMarkMsgRead) {
			setConversationsRead({
				ids: [newConv.id],
				value: false,
				dispatch,
				folderId,
				shouldReplaceHistory: false
			}).onClick();
		}
		replaceHistory(`/folder/${folderId}/conversation/${newConv.id}`);
	}, [conversationIndex, conversations, dispatch, folderId, zimbraPrefMarkMsgRead]);

	const onGoForward = useCallback(() => {
		if (conversationIndex === conversations.length - 1 && !hasMore) return;
		setCurrentConversationIndex((prevValue) => prevValue + 1);
	}, [conversationIndex, conversations?.length, hasMore]);

	const onGoBack = useCallback(() => {
		if (conversationIndex <= 0) return;
		setCurrentConversationIndex((prevValue) => prevValue - 1);
	}, [conversationIndex]);

	/*	const onGoForward = useCallback(() => {
		if (conversationIndex === conversations.length - 1 && !hasMore) return;
		const listOffSet = 5;
		if (conversationIndex >= conversations.length - 1 - listOffSet && hasMore) {
			const offset = conversations.length;
			dispatch(
				search({ folderId, offset, sortBy: sortOrder, limit: LIST_LIMIT.LOAD_MORE_LIMIT })
			).then(() => {
				setReadAndPush();
			});
		} else {
			setReadAndPush();
		}
	}, [
		conversationIndex,
		conversations.length,
		dispatch,
		folderId,
		hasMore,
		setReadAndPush,
		sortOrder
	]); */

	/*	const onGoBack = useCallback(() => {
		if (conversationIndex <= 0) return;
		const nextIndex = conversationIndex - 1;
		const newConv = conversations[nextIndex];
		if (newConv?.read === false && zimbraPrefMarkMsgRead) {
			setConversationsRead({
				ids: [newConv.id],
				value: false,
				dispatch,
				folderId,
				shouldReplaceHistory: false
			}).onClick();
		}
		replaceHistory(`/folder/${folderId}/conversation/${newConv.id}`);
	}, [conversationIndex, conversations, dispatch, folderId, zimbraPrefMarkMsgRead]); */

	return (
		<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
			{showPreviewPanel && (
				<>
					{!isInsideExtraWindow && (
						<PreviewPanelHeader
							onGoBack={onGoBack}
							onGoForward={onGoForward}
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
