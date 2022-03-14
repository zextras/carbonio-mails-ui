/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { SnackbarManagerContext, useModal } from '@zextras/carbonio-design-system';
import {
	FOLDERS,
	replaceHistory,
	useAppContext,
	useUserAccount,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
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

export const useMessageActions = (message: MailMessage): Array<any> => {
	const [t] = useTranslation();
	const { folderId }: { folderId: string } = useParams();
	const createSnackbar = useContext(SnackbarManagerContext);
	const dispatch = useDispatch();
	const createModal = useModal();
	const { setCount } = useAppContext() as { setCount: () => void };
	const { deselectAll } = useSelection(folderId, setCount);
	const settings = useUserSettings();
	const account = useUserAccount();
	const timezone = useMemo(
		() => settings?.prefs.zimbraPrefTimeZoneId,
		[settings?.prefs.zimbraPrefTimeZoneId]
	);

	const systemFolders = useMemo(
		() => [FOLDERS.INBOX, FOLDERS.SENT, FOLDERS.DRAFTS, FOLDERS.TRASH, FOLDERS.SPAM],
		[]
	);

	const arr = [];

	if (message.parent === FOLDERS.DRAFTS) {
		arr.push(sendDraft(message.id, message, t, dispatch));
		arr.push(editDraft(message.id, folderId, t, replaceHistory));
		arr.push(
			moveMsgToTrash(
				[message.id],
				t,
				dispatch,
				createSnackbar,
				deselectAll,
				folderId,
				replaceHistory,
				message.conversation
			)
		);
		arr.push(setMsgFlag([message.id], message.flagged, t, dispatch));
	}
	if (
		message.parent === FOLDERS.INBOX ||
		message.parent === FOLDERS.SENT ||
		!includes(systemFolders, message.parent)
	) {
		// INBOX, SENT OR CREATED_FOLDER
		arr.push(replyMsg(message.id, folderId, t, replaceHistory));
		arr.push(replyAllMsg(message.id, folderId, t, replaceHistory));
		arr.push(forwardMsg(message.id, folderId, t, replaceHistory));
		arr.push(
			moveMsgToTrash(
				[message.id],
				t,
				dispatch,
				createSnackbar,
				deselectAll,
				folderId,
				replaceHistory,
				message.conversation
			)
		);
		arr.push(
			setMsgRead([message.id], message.read, t, dispatch, folderId, replaceHistory, deselectAll)
		);
		arr.push(moveMessageToFolder([message.id], t, dispatch, false, createModal, deselectAll));
		arr.push(printMsg(message.id, t, message, dispatch, account));
		arr.push(setMsgFlag([message.id], message.flagged, t, dispatch));
		arr.push(redirectMsg({ id: message.id, t, createModal }));
		arr.push(editAsNewMsg(message.id, folderId, t, replaceHistory));
		arr.push(setMsgAsSpam([message.id], false, t, dispatch, replaceHistory));
		arr.push(showOriginalMsg(message.id, t));
	}

	if (message.parent === FOLDERS.TRASH) {
		arr.push(moveMessageToFolder([message.id], t, dispatch, true, createModal, deselectAll));
		arr.push(deleteMessagePermanently([message.id], t, dispatch, createModal, deselectAll));
	}
	if (message.parent === FOLDERS.SPAM) {
		arr.push(deleteMsg([message.id], t, dispatch, createSnackbar, createModal));
		arr.push(setMsgAsSpam([message.id], true, t, dispatch, replaceHistory));
		arr.push(printMsg(message.id, t, message, dispatch, account));
		arr.push(showOriginalMsg(message.id, t));
	}
	return arr;
};
