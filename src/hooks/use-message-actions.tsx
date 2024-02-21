/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { FOLDERS, useAppContext, useTags } from '@zextras/carbonio-shell-ui';
import { includes } from 'lodash';
import { useParams } from 'react-router-dom';

import { useAppDispatch } from './redux';
import { useSelection } from './use-selection';
import { EXTRA_WINDOW_ACTION_ID } from '../constants';
import type { AppContext, MailMessage, MessageAction } from '../types';
import {
	deleteMessagePermanently,
	deleteMsg,
	downloadEml,
	editAsNewMsg,
	editDraft,
	forwardMsg,
	moveMessageToFolder,
	moveMsgToTrash,
	previewMessageOnSeparatedWindow,
	printMsg,
	redirectMsg,
	replyAllMsg,
	replyMsg,
	sendDraft,
	setMsgAsSpam,
	setMsgFlag,
	setMsgRead,
	showOriginalMsg
} from '../ui-actions/message-actions';
import { applyTag } from '../ui-actions/tag-actions';
import { useExtraWindowsManager } from '../views/app/extra-windows/extra-window-manager';
import { useExtraWindow } from '../views/app/extra-windows/use-extra-window';

/*
 * FIXME this hook is used only by the displayer. It should be aligned/merged with
 * 	the others functions that are providing primary and secondary actions for a message
 *
 * FIXME the folder id comparisons are weak: they're not working for shared folders nor for subfolders.
 *  Consider using/creating common utility functions
 */
export const useMessageActions = (
	message: MailMessage | undefined,
	isAlone = false
): Array<MessageAction> => {
	const { folderId }: { folderId: string } = useParams();
	const dispatch = useAppDispatch();
	const { setCount } = useAppContext<AppContext>();
	const { deselectAll } = useSelection({ currentFolderId: folderId, setCount, count: 0 });
	const { isInsideExtraWindow } = useExtraWindow();
	const { createWindow } = useExtraWindowsManager();

	const systemFolders = useMemo(
		() => [FOLDERS.INBOX, FOLDERS.SENT, FOLDERS.DRAFTS, FOLDERS.TRASH, FOLDERS.SPAM],
		[]
	);
	const tags = useTags();
	const actions: Array<MessageAction> = [{ id: EXTRA_WINDOW_ACTION_ID }];

	if (!message) {
		return [];
	}

	if (message.parent === FOLDERS.DRAFTS) {
		!isInsideExtraWindow && actions.push(sendDraft({ message, dispatch }));
		!isInsideExtraWindow && actions.push(editDraft({ id: message.id, folderId, message }));
		!isInsideExtraWindow &&
			actions.push(
				moveMsgToTrash({
					ids: [message.id],
					dispatch,
					deselectAll,
					folderId,
					conversationId: message?.conversation,
					closeEditor: isAlone
				})
			);
		actions.push(setMsgFlag({ ids: [message.id], value: message.flagged, dispatch }));
		actions.push(applyTag({ tags, conversation: message, isMessage: true }));
	}

	if (
		message.parent === FOLDERS.INBOX ||
		message.parent === FOLDERS.SENT ||
		!includes(systemFolders, message.parent)
	) {
		// INBOX, SENT OR CREATED_FOLDER
		!isInsideExtraWindow && actions.push(replyMsg({ id: message.id, folderId }));
		!isInsideExtraWindow && actions.push(replyAllMsg({ id: message.id, folderId }));
		!isInsideExtraWindow && actions.push(forwardMsg({ id: message.id, folderId }));
		!isInsideExtraWindow &&
			actions.push(
				moveMsgToTrash({
					ids: [message.id],
					dispatch,
					deselectAll,
					folderId,
					conversationId: message?.conversation,
					closeEditor: isAlone
				})
			);
		actions.push(
			setMsgRead({
				ids: [message.id],
				value: message.read,
				dispatch,
				folderId,
				shouldReplaceHistory: true,
				deselectAll
			})
		);
		!isInsideExtraWindow &&
			actions.push(
				moveMessageToFolder({
					id: [message.id],
					folderId,
					dispatch,
					isRestore: false,
					deselectAll
				})
			);

		actions.push(applyTag({ tags, conversation: message, isMessage: true }));
		actions.push(printMsg({ message }));
		actions.push(setMsgFlag({ ids: [message.id], value: message.flagged, dispatch }));
		!isInsideExtraWindow && actions.push(redirectMsg({ id: message.id }));
		!isInsideExtraWindow && actions.push(editAsNewMsg({ id: message.id, folderId }));
		!isInsideExtraWindow &&
			actions.push(setMsgAsSpam({ ids: [message.id], value: false, dispatch, folderId }));
		actions.push(showOriginalMsg({ id: message.id }));
		actions.push(downloadEml({ id: message.id }));
	}

	if (message.parent === FOLDERS.TRASH) {
		!isInsideExtraWindow &&
			actions.push(
				moveMessageToFolder({
					id: [message.id],
					folderId,
					dispatch,
					isRestore: true,
					deselectAll
				})
			);
		!isInsideExtraWindow &&
			actions.push(deleteMessagePermanently({ ids: [message.id], dispatch, deselectAll }));
		actions.push(applyTag({ tags, conversation: message, isMessage: true }));
	}

	if (message.parent === FOLDERS.SPAM) {
		!isInsideExtraWindow &&
			actions.push(
				deleteMsg({
					ids: [message.id],
					dispatch
				})
			);
		!isInsideExtraWindow &&
			actions.push(setMsgAsSpam({ ids: [message.id], value: true, dispatch, folderId }));
		actions.push(printMsg({ message }));
		actions.push(showOriginalMsg({ id: message.id }));
		actions.push(applyTag({ tags, conversation: message, isMessage: true }));
	}

	!isInsideExtraWindow &&
		actions.push(
			previewMessageOnSeparatedWindow(message.id, folderId, message.subject, createWindow, actions)
		);
	actions.push(downloadEml({ id: message.id }));

	return actions;
};
