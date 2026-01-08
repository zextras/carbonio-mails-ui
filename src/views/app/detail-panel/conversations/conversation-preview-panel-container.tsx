/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { filter, isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { ConversationPreviewPanel } from './conversation-preview-panel';
import { Spinner } from '../../../../assets/spinner';
import { API_REQUEST_STATUS } from '../../../../constants';
import { isFocusModeMailView } from '../../../../helpers/external-tabs';
import { getFolderIdParts } from '../../../../helpers/folders';
import { getConvEmailStoreAction } from '../../../../store/emails/actions/get-conv-action';
import { useCompleteConversationOrFetch } from '../../../../store/emails/hooks/hooks';
import { useConversationMessages } from '../../../../store/emails/store';
import type {
	DetailPanelConversationRouteParams,
	DetailPanelRoutesParams
} from '../../../../types/routes';
import { DetailPanelContainer } from '../../../parts/detail-panel-container';
import { PreviewPanelHeader } from '../preview/preview-panel-header';

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

	const showPreviewPanel = useMemo((): boolean | undefined => {
		if (isFocusModeMailView() || getFolderIdParts(folderId).id === FOLDERS.TRASH) {
			return conversation && conversation?.messageIds?.length > 0;
		}
		return filter(messages, (m) => getFolderIdParts(m.parent).id !== FOLDERS.TRASH).length > 0;
	}, [conversation, folderId, messages]);

	// TODO: early return if no such conversation
	if (!conversation) {
		// navigate(`/`, { replace: true });
		return <></>;
	}

	return (
		<DetailPanelContainer>
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
						<Spinner
							text={t('displayer.loading_conversation', 'Loading conversation, please wait...')}
						/>
					)}
				</>
			)}
		</DetailPanelContainer>
	);
};
