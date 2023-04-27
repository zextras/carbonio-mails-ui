/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FOLDERS, useAppContext, useTags, useUserAccount } from '@zextras/carbonio-shell-ui';
import { includes } from 'lodash';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import type { AppContext, MailMessage } from '../types';
import {
	deleteMessagePermanently,
	deleteMsg,
	editAsNewMsg,
	editDraft,
	forwardMsg,
	moveMessageToFolder,
	moveMsgToTrash,
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
import { useAppDispatch } from './redux';
import { useSelection } from './use-selection';

export const useMessageActions = (message: MailMessage, isAlone = false): Array<any> => {
	const { folderId }: { folderId: string } = useParams();
	const dispatch = useAppDispatch();
	const { setCount } = useAppContext<AppContext>();
	const { deselectAll } = useSelection({ currentFolderId: folderId, setCount, count: 0 });

	const account = useUserAccount();

	const systemFolders = useMemo(
		() => [FOLDERS.INBOX, FOLDERS.SENT, FOLDERS.DRAFTS, FOLDERS.TRASH, FOLDERS.SPAM],
		[]
	);
	const tags = useTags();
	const arr = [];

	if (message.parent === FOLDERS.DRAFTS) {
		arr.push(sendDraft({ id: message.id, message, dispatch }));
		arr.push(editDraft({ id: message.id, folderId, message }));
		arr.push(
			moveMsgToTrash({
				ids: [message.id],
				dispatch,
				deselectAll,
				folderId,
				conversationId: message?.conversation,
				closeEditor: isAlone
			})
		);
		arr.push(setMsgFlag({ ids: [message.id], value: message.flagged, dispatch }));
		arr.push(applyTag({ tags, conversation: message, isMessage: true }));
	}
	if (
		message.parent === FOLDERS.INBOX ||
		message.parent === FOLDERS.SENT ||
		!includes(systemFolders, message.parent)
	) {
		// INBOX, SENT OR CREATED_FOLDER
		arr.push(replyMsg({ id: message.id, folderId }));
		arr.push(replyAllMsg({ id: message.id, folderId }));
		arr.push(forwardMsg({ id: message.id, folderId }));
		arr.push(
			moveMsgToTrash({
				ids: [message.id],
				dispatch,
				deselectAll,
				folderId,
				conversationId: message?.conversation,
				closeEditor: isAlone
			})
		);
		arr.push(
			setMsgRead({
				ids: [message.id],
				value: message.read,
				dispatch,
				folderId,
				shouldReplaceHistory: true,
				deselectAll
			})
		);
		arr.push(
			moveMessageToFolder({
				id: [message.id],
				folderId,
				dispatch,
				isRestore: false,
				deselectAll
			})
		);

		arr.push(applyTag({ tags, conversation: message, isMessage: true }));
		arr.push(printMsg({ message, account }));
		arr.push(setMsgFlag({ ids: [message.id], value: message.flagged, dispatch }));
		arr.push(redirectMsg({ id: message.id }));
		arr.push(editAsNewMsg({ id: message.id, folderId }));
		arr.push(setMsgAsSpam({ ids: [message.id], value: false, dispatch, folderId }));
		arr.push(showOriginalMsg({ id: message.id }));
	}

	if (message.parent === FOLDERS.TRASH) {
		arr.push(
			moveMessageToFolder({
				id: [message.id],
				folderId,
				dispatch,
				isRestore: true,
				deselectAll
			})
		);
		arr.push(deleteMessagePermanently({ ids: [message.id], dispatch, deselectAll }));
		arr.push(applyTag({ tags, conversation: message, isMessage: true }));
	}
	if (message.parent === FOLDERS.SPAM) {
		arr.push(
			deleteMsg({
				ids: [message.id],
				dispatch
			})
		);
		arr.push(setMsgAsSpam({ ids: [message.id], value: true, dispatch, folderId }));
		arr.push(printMsg({ message, account }));
		arr.push(showOriginalMsg({ id: message.id }));
		arr.push(applyTag({ tags, conversation: message, isMessage: true }));
	}
	return arr;
};
