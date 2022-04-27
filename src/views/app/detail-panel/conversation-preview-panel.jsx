/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo, useEffect } from 'react';
import { Container, Padding, Shimmer } from '@zextras/carbonio-design-system';
import { FOLDERS, useTags, useUserSettings } from '@zextras/carbonio-shell-ui';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { map, sortBy, find, filter } from 'lodash';
import PreviewPanelHeader from './preview/preview-panel-header';
import {
	selectConversationExpandedStatus,
	selectConversationsArray,
	selectCurrentFolderExpandedStatus
} from '../../../store/conversations-slice';
import { getConv, searchConv } from '../../../store/actions';
import MailPreview from './preview/mail-preview';
import { selectMessages } from '../../../store/messages-slice';

const MessagesComponent = ({ conversation }) => {
	const { conversationId, folderId } = useParams();
	const settings = useUserSettings();
	const messages = useSelector(selectMessages);
	const conversationStatus = useSelector(selectCurrentFolderExpandedStatus)[conversationId];

	const convMessages = useMemo(() => {
		const msgs =
			folderId !== FOLDERS.TRASH
				? map(
						filter(conversation?.messages, (m) => m.parent !== FOLDERS.TRASH),
						(item) => messages[item.id]
				  )
				: map(conversation?.messages, (item) => messages[item.id]);
		if (settings.prefs.zimbraPrefConversationOrder === 'dateAsc') {
			return sortBy(msgs, [(o) => o.date]);
		}
		return msgs;
	}, [conversation?.messages, messages, settings.prefs.zimbraPrefConversationOrder, folderId]);

	const expand = (message, index) => {
		if (settings.prefs.zimbraPrefConversationOrder === 'dateAsc') {
			return index === convMessages.length - 1;
		}
		return index === 0;
	};

	if (conversation && conversationStatus === 'complete') {
		return map(convMessages, (message, index) =>
			message ? (
				<Padding key={`${conversationId}-${message.id}`} bottom="medium" width="100%">
					<MailPreview
						message={message}
						expanded={expand(message, index)}
						isAlone={conversation.messages.length === 1}
						isMessageView={false}
					/>
				</Padding>
			) : (
				<Shimmer.Logo size="large" />
			)
		);
	}
	return null;
};

export default function ConversationPreviewPanel() {
	const { conversationId, folderId } = useParams();
	const dispatch = useDispatch();

	const conversations = useSelector(selectConversationsArray);
	const conversationsStatus = useSelector((state) =>
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
	const tagsFromStore = useTags();
	useEffect(() => {
		if (conversationsStatus !== 'complete' && conversationsStatus !== 'pending') {
			dispatch(searchConv({ conversationId, fetch: 'all', folderId, tags: tagsFromStore }));
		}
	}, [conversationId, conversationsStatus, dispatch, folderId, tagsFromStore]);

	return (
		<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
			{conversation && (
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
}
