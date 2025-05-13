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
import { Spinner } from '../../../assets/spinner';
import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { API_REQUEST_STATUS } from '../../../constants';
import { isFocusModeMailView } from '../../../helpers/external-tabs';
import { getFolderIdParts } from '../../../helpers/folders';
import { getConvEmailStoreAction } from '../../../store/emails/actions/get-conv-action';
import { useCompleteConversationOrFetch } from '../../../store/emails/hooks/hooks';
import { useConversationMessages } from '../../../store/emails/store';

export const ConversationPreviewPanelContainer = (): React.JSX.Element => {
	const navigate = useNavigate();
	const { conversationId, folderId } = useParams() as {
		conversationId: string;
		folderId: string;
	};
	const { conversation, conversationStatus } = useCompleteConversationOrFetch(conversationId);
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

	useEffect(() => {
		if (isEmpty(conversation) && conversationStatus !== API_REQUEST_STATUS.fulfilled) {
			getConvEmailStoreAction({ id: conversationId, onConversationIdChange });
		}
	}, [conversation, conversationId, conversationStatus, onConversationIdChange]);

	useEffect(() => {
		if (isFocusModeMailView() && conversation?.subject) {
			document.title = conversation.subject;
		}
	}, [conversation?.subject]);

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
					<PreviewPanelHeader
						itemType={'conversation'}
						subject={conversation.subject}
						isRead={conversation.read}
						folderId={folderId}
					/>

					{conversation && conversationStatus === API_REQUEST_STATUS.fulfilled && (
						<ConversationPreviewPanel
							data-testid={`conversation-preview-panel-${conversationId}`}
							conversation={conversation}
						/>
					)}

					{(conversationStatus === API_REQUEST_STATUS.error || conversationStatus === null) && (
						<></>
					)}
					{conversationStatus === API_REQUEST_STATUS.pending && (
						<Spinner text={'Loading message, please wait...'} />
					)}
				</>
			)}
		</Container>
	);
};
