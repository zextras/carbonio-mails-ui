/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { replaceHistory } from '@zextras/carbonio-shell-ui';
import { debounce, filter, isEmpty } from 'lodash';
import { useParams } from 'react-router-dom';

import { ConversationPreviewPanel } from './conversation-preview-panel';
import PreviewPanelHeader from './preview/preview-panel-header';
import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { API_REQUEST_STATUS, DEFAULT_API_DEBOUNCE_TIME } from '../../../constants';
import { getFolderIdParts } from '../../../helpers/folders';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { getConv, searchConv } from '../../../store/actions';
import {
	selectConversation,
	selectConversationExpandedStatus
} from '../../../store/conversations-slice';
import type { MailsStateType } from '../../../types';
import { useExtraWindow } from '../extra-windows/use-extra-window';

type ConversationPreviewPanelProps = { conversationId?: string; folderId?: string };

export const useConversationPreviewPanelParameters = (
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
	const { isInsideExtraWindow } = useExtraWindow();
	const dispatch = useAppDispatch();
	const conversationsStatus = useAppSelector((state: MailsStateType) =>
		selectConversationExpandedStatus(state, conversationId)
	);
	const conversation = useAppSelector(selectConversation(conversationId));

	const onConversationIdChange = useCallback(
		(newConversationId: string): void => {
			replaceHistory(`/folder/${folderId}/conversation/${newConversationId}`);
		},
		[folderId]
	);

	useEffect(() => {
		if (isEmpty(conversation)) {
			dispatch(getConv({ conversationId, onConversationIdChange }));
		}
	}, [conversation, dispatch, conversationId, onConversationIdChange]);

	const requestDebouncedConversation = useMemo(
		() =>
			debounce(
				() => {
					if (
						(conversationsStatus !== API_REQUEST_STATUS.fulfilled &&
							conversationsStatus !== API_REQUEST_STATUS.pending) ||
						!conversationsStatus
					) {
						dispatch(searchConv({ conversationId, fetch: 'all', folderId }));
					}
				},
				DEFAULT_API_DEBOUNCE_TIME,
				{ leading: false, trailing: true }
			),
		[conversationId, conversationsStatus, dispatch, folderId]
	);

	useEffect(() => {
		requestDebouncedConversation();
		return () => requestDebouncedConversation.cancel();
	}, [requestDebouncedConversation]);

	const showPreviewPanel = useMemo(
		(): boolean | undefined =>
			getFolderIdParts(folderId).id === FOLDERS.TRASH
				? conversation && conversation?.messages?.length > 0
				: filter(conversation?.messages, (m) => getFolderIdParts(m.parent).id !== FOLDERS.TRASH)
						.length > 0,
		[conversation, folderId]
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
					<ConversationPreviewPanel
						conversation={conversation}
						isInsideExtraWindow={isInsideExtraWindow}
					/>
				</>
			)}
		</Container>
	);
};
