/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { SnackbarManagerContext, useModal } from '@zextras/carbonio-design-system';
import { FOLDERS, useAppContext, useTags, useUserAccount } from '@zextras/carbonio-shell-ui';
import { includes } from 'lodash';
import { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useSelection } from './useSelection';
import { MailMessage } from '../types/mail-message';
import {
	deleteMsg,
	editAsNewMsg,
	editDraft,
	forwardMsg,
	moveMsgToTrash,
	redirectMsg,
	replyAllMsg,
	replyMsg,
	sendDraft,
	setMsgFlag,
	setMsgAsSpam,
	printMsg,
	showOriginalMsg,
	setMsgRead,
	moveMessageToFolder,
	deleteMessagePermanently
} from '../ui-actions/message-actions';
import { applyTag } from '../ui-actions/tag-actions';

export const useMessageActions = (message: MailMessage): Array<any> => {
	const [t] = useTranslation();
	const { folderId }: { folderId: string } = useParams();
	const createSnackbar = useContext(SnackbarManagerContext);
	const dispatch = useDispatch();
	const createModal = useModal();
	const { setCount } = useAppContext() as { setCount: () => void };
	const { deselectAll } = useSelection(folderId, setCount);

	const account = useUserAccount();

	const systemFolders = useMemo(
		() => [FOLDERS.INBOX, FOLDERS.SENT, FOLDERS.DRAFTS, FOLDERS.TRASH, FOLDERS.SPAM],
		[]
	);
	const tags = useTags();
	const arr = [];

	if (message.parent === FOLDERS.DRAFTS) {
		arr.push(sendDraft({ id: message.id, message, t, dispatch }));
		arr.push(editDraft({ id: message.id, folderId, t }));
		arr.push(
			moveMsgToTrash({
				ids: [message.id],
				t,
				dispatch,
				createSnackbar,
				deselectAll,
				folderId,
				conversationId: message.conversation
			})
		);
		arr.push(setMsgFlag({ ids: [message.id], value: message.flagged, t, dispatch }));
		arr.push(applyTag({ t, tags, conversation: message, isMessage: true }));
	}
	if (
		message.parent === FOLDERS.INBOX ||
		message.parent === FOLDERS.SENT ||
		!includes(systemFolders, message.parent)
	) {
		// INBOX, SENT OR CREATED_FOLDER
		arr.push(replyMsg({ id: message.id, folderId, t }));
		arr.push(replyAllMsg({ id: message.id, folderId, t }));
		arr.push(forwardMsg({ id: message.id, folderId, t }));
		arr.push(
			moveMsgToTrash({
				ids: [message.id],
				t,
				dispatch,
				createSnackbar,
				deselectAll,
				folderId,
				conversationId: message.conversation
			})
		);
		arr.push(
			setMsgRead({
				ids: [message.id],
				value: message.read,
				t,
				dispatch,
				folderId,
				shouldReplaceHistory: true,
				deselectAll
			})
		);
		arr.push(
			moveMessageToFolder({
				id: [message.id],
				t,
				dispatch,
				isRestore: false,
				createModal,
				deselectAll
			})
		);

		arr.push(applyTag({ t, tags, conversation: message, isMessage: true }));
		arr.push(printMsg({ t, message, account }));
		arr.push(setMsgFlag({ ids: [message.id], value: message.flagged, t, dispatch }));
		arr.push(redirectMsg({ id: message.id, t, createModal }));
		arr.push(editAsNewMsg({ id: message.id, folderId, t }));
		arr.push(
			setMsgAsSpam({ ids: [message.id], value: false, t, dispatch, createSnackbar, folderId })
		);
		arr.push(showOriginalMsg({ id: message.id, t }));
	}

	if (message.parent === FOLDERS.TRASH) {
		arr.push(
			moveMessageToFolder({
				id: [message.id],
				t,
				dispatch,
				isRestore: true,
				createModal,
				deselectAll
			})
		);
		arr.push(
			deleteMessagePermanently({ ids: [message.id], t, dispatch, createModal, deselectAll })
		);
		arr.push(applyTag({ t, tags, conversation: message, isMessage: true }));
	}
	if (message.parent === FOLDERS.SPAM) {
		arr.push(deleteMsg({ ids: [message.id], t, dispatch, createSnackbar, createModal }));
		arr.push(
			setMsgAsSpam({ ids: [message.id], value: true, t, dispatch, createSnackbar, folderId })
		);
		arr.push(printMsg({ t, message, account }));
		arr.push(showOriginalMsg({ id: message.id, t }));
		arr.push(applyTag({ t, tags, conversation: message, isMessage: true }));
	}
	return arr;
};
