/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { Container, Shimmer } from '@zextras/carbonio-design-system';
import { FOLDERS, useUserSettings } from '@zextras/carbonio-shell-ui';
import { filter, map } from 'lodash';
import { useParams } from 'react-router-dom';

import { SearchConversationMessagePanel } from './search-conversation-message-panel';
import { searchConvSoapAPI } from '../../../api/search-conv';
import { API_REQUEST_STATUS } from '../../../constants';
import { getFolderIdParts } from '../../../helpers/folders';
import { useConversationById } from '../../../store/zustand/message-store/store';
import { handleSearchConvResponse } from '../../../store/zustand/search/hooks/hooks';
import { SearchRequestStatus } from '../../../types';
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
	const [apiCallStatus, setApiCallStatus] = useState<SearchRequestStatus>(null);

	const { isInsideExtraWindow } = useExtraWindow();
	const conversation = useConversationById(conversationId);
	const settings = useUserSettings();
	const convSortOrder = settings.prefs.zimbraPrefConversationOrder as string;

	useEffect(() => {
		if (!apiCallStatus) {
			setApiCallStatus(API_REQUEST_STATUS.pending);
			searchConvSoapAPI({ conversationId, fetch: 'all', folderId })
				.then((response) => {
					if ('Fault' in response) {
						setApiCallStatus(API_REQUEST_STATUS.error);
						return;
					}
					handleSearchConvResponse(conversationId, response);
					setApiCallStatus(API_REQUEST_STATUS.fulfilled);
				})
				.catch(() => {
					setApiCallStatus(API_REQUEST_STATUS.error);
				});
		}
	}, [apiCallStatus, conversation, conversationId, folderId]);

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
	useEffect(() => {
		console.log('====================', apiCallStatus);
	}, [apiCallStatus]);

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
							{conversation && apiCallStatus === API_REQUEST_STATUS.fulfilled && (
								<>
									{map(messages, (message, index) => (
										<SearchConversationMessagePanel
											key={message.id}
											convMessage={message}
											isExpanded={isExpanded(index)}
											isAlone={conversation.messages?.length === 1}
											isInsideExtraWindow={isInsideExtraWindow}
										/>
									))}
								</>
							)}
							{apiCallStatus === API_REQUEST_STATUS.pending && (
								<Shimmer.Logo size="large" data-testid={`shimmer-conversation-${conversationId}`} />
							)}
							{(apiCallStatus === API_REQUEST_STATUS.error || apiCallStatus === null) && (
								<div data-testid="empty-fragment" />
							)}
						</Container>
					</Container>
				</>
			)}
		</Container>
	);
};
