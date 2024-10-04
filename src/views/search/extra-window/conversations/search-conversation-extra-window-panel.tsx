/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback } from 'react';

import { Container, Shimmer } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { API_REQUEST_STATUS } from '../../../../constants';
import { useCompleteConversation } from '../../../../store/zustand/search/hooks/hooks';
import { ConversationMessagePreview } from '../../../app/detail-panel/conversation-message-preview';
import { useExtraWindow } from '../../../app/extra-windows/use-extra-window';
import { SearchExtraWindowPanelHeader } from '../search-extra-window-panel-header';

type SearchConversationExtraWindowContainerPanelProps = { conversationId: string };

export const SearchConversationExtraWindowPanelContainer: FC<
	SearchConversationExtraWindowContainerPanelProps
> = ({ conversationId }) => {
	const { isInsideExtraWindow } = useExtraWindow();

	const settings = useUserSettings();
	const convSortOrder = settings.prefs.zimbraPrefConversationOrder as string;

	const { conversation, conversationStatus } = useCompleteConversation(conversationId);

	const isExpanded = useCallback(
		(index: number): boolean => {
			if (convSortOrder === 'dateAsc') {
				return index === conversation.messages.length - 1;
			}
			return index === 0;
		},
		[convSortOrder, conversation.messages.length]
	);

	return (
		<Container
			orientation="vertical"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			data-testid={`ConversationPreview-${conversation.id}`}
		>
			<>
				{!isInsideExtraWindow && <SearchExtraWindowPanelHeader item={conversation} />}

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
								{map(conversation.messages, (message, index) =>
									message ? (
										<ConversationMessagePreview
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
		</Container>
	);
};
