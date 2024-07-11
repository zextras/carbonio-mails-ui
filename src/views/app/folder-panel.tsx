/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-nested-ternary */

import React, { FC, useEffect } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useAppContext } from '@zextras/carbonio-shell-ui';
import { isNil } from 'lodash';
import { useParams } from 'react-router-dom';

import { ConversationList } from './folder-panel/conversations/conversation-list';
import { MessageList } from './folder-panel/messages/message-list';
import { useAppDispatch } from '../../hooks/redux';
import type { AppContext } from '../../types';
import ShimmerList from '../search/shimmer-list';
import { FOLDERS } from '../../carbonio-ui-commons/constants/folders';

const FolderPanel: FC = () => {
	const { folderId } = useParams<{ folderId: string }>();
	const dispatch = useAppDispatch();
	const { isMessageView } = useAppContext<AppContext>();

	useEffect(() => {
		if (folderId) {
			dispatch({
				type: 'conversations/setCurrentFolder',
				payload: folderId
			});
		}
	}, [folderId, dispatch]);

	return isNil(isMessageView) ? (
		<ShimmerList />
	) : (
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
				{isMessageView || folderId === FOLDERS.DRAFTS ? <MessageList /> : <ConversationList />}
			</Container>
		</Container>
	);
};

export default FolderPanel;
