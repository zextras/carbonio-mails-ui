/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useEffect, useMemo } from 'react';

import { Container, Shimmer } from '@zextras/carbonio-design-system';
import { FOLDERS, useTags, useUserSettings } from '@zextras/carbonio-shell-ui';
import { filter, find, map, sortBy } from 'lodash';
import { useParams } from 'react-router-dom';

import { ConversationMessagePreview } from './conversation-message-preview';
import PreviewPanelHeader from './preview/preview-panel-header';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { getConv, searchConv } from '../../../store/actions';
import {
	selectConversationExpandedStatus,
	selectConversationsArray,
	selectCurrentFolderExpandedStatus
} from '../../../store/conversations-slice';
import { selectMessages } from '../../../store/messages-slice';
import type { Conversation, MailsStateType } from '../../../types';
import { useExtraWindow } from '../extra-windows/use-extra-window';

export const ConversationPreviewComponent = ({
	conversation
}: {
	conversation: Conversation;
}): ReactElement => {
	const settings = useUserSettings();
	const messages = useAppSelector(selectMessages);
	const conversationStatus = useAppSelector(selectCurrentFolderExpandedStatus)[conversation.id];
	const convMessages = useMemo(() => {
		const msgs = map(conversation?.messages, (item) => messages[item.id] ?? item);

		if (settings.prefs.zimbraPrefConversationOrder === 'dateAsc' && msgs?.length > 0) {
			return sortBy(msgs, [(o): string | number => o.date]);
		}
		return msgs ?? [];
	}, [conversation?.messages, settings.prefs.zimbraPrefConversationOrder, messages]);

	const isExpanded = useCallback(
		(index: number): boolean => {
			if (settings.prefs.zimbraPrefConversationOrder === 'dateAsc') {
				return index === convMessages.length - 1;
			}
			return index === 0;
		},
		[convMessages.length, settings.prefs.zimbraPrefConversationOrder]
	);

	return (
		<Container
			style={{ overflowY: 'auto' }}
			height="fill"
			background="gray5"
			padding={{ horizontal: 'large', bottom: 'small', top: 'large' }}
			mainAlignment="flex-start"
		>
			<Container height="fit" mainAlignment="flex-start" background="gray5">
				{conversation && conversationStatus === 'complete' ? (
					<>
						{map(convMessages, (message, index) =>
							message ? (
								<ConversationMessagePreview
									idPrefix={conversation.id}
									message={message}
									isExpanded={isExpanded(index)}
									isAlone={convMessages?.length === 1}
								></ConversationMessagePreview>
							) : (
								<Shimmer.Logo size="large" />
							)
						)}
					</>
				) : (
					<></>
				)}
			</Container>
		</Container>
	);
};

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

export const ConversationPreviewPanel: FC<ConversationPreviewPanelProps> = (props) => {
	const { conversationId, folderId } = useConversationPreviewPanelParameters(props);
	const tagsFromStore = useTags();
	const { isInsideExtraWindow } = useExtraWindow();

	const dispatch = useAppDispatch();
	const conversations = useAppSelector(selectConversationsArray);
	const conversationsStatus = useAppSelector((state: MailsStateType) =>
		selectConversationExpandedStatus(state, conversationId)
	);

	const conversation = useMemo(
		() => find(conversations, ['id', conversationId]) as Conversation,
		[conversationId, conversations]
	);
	useEffect(() => {
		if (!conversation) {
			dispatch(getConv({ conversationId }));
		}
	}, [conversation, dispatch, conversationId]);

	useEffect(() => {
		if (
			(conversationsStatus !== 'complete' && conversationsStatus !== 'pending') ||
			!conversationsStatus
		) {
			dispatch(searchConv({ conversationId, fetch: 'all', folderId, tags: tagsFromStore }));
		}
	}, [conversationId, conversationsStatus, dispatch, folderId, tagsFromStore]);

	const showPreviewPanel = useMemo(
		(): boolean | undefined =>
			folderId === FOLDERS.TRASH
				? conversation && conversation?.messages?.length > 0
				: filter(conversation?.messages, (m) => m.parent !== FOLDERS.TRASH).length > 0,
		[conversation, folderId]
	);

	return (
		<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
			{showPreviewPanel && (
				<>
					{!isInsideExtraWindow && <PreviewPanelHeader item={conversation} folderId={folderId} />}
					<ConversationPreviewComponent conversation={conversation} />
				</>
			)}
		</Container>
	);
};
