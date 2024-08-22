/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { Dispatch } from '@reduxjs/toolkit';
import { Tags, useAppContext, useIntegratedFunction, useTags } from '@zextras/carbonio-shell-ui';
import { includes } from 'lodash';
import { useParams } from 'react-router-dom';

import { useAppDispatch } from './redux';
import { useSelection } from './use-selection';
import { FOLDERS } from '../carbonio-ui-commons/constants/folders';
import { EXTRA_WINDOW_ACTION_ID } from '../constants';
import { getFolderIdParts } from '../helpers/folders';
import type { AppContext, MailMessage, MessageAction } from '../types';
import {
	useCreateAppointment,
	downloadEml,
	editAsNewMsg,
	forwardMsg,
	previewMessageOnSeparatedWindow,
	printMsg,
	replyAllMsg,
	replyMsg,
	sendDraft,
	setMsgFlag,
	setMsgRead,
	showOriginalMsg,
	useDeleteMessagePermanently,
	useDeleteMsg,
	useEditDraft,
	useMoveMessageToFolder,
	useMoveMsgToTrash,
	useRedirectMsg,
	useSetMsgAsSpam
} from '../ui-actions/message-actions';
import { applyTag } from '../ui-actions/tag-actions';
import { useGlobalExtraWindowManager } from '../views/app/extra-windows/global-extra-window-manager';
import { useExtraWindow } from '../views/app/extra-windows/use-extra-window';

type ActionGeneratorProps = {
	isInsideExtraWindow: boolean;
	message: MailMessage;
	dispatch: Dispatch;
	folderId: string;
	tags: Tags;
};

const useDraftActions = (): (({
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
}) => Array<MessageAction>) => {
	const editDraft = useEditDraft();
	const moveMsgToTrash = useMoveMsgToTrash();

	return useCallback(
		({
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
		}): Array<MessageAction> => {
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
			actions.push(setMsgFlag({ ids: [message.id], value: message.flagged, dispatch }));
			actions.push(applyTag({ tags, conversation: message, isMessage: true }));
			return actions;
		},
		[editDraft, moveMsgToTrash]
	);
};

const useTrashActions = (): (({
	isInsideExtraWindow,
	message,
	dispatch,
	deselectAll,
	folderId,
	tags
}: ActionGeneratorProps & { deselectAll: () => void }) => Array<MessageAction>) => {
	const moveMessageToFolder = useMoveMessageToFolder();
	const deleteMessagePermanently = useDeleteMessagePermanently();

	return useCallback(
		({
			isInsideExtraWindow,
			message,
			dispatch,
			deselectAll,
			folderId,
			tags
		}: ActionGeneratorProps & { deselectAll: () => void }): Array<MessageAction> => {
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
			actions.push(applyTag({ tags, conversation: message, isMessage: true }));
			return actions;
		},
		[deleteMessagePermanently, moveMessageToFolder]
	);
};

const useSpamActions = (): (({
	isInsideExtraWindow,
	message,
	dispatch,
	tags,
	folderId
}: ActionGeneratorProps) => Array<MessageAction>) => {
	const deleteMsg = useDeleteMsg();
	const setMsgAsSpam = useSetMsgAsSpam();

	return useCallback(
		({
			isInsideExtraWindow,
			message,
			dispatch,
			tags,
			folderId
		}: ActionGeneratorProps): Array<MessageAction> => {
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
			actions.push(printMsg({ message }));
			actions.push(showOriginalMsg({ id: message.id }));
			actions.push(applyTag({ tags, conversation: message, isMessage: true }));
			return actions;
		},
		[deleteMsg, setMsgAsSpam]
	);
};

const useDefaultActions = (): (({
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
	openAppointmentComposer: ReturnType<typeof useIntegratedFunction>[0];
	deselectAll: () => void;
	isAlone: boolean;
	isAvailable: boolean;
}) => Array<MessageAction>) => {
	const moveMsgToTrash = useMoveMsgToTrash();
	const moveMessageToFolder = useMoveMessageToFolder();
	const redirectMsg = useRedirectMsg();
	const setMsgAsSpam = useSetMsgAsSpam();
	const createAppointment = useCreateAppointment();

	return useCallback(
		({
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
			openAppointmentComposer: ReturnType<typeof useIntegratedFunction>[0];
			deselectAll: () => void;
			isAlone: boolean;
			isAvailable: boolean;
		}): Array<MessageAction> => {
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
			!isInsideExtraWindow &&
				isAvailable &&
				actions.push(createAppointment({ item: message, openAppointmentComposer }));
			actions.push(printMsg({ message }));
			actions.push(setMsgFlag({ ids: [message.id], value: message.flagged, dispatch }));
			!isInsideExtraWindow && actions.push(redirectMsg({ id: message.id }));
			!isInsideExtraWindow && actions.push(editAsNewMsg({ id: message.id }));
			!isInsideExtraWindow &&
				actions.push(setMsgAsSpam({ ids: [message.id], value: false, dispatch, folderId }));
			actions.push(showOriginalMsg({ id: message.id }));
			actions.push(downloadEml({ id: message.id }));

			return actions;
		},
		[createAppointment, moveMessageToFolder, moveMsgToTrash, redirectMsg, setMsgAsSpam]
	);
};

/*
 * TOFIX this hook is used only by the displayer. It should be aligned/merged with
 * 	the others functions that are providing primary and secondary actions for a message
 *
 * TOFIX the folder id comparisons are weak: they're not working for shared folders nor for subfolders.
 *  Consider using/creating common utility functions
 */
export const useMessageActions = (
	message: MailMessage | undefined,
	isAlone = false
): Array<MessageAction> => {
	const { folderId }: { folderId: string } = useParams();
	const dispatch = useAppDispatch();
	const { setCount } = useAppContext<AppContext>();
	const { deselectAll } = useSelection({ setCount, count: 0 });
	const { isInsideExtraWindow } = useExtraWindow();
	const { createWindow } = useGlobalExtraWindowManager();
	const [openAppointmentComposer, isAvailable] = useIntegratedFunction('create_appointment');
	const getDraftsActions = useDraftActions();
	const getDefaultActions = useDefaultActions();
	const getTrashActions = useTrashActions();
	const getSpamActions = useSpamActions();
	const systemFolders = useMemo(
		() => [FOLDERS.INBOX, FOLDERS.SENT, FOLDERS.DRAFTS, FOLDERS.TRASH, FOLDERS.SPAM],
		[]
	);
	const tags = useTags();
	const actions: Array<MessageAction> = [{ id: EXTRA_WINDOW_ACTION_ID }];

	if (!message) {
		return [];
	}

	if (getFolderIdParts(message.parent).id === FOLDERS.DRAFTS) {
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
		getFolderIdParts(message.parent).id === FOLDERS.INBOX ||
		getFolderIdParts(message.parent).id === FOLDERS.SENT ||
		!includes(systemFolders, getFolderIdParts(message.parent).id)
	) {
		actions.push(
			...getDefaultActions({
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

	if (getFolderIdParts(message.parent).id === FOLDERS.TRASH) {
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

	if (getFolderIdParts(message.parent).id === FOLDERS.SPAM) {
		actions.push(...getSpamActions({ isInsideExtraWindow, message, dispatch, tags, folderId }));
	}

	!isInsideExtraWindow &&
		actions.push(
			previewMessageOnSeparatedWindow(message.id, folderId, message.subject, createWindow, actions)
		);

	return actions;
};
