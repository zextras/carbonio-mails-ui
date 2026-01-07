/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-nested-ternary */

import React from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useParams } from 'react-router-dom';

import { ConversationList } from './conversations/conversation-list';
import { MessageList } from './messages/message-list';
import { isDraft, isTrash } from '../../../helpers/folders';
import type { FolderPanelRouteParams } from '../../../types/routes';
import { useIsMessageView } from '../../search/search-view-hooks';

const FolderPanel = (): React.JSX.Element => {
	const { folderId } = useParams<FolderPanelRouteParams>() as FolderPanelRouteParams;
	const isMessageView = useIsMessageView();

	return (
		<Container
			orientation="row"
			crossAlignment="flex-start"
			mainAlignment="flex-start"
			width="fill"
			background={'gray6'}
			borderRadius="none"
			style={{
				maxHeight: '100%'
			}}
		>
			<Container mainAlignment="flex-start" borderRadius="none" data-testid="list-wrapper">
				{isMessageView || isDraft(folderId) || isTrash(folderId) ? (
					<MessageList />
				) : (
					<ConversationList />
				)}
			</Container>
		</Container>
	);
};

export default FolderPanel;
