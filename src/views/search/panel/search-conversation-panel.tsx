/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo } from 'react';

import { Container, Shimmer } from '@zextras/carbonio-design-system';
import { FOLDERS, useUserSettings } from '@zextras/carbonio-shell-ui';
import { filter, map } from 'lodash';
import { useParams } from 'react-router-dom';

import { SearchConversationMessagePanel } from './search-conversation-message-panel';
import { searchConvSoapAPI } from '../../../api/search-conv';
import { API_REQUEST_STATUS } from '../../../constants';
import { getFolderIdParts } from '../../../helpers/folders';
import {
	useConversationById,
	useConversationStatus,
	setConversationStatus
} from '../../../store/zustand/message-store/store';
import { handleSearchConvResponse } from '../../../store/zustand/search/hooks/hooks';
import PreviewPanelHeader from '../../app/detail-panel/preview/preview-panel-header';
import { useExtraWindow } from '../../app/extra-windows/use-extra-window';

type SearchConversationPanelProps = {
	conversationId?: string;
	folderId?: string;
};

const useConversationPreviewPanelParameters = (
	props: SearchConversationPanelProps
): { conversationId: string; folderId: string } => {
	const params = useParams<{ conversationId: string; folderId: string }>();
	return {
		conversationId: props.conversationId ?? params.conversationId,
		folderId: props.folderId ?? params.folderId
	};
};

export const SearchConversationPanel: FC<SearchConversationPanelProps> = (props) => {
	const { conversationId, folderId } = useConversationPreviewPanelParameters(props);

	const { isInsideExtraWindow } = useExtraWindow();
	const conversation = useConversationById(conversationId);
	const settings = useUserSettings();
	const convSortOrder = settings.prefs.zimbraPrefConversationOrder as string;

	const conversationStatus = useConversationStatus(conversationId);
	useEffect(() => {
		if (!conversationStatus) {
			setConversationStatus(conversationId, API_REQUEST_STATUS.pending);
			searchConvSoapAPI({ conversationId, fetch: 'all', folderId }).then((response) => {
				if ('Fault' in response) {
					setConversationStatus(conversationId, API_REQUEST_STATUS.error);
					return;
				}
				handleSearchConvResponse(conversationId, response);
				setConversationStatus(conversationId, API_REQUEST_STATUS.fulfilled);
			});
		}
	}, [conversation, conversationId, conversationStatus, folderId]);

	const showPreviewPanel = useMemo(
		(): boolean | undefined =>
			getFolderIdParts(folderId).id === FOLDERS.TRASH
				? conversation && conversation?.messages?.length > 0
				: filter(conversation?.messages, (m) => getFolderIdParts(m.parent).id !== FOLDERS.TRASH)
						.length > 0,
		[conversation, folderId]
	);

	const isExpanded = useCallback(
		(index: number): boolean => {
			if (convSortOrder === 'dateAsc') {
				return index === conversation.messages.length - 1;
			}
			return index === 0;
		},
		[convSortOrder, conversation.messages.length]
	);

	const { messages } = conversation;

	return (
		<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
			{showPreviewPanel && (
				<>
					{!isInsideExtraWindow && <PreviewPanelHeader item={conversation} folderId={folderId} />}
					<Container
						style={{ overflowY: 'auto' }}
						height="fill"
						background="gray5"
						padding={{ horizontal: 'large', bottom: 'small', top: 'large' }}
						mainAlignment="flex-start"
					>
						<Container height="fit" mainAlignment="flex-start" background="gray5">
							{conversation && conversationStatus ? (
								<>
									{map(messages, (message, index) =>
										message ? (
											<SearchConversationMessagePanel
												key={message.id}
												convMessage={message}
												isExpanded={isExpanded(index)}
												isAlone={conversation.messages?.length === 1}
												isInsideExtraWindow={isInsideExtraWindow}
											/>
										) : (
											<Shimmer.Logo size="large" />
										)
									)}
								</>
							) : (
								<></>
							)}
						</Container>
					</Container>
				</>
			)}
		</Container>
	);
};
