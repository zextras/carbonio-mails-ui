/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-nested-ternary */

import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { FOLDERS, useAppContext } from '@zextras/carbonio-shell-ui';
import { Container } from '@zextras/carbonio-design-system';
import { ActionsContextProvider } from '../../commons/actions-context';
import ConversationList from './folder-panel/conversation-list';
import MessageList from './folder-panel/message-list';

export default function FolderPanel() {
	const { folderId } = useParams();
	const { isMessageView } = useAppContext();
	const dispatch = useDispatch();

	useEffect(() => {
		if (folderId) {
			dispatch({
				type: 'conversations/setCurrentFolder',
				payload: folderId
			});
		}
	}, [folderId, dispatch]);

	return (
		<ActionsContextProvider isConversation={!isMessageView} folderId={folderId}>
			<Container
				orientation="row"
				crossAlignment="flex-start"
				mainAlignment="flex-start"
				width="fill"
				height="fill"
				background="gray6"
				borderRadius="none"
				style={{
					maxHeight: '100%'
				}}
			>
				<Container mainAlignment="flex-start" borderRadius="none" height="calc(100% - 64px)">
					{isMessageView || folderId === FOLDERS.DRAFTS ? <MessageList /> : <ConversationList />}
				</Container>
			</Container>
		</ActionsContextProvider>
	);
}
