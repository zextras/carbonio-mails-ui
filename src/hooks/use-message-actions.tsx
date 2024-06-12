/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { Dispatch } from '@reduxjs/toolkit';
import {
	FOLDERS,
	Tags,
	useAppContext,
	useIntegratedFunction,
	useTags
} from '@zextras/carbonio-shell-ui';
import { includes } from 'lodash';
import { useParams } from 'react-router-dom';

import { useAppDispatch } from './redux';
import { useSelection } from './use-selection';
import { EXTRA_WINDOW_ACTION_ID } from '../constants';
import type { AppContext, MailMessage, MessageAction } from '../types';
import {
	createAppointment,
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
import { getFolderIdParts } from '../helpers/folders';

type ActionGeneratorProps = {
	isInsideExtraWindow: boolean;
	message: MailMessage;
	dispatch: Dispatch;
	folderId: string;
	tags: Tags;
};

function getDraftsActions({
	isInsideExtraWindow,
	message,
	dispatch,
	deselectAll,
	folderId,
	isAlone,
	tags
}: ActionGeneratorProps & {
	deselectAll: () => void;
	isAlone: boolean;
}): Array<MessageAction> {
	const actions: Array<MessageAction> = [];
	!isInsideExtraWindow && actions.push(sendDraft({ message, dispatch }));
	!isInsideExtraWindow && actions.push(editDraft({ id: message.id, message }));
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
	!isInsideExtraWindow && actions.push(setMsgFlag({ ids: [message.id], value: message.flagged, dispatch }));
	!isInsideExtraWindow && actions.push(applyTag({ tags, conversation: message, isMessage: true }));
	!isInsideExtraWindow && actions.push(printMsg({ message }));
	!isInsideExtraWindow && actions.push(showOriginalMsg({ id: message.id }));
	!isInsideExtraWindow && actions.push(downloadEml({ id: message.id }));
	return actions;
}

function getTrashActions({
	isInsideExtraWindow,
	message,
	dispatch,
	deselectAll,
	folderId,
	tags
}: ActionGeneratorProps & { deselectAll: () => void }): Array<MessageAction> {
	const actions: Array<MessageAction> = [];
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
	!isInsideExtraWindow && actions.push(applyTag({ tags, conversation: message, isMessage: true }));
	!isInsideExtraWindow && actions.push(printMsg({ message }));
	!isInsideExtraWindow && actions.push(showOriginalMsg({ id: message.id }));
	!isInsideExtraWindow && actions.push(downloadEml({ id: message.id }));
	return actions;
}

function getSpamActions({
	isInsideExtraWindow,
	message,
	dispatch,
	tags,
	folderId
}: ActionGeneratorProps): Array<MessageAction> {
	const actions: Array<MessageAction> = [];
	!isInsideExtraWindow &&
		actions.push(
			deleteMsg({
				ids: [message.id],
				dispatch
			})
		);
	!isInsideExtraWindow &&
		actions.push(setMsgAsSpam({ ids: [message.id], value: true, dispatch, folderId }));
	!isInsideExtraWindow && actions.push(printMsg({ message }));
	!isInsideExtraWindow && actions.push(showOriginalMsg({ id: message.id }));
	!isInsideExtraWindow && actions.push(applyTag({ tags, conversation: message, isMessage: true }));
	!isInsideExtraWindow && actions.push(downloadEml({ id: message.id }));
	return actions;
}

function getDefatultActions({
	isInsideExtraWindow,
	message,
	dispatch,
	deselectAll,
	folderId,
	isAlone,
	tags,
	isAvailable,
	openAppointmentComposer
}: ActionGeneratorProps & {
	// eslint-disable-next-line @typescript-eslint/ban-types
	openAppointmentComposer: Function;
	deselectAll: () => void;
	isAlone: boolean;
	isAvailable: boolean;
}): Array<MessageAction> {
	const actions: Array<MessageAction> = [];
	!isInsideExtraWindow && actions.push(replyMsg({ id: message.id }));
	!isInsideExtraWindow && actions.push(replyAllMsg({ id: message.id }));
	!isInsideExtraWindow && actions.push(forwardMsg({ id: message.id }));
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
	!isInsideExtraWindow && actions.push(
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

	!isInsideExtraWindow && actions.push(applyTag({ tags, conversation: message, isMessage: true }));
	!isInsideExtraWindow &&
		isAvailable &&
		actions.push(createAppointment({ item: message, openAppointmentComposer }));
	actions.push(printMsg({ message }));
	actions.push(setMsgFlag({ ids: [message.id], value: message.flagged, dispatch }));
	!isInsideExtraWindow && actions.push(redirectMsg({ id: message.id }));
	!isInsideExtraWindow && actions.push(editAsNewMsg({ id: message.id }));
	!isInsideExtraWindow &&
	!isInsideExtraWindow && actions.push(setMsgAsSpam({ ids: [message.id], value: false, dispatch, folderId }));
	!isInsideExtraWindow && actions.push(showOriginalMsg({ id: message.id }));
	!isInsideExtraWindow && actions.push(downloadEml({ id: message.id }));

	return actions;
}
/*
 * TOFIX this hook is used only by the displayer. It should be aligned/merged with
 * 	the others functions that are providing primary and secondary actions for a message
 *
 * TOFIX the folder id comparisons are weak: they're not working for shared folders nor for subfolders.
 *  Consider using/creating common utility functions
 */
export const useMessageActions = (
	message: MailMessage | undefined,
	isAlone = false,
	isExtWin = false
): Array<MessageAction> => {
	const { folderId }: { folderId: string } = useParams();
	const dispatch = useAppDispatch();
	const { setCount } = useAppContext<AppContext>();
	const { deselectAll } = useSelection({ currentFolderId: folderId, setCount, count: 0 });
	let { isInsideExtraWindow } = useExtraWindow();
	const { createWindow } = useExtraWindowsManager();
	const [openAppointmentComposer, isAvailable] = useIntegratedFunction('create_appointment');
	const systemFolders = useMemo(
		() => [FOLDERS.INBOX, FOLDERS.SENT, FOLDERS.DRAFTS, FOLDERS.TRASH, FOLDERS.SPAM],
		[]
	);
	const tags = useTags();
	const actions: Array<MessageAction> = [{ id: EXTRA_WINDOW_ACTION_ID }];

	if (!message) {
		return [];
	}

	const parentId = getFolderIdParts(message.parent);

	if (isInsideExtraWindow != isExtWin && !isInsideExtraWindow){
		isInsideExtraWindow = isExtWin;
	}

	if (parentId.id === FOLDERS.DRAFTS) {
		actions.push(
			...getDraftsActions({
				isInsideExtraWindow,
				message,
				dispatch,
				deselectAll,
				folderId,
				isAlone,
				tags
			})
		);
	}

	if (
		parentId.id === FOLDERS.INBOX ||
		parentId.id === FOLDERS.SENT ||
		!includes(systemFolders, parentId.id)
	) {
		actions.push(
			...getDefatultActions({
				isInsideExtraWindow,
				message,
				dispatch,
				deselectAll,
				folderId,
				isAlone,
				tags,
				isAvailable,
				openAppointmentComposer
			})
		);
		// INBOX, SENT OR CREATED_FOLDER
	}

	if (parentId.id === FOLDERS.TRASH) {
		actions.push(
			...getTrashActions({
				isInsideExtraWindow,
				message,
				dispatch,
				deselectAll,
				folderId,
				tags
			})
		);
	}

	if (parentId.id === FOLDERS.SPAM) {
		actions.push(...getSpamActions({ isInsideExtraWindow, message, dispatch, tags, folderId }));
	}

	//only for preview message on separated folder
	const actions2 = [];
	actions2.push(printMsg({ message }));
	actions2.push(showOriginalMsg({ id: message.id }));
	actions2.push(downloadEml({ id: message.id }));

	!isInsideExtraWindow &&
		actions.push(
			previewMessageOnSeparatedWindow(message.id, folderId, message.subject, createWindow, actions2)
		);

	if (isInsideExtraWindow) {
		return actions2;
	}

	return actions;
};
