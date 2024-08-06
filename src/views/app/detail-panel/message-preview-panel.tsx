/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo } from 'react';

import { Container, Padding } from '@zextras/carbonio-design-system';
import { replaceHistory, useUserSettings } from '@zextras/carbonio-shell-ui';
import { findIndex, uniqBy } from 'lodash';

import MailPreview from './preview/mail-preview';
import PreviewPanelHeader from './preview/preview-panel-header';
import { EXTRA_WINDOW_ACTION_ID, SEARCHED_FOLDER_STATE_STATUS } from '../../../constants';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useFolderSortedMessages } from '../../../hooks/use-folder-sorted-messages';
import { getMsg } from '../../../store/actions';
import { selectFolderMsgSearchStatus, selectMessage } from '../../../store/messages-slice';
import type { MailsStateType, MessageAction } from '../../../types';
import { setMsgRead } from '../../../ui-actions/message-actions';
import { useExtraWindow } from '../extra-windows/use-extra-window';

export type MessagePreviewPanelProps = {
	folderId: string;
	messageId: string;
	messageActions: Array<MessageAction>;
};

export const MessagePreviewPanel: FC<MessagePreviewPanelProps> = ({
	folderId,
	messageId,
	messageActions
}) => {
	const { isInsideExtraWindow } = useExtraWindow();
	const dispatch = useAppDispatch();

	const isExtraWindowActions = messageActions.some(
		(action: MessageAction) => action.id === EXTRA_WINDOW_ACTION_ID
	);

	const actions = isExtraWindowActions
		? messageActions.filter((action: MessageAction) => action.id !== EXTRA_WINDOW_ACTION_ID)
		: uniqBy([...messageActions[0], ...messageActions[1]], 'id');

	const messages = useFolderSortedMessages(folderId);
	const message = useAppSelector((state: MailsStateType) => selectMessage(state, messageId));
	const messageIndex = findIndex(messages, (msg) => msg.id === messageId);
	const zimbraPrefMarkMsgRead = useUserSettings()?.prefs?.zimbraPrefMarkMsgRead !== '-1';
	const searchedInFolderStatus = useAppSelector(selectFolderMsgSearchStatus(folderId));

	const hasMore = useMemo(
		() => searchedInFolderStatus === SEARCHED_FOLDER_STATE_STATUS.hasMore,
		[searchedInFolderStatus]
	);
	const isTheFirstListItem = useMemo(() => messageIndex <= 0, [messageIndex]);
	const isTheLastListItem = useMemo(
		() => messageIndex === messages.length - 1 && !hasMore,
		[hasMore, messageIndex, messages.length]
	);
	const isLoadMoreNeeded = useMemo(
		() => messageIndex === messages.length - 1 && hasMore,
		[hasMore, messageIndex, messages.length]
	);
	const onGoForward = useCallback(() => {
		if (isTheLastListItem) return;
		if (isLoadMoreNeeded) {
			// todo: implement loadMore
		}
		const nextIndex = messageIndex + 1;
		const newMsg = messages[nextIndex];
		if (newMsg.read === false && zimbraPrefMarkMsgRead) {
			setMsgRead({ ids: [newMsg.id], value: false, dispatch }).onClick();
		}
		replaceHistory(`/folder/${folderId}/message/${newMsg.id}`);
	}, [
		isTheLastListItem,
		isLoadMoreNeeded,
		messageIndex,
		messages,
		zimbraPrefMarkMsgRead,
		folderId,
		dispatch
	]);

	const onGoBack = useCallback(() => {
		if (isTheFirstListItem) return;
		const nextIndex = messageIndex - 1;
		const newMsg = messages[nextIndex];
		if (newMsg.read === false && zimbraPrefMarkMsgRead) {
			setMsgRead({ ids: [newMsg.id], value: false, dispatch }).onClick();
		}
		replaceHistory(`/folder/${folderId}/message/${newMsg.id}`);
	}, [isTheFirstListItem, messageIndex, messages, zimbraPrefMarkMsgRead, folderId, dispatch]);

	useEffect(() => {
		if (!message?.isComplete) {
			dispatch(getMsg({ msgId: messageId }));
		}
	}, [dispatch, folderId, message, messageId]);

	return (
		<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
			{message && (
				<>
					{!isInsideExtraWindow && (
						<PreviewPanelHeader
							onGoForward={isTheLastListItem ? undefined : onGoForward}
							onGoBack={isTheFirstListItem ? undefined : onGoBack}
							subject={message.subject}
							isRead={message.read}
							folderId={folderId}
						/>
					)}
					<Container
						style={{ overflowY: 'auto' }}
						height="fill"
						background="gray5"
						padding={{ horizontal: 'large', bottom: 'small', top: 'large' }}
						mainAlignment="flex-start"
					>
						<Container height="fit" mainAlignment="flex-start" background="gray5">
							<Padding bottom="medium" width="100%">
								<MailPreview
									message={message}
									expanded
									isAlone
									messageActions={actions}
									isMessageView
									isInsideExtraWindow={isInsideExtraWindow}
								/>
							</Padding>
						</Container>
					</Container>
				</>
			)}
		</Container>
	);
};
