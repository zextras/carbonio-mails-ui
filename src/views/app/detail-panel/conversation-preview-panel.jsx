/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo, useEffect } from 'react';
import { Container, Padding } from '@zextras/carbonio-design-system';
import { FOLDERS, useUserSettings } from '@zextras/carbonio-shell-ui';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { map, sortBy, find, filter } from 'lodash';
import PreviewPanelHeader from './preview/preview-panel-header';
import {
	selectConversationsArray,
	selectCurrentFolderExpandedStatus
} from '../../../store/conversations-slice';
import { getConv } from '../../../store/actions';
import MailPreview from './preview/mail-preview';
import PreviewPanelActions from './preview/preview-panel-actions';
import { selectMessages } from '../../../store/messages-slice';

export default function ConversationPreviewPanel() {
	const { conversationId, folderId } = useParams();
	const settings = useUserSettings();

	const dispatch = useDispatch();

	const conversations = useSelector(selectConversationsArray);
	const conversation = useMemo(
		() => find(conversations, ['id', conversationId]),
		[conversationId, conversations]
	);
	const messages = useSelector(selectMessages);
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
	const conversationStatus = useSelector(selectCurrentFolderExpandedStatus)[conversationId];

	useEffect(() => {
		dispatch(getConv({ conversationId, fetch: conversation?.messages?.[0]?.id ?? '1', folderId }));
	}, [conversation, conversationId, dispatch, folderId]);

	const messagesComponent = useMemo(() => {
		const expand = (message, index) => {
			if (settings.prefs.zimbraPrefConversationOrder === 'dateAsc') {
				return index === convMessages.length - 1;
			}
			return index === 0;
		};
		if (conversation && conversationStatus === 'complete') {
			return map(convMessages, (message, index) => (
				<Padding key={`mail-pre-${index}`} bottom="medium" width="100%">
					<MailPreview
						key={`${message.id}-${message.id}`}
						message={message}
						expanded={expand(message, index)}
						isAlone={conversation.messages.length === 1}
						isMessageView={false}
					/>
				</Padding>
			));
		}
		return [];
	}, [conversation, conversationStatus, settings.prefs.zimbraPrefConversationOrder, convMessages]);

	return (
		<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
			{conversation && (
				<>
					<PreviewPanelHeader item={conversation} folderId={folderId} />
					<PreviewPanelActions item={conversation} folderId={folderId} />
					<Container
						style={{ overflowY: 'auto' }}
						height="fill"
						background="gray5"
						padding={{ horizontal: 'large', bottom: 'small' }}
						mainAlignment="flex-start"
					>
						<Container height="fit" mainAlignment="flex-start" background="gray5">
							{messagesComponent}
						</Container>
					</Container>
				</>
			)}
		</Container>
	);
}
