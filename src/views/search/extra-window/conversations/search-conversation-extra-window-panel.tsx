/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { Spinner } from 'assets/spinner';
import { API_REQUEST_STATUS } from 'constants/index';
import { useCompleteConversationOrFetch } from 'store/emails/hooks/use-complete-conversation-or-fetch';
import { ConversationMessagePreviewWrapper } from 'views/app/detail-panel/conversation-message-preview-wrapper';
import { SearchPanelHeader } from 'views/search/extra-window/search-panel-header';

type SearchConversationExtraWindowContainerPanelProps = { conversationId: string };

export const SearchConversationExtraWindowPanelContainer: FC<
	SearchConversationExtraWindowContainerPanelProps
> = ({ conversationId }) => {
	const settings = useUserSettings();
	const convSortOrder = settings.prefs.zimbraPrefConversationOrder as string;

	const { conversation, conversationStatus } = useCompleteConversationOrFetch(conversationId);

	const isExpanded = useCallback(
		(index: number): boolean => {
			if (convSortOrder === 'dateAsc') {
				return index === conversation.messageIds.length - 1;
			}
			return index === 0;
		},
		[convSortOrder, conversation.messageIds.length]
	);

	return (
		<Container
			orientation="vertical"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			data-testid={`ConversationPreview-${conversation.id}`}
		>
			<>
				<SearchPanelHeader item={conversation} />

				<Container
					style={{ overflowY: 'auto' }}
					height="fill"
					background={'gray5'}
					padding={{ horizontal: 'large', bottom: 'small', top: 'large' }}
					mainAlignment="flex-start"
				>
					<Container height="fit" mainAlignment="flex-start" background={'gray5'}>
						{conversation && conversationStatus === API_REQUEST_STATUS.fulfilled ? (
							<>
								{map(conversation.messageIds, (convMessageId, index) => (
									<ConversationMessagePreviewWrapper
										key={convMessageId}
										convMessageId={convMessageId}
										isExpanded={isExpanded(index)}
										isAlone={conversation.messageIds?.length === 1}
									/>
								))}
							</>
						) : (
							<Spinner />
						)}
					</Container>
				</Container>
			</>
		</Container>
	);
};
