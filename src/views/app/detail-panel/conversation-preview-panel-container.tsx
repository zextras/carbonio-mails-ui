/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { filter, isEmpty } from 'lodash';
import { useNavigate, useParams } from 'react-router-dom';

import { ConversationPreviewPanel } from './conversation-preview-panel';
import { PreviewPanelHeader } from './preview/preview-panel-header';
import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { API_REQUEST_STATUS, MAILS_ROUTE } from '../../../constants';
import { getFolderIdParts } from '../../../helpers/folders';
import { getConvEmailStoreAction } from '../../../store/emails/actions/get-conv-action';
import { useCompleteConversationOrFetch } from '../../../store/emails/hooks/hooks';
import { useConversationMessages } from '../../../store/emails/store';
import { useExtraWindow } from '../extra-windows/use-extra-window';

export const ConversationPreviewPanelContainer = (): React.JSX.Element => {
	const navigate = useNavigate();
	const { conversationId, folderId } = useParams() as { conversationId: string; folderId: string };
	const { isInsideExtraWindow } = useExtraWindow();
	const { conversation, conversationStatus } = useCompleteConversationOrFetch(conversationId);
	const messages = useConversationMessages(conversationId);

	const onConversationIdChange = useCallback(
		(newConversationId: string): void => {
			navigate(`/${MAILS_ROUTE}/folder/${folderId}/conversation/${newConversationId}`, {
				replace: true
			});
		},
		[folderId, navigate]
	);

	useEffect(() => {
		if (isEmpty(conversation) && conversationStatus !== API_REQUEST_STATUS.fulfilled) {
			getConvEmailStoreAction({ id: conversationId, onConversationIdChange });
		}
	}, [conversation, conversationId, conversationStatus, onConversationIdChange]);

	const showPreviewPanel = useMemo(
		(): boolean | undefined =>
			getFolderIdParts(folderId).id === FOLDERS.TRASH
				? conversation && conversation?.messageIds?.length > 0
				: filter(messages, (m) => getFolderIdParts(m.parent).id !== FOLDERS.TRASH).length > 0,
		[conversation, folderId, messages]
	);

	return (
		<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
			{showPreviewPanel && (
				<>
					{!isInsideExtraWindow && (
						<PreviewPanelHeader
							itemType={'conversation'}
							subject={conversation.subject}
							isRead={conversation.read}
							folderId={folderId}
						/>
					)}

					{conversation && conversationStatus === API_REQUEST_STATUS.fulfilled && (
						<ConversationPreviewPanel
							data-testid={`conversation-preview-panel-${conversationId}`}
							conversation={conversation}
							isInsideExtraWindow={isInsideExtraWindow}
						/>
					)}

					{(conversationStatus === API_REQUEST_STATUS.error || conversationStatus === null) && (
						<></>
					)}
				</>
			)}
		</Container>
	);
};
