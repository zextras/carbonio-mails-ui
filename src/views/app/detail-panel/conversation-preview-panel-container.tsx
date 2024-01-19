/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useEffect, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { FOLDERS, useTags, useUserSettings } from '@zextras/carbonio-shell-ui';
import { filter } from 'lodash';
import { useParams } from 'react-router-dom';

import { ConversationPreviewPanel } from './conversation-preview-panel';
import PreviewPanelHeader from './preview/preview-panel-header';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { getConv, searchConv } from '../../../store/actions';
import {
	selectConversation,
	selectConversationExpandedStatus
} from '../../../store/conversations-slice';
import type { MailsStateType } from '../../../types';
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

	const conversation = useAppSelector(selectConversation(conversationId));
	const settings = useUserSettings();
	const convSortOrder = settings.prefs.zimbraPrefConversationOrder as string;
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
