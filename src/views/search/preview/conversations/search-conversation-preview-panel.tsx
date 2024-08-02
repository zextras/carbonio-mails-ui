/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';

import { SearchConversationPreviewPanel } from './search-conversation-panel';
import { useCompleteConversation } from '../../../../store/zustand/search/hooks/hooks';
import { useExtraWindow } from '../../../app/extra-windows/use-extra-window';
import { SearchPreviewPanelHeader } from '../search-preview-panel-header';

type SearchConversationPreviewPanelProps = { conversationId: string };

export const SearchConversationPreviewPanelContainer: FC<SearchConversationPreviewPanelProps> = ({
	conversationId
}) => {
	const { isInsideExtraWindow } = useExtraWindow();

	const settings = useUserSettings();
	const convSortOrder = settings.prefs.zimbraPrefConversationOrder as string;

	const { conversation } = useCompleteConversation(conversationId);

	return (
		<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
			<>
				{!isInsideExtraWindow && <SearchPreviewPanelHeader item={conversation} />}
				<SearchConversationPreviewPanel
					data-testid={`conversation-preview-panel-${conversationId}`}
					conversation={conversation}
					isInsideExtraWindow={isInsideExtraWindow}
					convSortOrder={convSortOrder}
				/>
			</>
		</Container>
	);
};
