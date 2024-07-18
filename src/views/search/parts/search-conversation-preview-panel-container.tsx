/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useEffect, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { FOLDERS, useTags as _useTags, useUserSettings } from '@zextras/carbonio-shell-ui';
import { filter } from 'lodash';
import { useParams } from 'react-router-dom';

import { API_REQUEST_STATUS } from '../../../constants';
import { getFolderIdParts } from '../../../helpers/folders';
import { getConv as _getConv, searchConv as _searchConv } from '../../../store/actions';
import {
	useConversationById as _useConversationById,
	useSearchResultStatus
} from '../../../store/zustand/message-store/store';
import { Conversation } from '../../../types';
import { ConversationPreviewPanel } from '../../app/detail-panel/conversation-preview-panel';
import PreviewPanelHeader from '../../app/detail-panel/preview/preview-panel-header';
import { useExtraWindow as _useExtraWindow } from '../../app/extra-windows/use-extra-window';

type SearchConversationPreviewPanelProps = {
	conversationId?: string;
	folderId?: string;
	useExtraWindow?: typeof _useExtraWindow;
	useTags?: typeof _useTags;
	useConversationById?: typeof _useConversationById;
	useConversationStatus?: typeof useSearchResultStatus;
	getConv?: typeof _getConv;
	searchConv?: typeof _searchConv;
};

const useConversationPreviewPanelParameters = (
	props: SearchConversationPreviewPanelProps
): { conversationId: string; folderId: string } => {
	const params = useParams<{ conversationId: string; folderId: string }>();
	return {
		conversationId: props.conversationId ?? params.conversationId,
		folderId: props.folderId ?? params.folderId
	};
};
export const SearchConversationPreviewPanelContainer: FC<SearchConversationPreviewPanelProps> = (
	props
) => {
	const { conversationId, folderId } = useConversationPreviewPanelParameters(props);
	const {
		useTags = _useTags,
		useExtraWindow = _useExtraWindow,
		useConversationById = _useConversationById,
		useConversationStatus = useSearchResultStatus,
		getConv = _getConv,
		searchConv = _searchConv
	} = {
		...props
	};
	const tagsFromStore = useTags();
	const { isInsideExtraWindow } = useExtraWindow();
	const conversation = useConversationById(conversationId);
	const settings = useUserSettings();
	const convSortOrder = settings.prefs.zimbraPrefConversationOrder as string;
	useEffect(() => {
		if (!conversation) {
			getConv({ conversationId });
		}
	}, [conversation, conversationId, getConv]);

	const conversationsStatus = useConversationStatus();
	useEffect(() => {
		if (
			(conversationsStatus !== API_REQUEST_STATUS.fulfilled &&
				conversationsStatus !== API_REQUEST_STATUS.pending) ||
			!conversationsStatus
		) {
			searchConv({ conversationId, fetch: 'all', folderId, tags: tagsFromStore });
		}
	}, [conversationId, conversationsStatus, folderId, searchConv, tagsFromStore]);

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
					{!isInsideExtraWindow && <PreviewPanelHeader item={conversation} folderId={folderId} />}
					<ConversationPreviewPanel
						data-testid={`conversation-preview-panel-${conversationId}`}
						conversation={conversation as Conversation}
						isInsideExtraWindow={isInsideExtraWindow}
						convSortOrder={convSortOrder}
					/>
				</>
			)}
		</Container>
	);
};
