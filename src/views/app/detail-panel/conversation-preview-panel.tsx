/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Padding, Shimmer } from '@zextras/carbonio-design-system';
import { FOLDERS, useCurrentRoute, useTags, useUserSettings } from '@zextras/carbonio-shell-ui';
import { filter, find, map, sortBy } from 'lodash';
import React, { FC, ReactElement, useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { getConv, searchConv } from '../../../store/actions';
import {
	selectConversationExpandedStatus,
	selectConversationsArray,
	selectCurrentFolderExpandedStatus
} from '../../../store/conversations-slice';
import { selectMessages } from '../../../store/messages-slice';
import type { Conversation, MailsStateType } from '../../../types';
import MailPreview from './preview/mail-preview';
import PreviewPanelHeader from './preview/preview-panel-header';

const MessagesComponent = ({
	conversation
}: {
	conversation: Conversation | undefined;
}): ReactElement => {
	const { conversationId, folderId } = useParams<{ conversationId: string; folderId: string }>();
	const settings = useUserSettings();
	const messages = useAppSelector(selectMessages);
	const conversationStatus = useAppSelector(selectCurrentFolderExpandedStatus)[conversationId];
	const activeRoute = useCurrentRoute();
	const convMessages = useMemo(() => {
		const msgs =
			folderId !== FOLDERS.TRASH && activeRoute && activeRoute.id !== 'search'
				? map(
						filter(conversation?.messages, (m) => m.parent !== FOLDERS.TRASH),
						(item) => messages[item.id] ?? item
				  )
				: map(conversation?.messages, (item) => messages[item.id] ?? item);

		if (settings.prefs.zimbraPrefConversationOrder === 'dateAsc' && msgs?.length > 0) {
			return sortBy(msgs, [(o): string | number => o.date]);
		}
		return msgs ?? [];
	}, [
		folderId,
		activeRoute,
		conversation?.messages,
		settings.prefs.zimbraPrefConversationOrder,
		messages
	]);

	const expand = useCallback(
		(message, index) => {
			if (settings.prefs.zimbraPrefConversationOrder === 'dateAsc') {
				return index === convMessages.length - 1;
			}
			return index === 0;
		},
		[convMessages.length, settings.prefs.zimbraPrefConversationOrder]
	);

	if (conversation && conversationStatus === 'complete') {
		return (
			<>
				{map(convMessages, (message, index) =>
					message ? (
						<Padding key={`${conversationId}-${message.id}`} bottom="medium" width="100%">
							<MailPreview
								message={message}
								expanded={expand(message, index)}
								isAlone={convMessages?.length === 1}
								isMessageView={false}
							/>
						</Padding>
					) : (
						<Shimmer.Logo size="large" />
					)
				)}
			</>
		);
	}
	return <></>;
};

const ConversationPreviewPanel: FC = () => {
	const { conversationId, folderId } = useParams<{ conversationId: string; folderId: string }>();
	const tagsFromStore = useTags();

	const dispatch = useAppDispatch();
	const conversations = useAppSelector(selectConversationsArray);
	const conversationsStatus = useAppSelector((state: MailsStateType) =>
		selectConversationExpandedStatus(state, conversationId)
	);

	const conversation = useMemo(
		() => find(conversations, ['id', conversationId]),
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
					<PreviewPanelHeader item={conversation} folderId={folderId} />
					{/* commented to hide the panel actions */}
					{/* <PreviewPanelActions item={conversation} folderId={folderId} /> */}
					<Container
						style={{ overflowY: 'auto' }}
						height="fill"
						background="gray5"
						padding={{ horizontal: 'large', bottom: 'small', top: 'large' }}
						mainAlignment="flex-start"
					>
						<Container height="fit" mainAlignment="flex-start" background="gray5">
							<MessagesComponent conversation={conversation} />
						</Container>
					</Container>
				</>
			)}
		</Container>
	);
};

export default ConversationPreviewPanel;
