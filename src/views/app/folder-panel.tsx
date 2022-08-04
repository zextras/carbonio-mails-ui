/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-nested-ternary */

import React, { FC, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { FOLDERS, useAppContext } from '@zextras/carbonio-shell-ui';
import { Container } from '@zextras/carbonio-design-system';
import { isNil } from 'lodash';
import { ActionsContextProvider } from '../../commons/actions-context';
import ConversationList from './folder-panel/conversation-list';
import MessageList from './folder-panel/message-list';
import ShimmerList from '../search/shimmer-list';


const FolderPanel:FC=()=> {
	const { folderId } = useParams<{folderId:string}>();
	const dispatch = useDispatch();
	const { isMessageView } = useAppContext();

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
		<ActionsContextProvider isConversation={!isMessageView} folderId={folderId}>
			<Container
				orientation="row"
				crossAlignment="flex-start"
				mainAlignment="flex-start"
				width="fill"
				background="gray6"
				borderRadius="none"
				style={{
					maxHeight: '100%'
				}}
			>
				<Container mainAlignment="flex-start" borderRadius="none" data-testid="list-wrapper">
					{isMessageView || folderId === FOLDERS.DRAFTS ? <MessageList /> : <ConversationList />}
				</Container>
			</Container>
		</ActionsContextProvider>
	);
}

export default FolderPanel