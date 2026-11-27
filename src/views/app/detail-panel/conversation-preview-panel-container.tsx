/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { getUserSettings, useUserSettings } from '@zextras/carbonio-shell-ui';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { filter, isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import type {
	DetailPanelConversationRouteParams,
	DetailPanelRoutesParams
} from '../../../types/routes';
import { Spinner } from 'assets/spinner';
import { API_REQUEST_STATUS } from 'constants/index';
import { isFocusModeMailView } from 'helpers/external-tabs';
import { getFolderIdParts } from 'helpers/folders';
import { getConvEmailStoreAction } from 'store/emails/actions/get-conv-action';
import { useCompleteConversationOrFetch } from 'store/emails/hooks/hooks';
import { useConversationMessages, useMessageById } from 'store/emails/store';
import { ConversationPreviewPanel } from 'views/app/detail-panel/conversation-preview-panel';
import { PreviewPanelHeader } from 'views/app/detail-panel/preview/preview-panel-header';

/*
 * A conversation with a single message has a virtual negative id (-<messageId>).
 * Returns the id of that message, or undefined if the conversation id is not virtual
 */
const getSingleMessageIdFromConversationId = (conversationId: string): string | undefined => {
	const match = /^(.*:)?-(\d+)$/.exec(conversationId);
	return match ? `${match[1] ?? ''}${match[2]}` : undefined;
};

export const ConversationPreviewPanelContainer = (): React.JSX.Element => {
	const [t] = useTranslation();
	const navigate = useNavigate();
	const { conversationId, folderId } =
		useParams<DetailPanelRoutesParams>() as DetailPanelConversationRouteParams;
	const zimbraPrefMarkMsgRead = useUserSettings()?.prefs?.zimbraPrefMarkMsgRead !== '-1';

	const { conversation, conversationStatus } = useCompleteConversationOrFetch({
		conversationId,
		shouldMarkAsRead: zimbraPrefMarkMsgRead
	});
	const messages = useConversationMessages(conversationId);

	const onConversationIdChange = useCallback(
		(newConversationId: string): void => {
			navigate(`../${newConversationId}`, {
				replace: true,
				relative: 'path'
			});
		},
		[navigate]
	);

	/*
	 * When a message is added to a single-message conversation, the backend replaces
	 * the virtual negative id with a new one. The route must follow the new id,
	 * otherwise the conversation is no longer highlighted in the list
	 */
	const singleMessage = useMessageById(getSingleMessageIdFromConversationId(conversationId) ?? '');
	const updatedConversationId =
		singleMessage?.conversation && singleMessage.conversation !== conversationId
			? singleMessage.conversation
			: undefined;

	useEffect(() => {
		if (updatedConversationId) {
			onConversationIdChange(updatedConversationId);
		}
	}, [onConversationIdChange, updatedConversationId]);

	useEffect(() => {
		if (
			!updatedConversationId &&
			isEmpty(conversation) &&
			conversationStatus !== API_REQUEST_STATUS.fulfilled
		) {
			const prefs = getUserSettings()?.prefs;
			const html = prefs?.zimbraPrefMessageViewHtmlPreferred === 'TRUE';
			getConvEmailStoreAction({ id: conversationId, onConversationIdChange, html });
		}
	}, [
		conversation,
		conversationId,
		conversationStatus,
		onConversationIdChange,
		updatedConversationId
	]);

	useEffect(() => {
		if (isFocusModeMailView() && conversation?.subject) {
			document.title = conversation.subject;
		}
	}, [conversation?.subject]);

	const showPreviewPanel = useMemo((): boolean | undefined => {
		if (isFocusModeMailView() || getFolderIdParts(folderId).id === FOLDERS.TRASH) {
			return conversation && conversation?.messageIds?.length > 0;
		}
		return filter(messages, (m) => getFolderIdParts(m.parent).id !== FOLDERS.TRASH).length > 0;
	}, [conversation, folderId, messages]);

	return (
		<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
			{showPreviewPanel && (
				<>
					<PreviewPanelHeader
						itemType={'conversation'}
						subject={conversation.subject}
						isRead={conversation.read}
						folderId={folderId}
					/>

					{conversation && conversationStatus === API_REQUEST_STATUS.fulfilled && (
						<ConversationPreviewPanel conversation={conversation} />
					)}

					{(conversationStatus === API_REQUEST_STATUS.error || conversationStatus === null) && (
						<></>
					)}
					{conversationStatus === API_REQUEST_STATUS.pending && (
						<Spinner
							text={t('displayer.loading_conversation', 'Loading conversation, please wait...')}
						/>
					)}
				</>
			)}
		</Container>
	);
};
