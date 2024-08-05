/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { replaceHistory, useTags, useUserSettings } from '@zextras/carbonio-shell-ui';
import { filter, findIndex, isEmpty } from 'lodash';
import { useParams } from 'react-router-dom';

import { ConversationPreviewPanel } from './conversation-preview-panel';
import PreviewPanelHeader from './preview/preview-panel-header';
import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { API_REQUEST_STATUS } from '../../../constants';
import { getFolderIdParts } from '../../../helpers/folders';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useFolderSortedConversations } from '../../../hooks/use-folder-sorted-conversations';
import { getConv, searchConv } from '../../../store/actions';
import {
	selectConversation,
	selectConversationExpandedStatus
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

	const conversationIndex = findIndex(conversations, (conv) => conv.id === conversationId);
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
	const zimbraPrefMarkMsgRead = useUserSettings()?.prefs?.zimbraPrefMarkMsgRead !== '-1';

	const onGoForward = useCallback(() => {
		if (conversationIndex === conversations.length - 1) return;
		const offSet = 5;
		const hasMore = true;
		if (conversationIndex === conversations.length - offSet && hasMore) {
			// todo: implement loadMore
		}
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

	const onGoBack = useCallback(() => {
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
	}, [conversationIndex, conversations, dispatch, folderId, zimbraPrefMarkMsgRead]);

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
