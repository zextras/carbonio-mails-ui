/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback } from 'react';

import { CreateSnackbarFn } from '@zextras/carbonio-design-system';
import { FOLDERS, Tags, useIntegratedFunction } from '@zextras/carbonio-shell-ui';
import { TFunction } from 'i18next';

import {
	useMoveConversationToTrash,
	previewConversationOnSeparatedWindowAction,
	printConversation,
	setConversationsFlag,
	setConversationsRead,
	useDeleteConversationPermanently,
	useSetConversationAsSpam,
	useMoveConversationToFolder
} from './conversation-actions';
import {
	useCreateAppointment,
	downloadEml,
	editAsNewMsg,
	forwardMsg,
	useMoveMsgToTrash,
	previewMessageOnSeparatedWindow,
	printMsg,
	replyAllMsg,
	replyMsg,
	sendDraftFromPreview,
	setMsgFlag,
	setMsgRead,
	showOriginalMsg,
	useDeleteMessagePermanently,
	useSetMsgAsSpam,
	useMoveMessageToFolder,
	useRedirectMsg,
	useEditDraft
} from './message-actions';
import { applyTag } from './tag-actions';
import { updateEditorWithSmartLinks } from './utils';
import { EditViewActions } from '../constants';
import { getFolderIdParts } from '../helpers/folders';
import { AppDispatch } from '../store/redux';
import { GenerateEditorParams } from '../store/zustand/editor/editor-generators';
import { useEditorsStore } from '../store/zustand/editor/store';
import type {
	ActionReturnType,
	AddEditorParams,
	Conversation,
	ExtraWindowsContextType,
	MailMessage,
	MailsEditorV2,
	MessageAction
} from '../types';

/**
 * get the action to be executed when the user clicks on the "Mark as read/unread" button
 * @param isConversation true if the item is a conversation
 * @param id the id of the item
 * @param item the item itself
 * @param dispatch the dispatch function
 * @param folderId the id of the folder where the item is located
 * @param deselectAll the function to deselect all the items
 * @param foldersExcludedMarkReadUnread the list of folders where the "Mark as read/unread" button is disabled
 * @returns {function(): ActionReturnType} the action to be executed when the user clicks on the "Mark as read/unread" button
 */
export function getReadUnreadAction({
	isConversation,
	id,
	item,
	dispatch,
	folderId,
	deselectAll,
	foldersExcludedMarkReadUnread
}: {
	isConversation: boolean;
	id: string;
	item: MailMessage | Conversation;
	dispatch: AppDispatch;
	folderId: string;
	deselectAll: () => void;
	foldersExcludedMarkReadUnread: string[];
}): ActionReturnType {
	const action = isConversation
		? setConversationsRead({
				ids: [id],
				value: item.read,
				dispatch,
				folderId,
				deselectAll,
				shouldReplaceHistory: false
			})
		: setMsgRead({ ids: [id], value: item.read, dispatch, folderId });
	return !foldersExcludedMarkReadUnread.includes(getFolderIdParts(folderId).id ?? '0') && action;
}

export function getReplyAction(
	isConversation: boolean,
	isSingleMessageConversation: boolean,
	firstConversationMessageId: string,
	folderId: string,
	id: string,
	folderExcludedReply: string[]
): ActionReturnType {
	const action = isConversation
		? isSingleMessageConversation && replyMsg({ id: firstConversationMessageId })
		: replyMsg({ id });
	return !folderExcludedReply.includes(getFolderIdParts(folderId).id ?? '0') && action;
}

export function getReplyAllAction({
	isConversation,
	isSingleMessageConversation,
	firstConversationMessageId,
	folderId,
	id,
	folderExcludedReplyAll
}: {
	isConversation: boolean;
	isSingleMessageConversation: boolean;
	firstConversationMessageId: string;
	folderId: string;
	id: string;
	folderExcludedReplyAll: string[];
}): ActionReturnType {
	const action = isConversation
		? isSingleMessageConversation && replyAllMsg({ id: firstConversationMessageId })
		: replyAllMsg({ id });
	return !folderExcludedReplyAll.includes(getFolderIdParts(folderId).id ?? '0') && action;
}

export function getForwardAction({
	isConversation,
	isSingleMessageConversation,
	firstConversationMessageId,
	folderId,
	id,
	folderExcludedForward
}: {
	isConversation: boolean;
	isSingleMessageConversation: boolean;
	firstConversationMessageId: string;
	folderId: string;
	id: string;
	folderExcludedForward: string[];
}): ActionReturnType {
	const action = isConversation
		? isSingleMessageConversation && forwardMsg({ id: firstConversationMessageId })
		: forwardMsg({ id });
	return !folderExcludedForward.includes(getFolderIdParts(folderId).id ?? '0') && action;
}

export const useMoveToTrashAction = (): ((arg: {
	isConversation: boolean;
	id: string;
	dispatch: AppDispatch;
	folderId: string;
	deselectAll: () => void;
	foldersExcludedTrash: string[];
}) => ActionReturnType) => {
	const moveConversationToTrash = useMoveConversationToTrash();
	const moveMsgToTrash = useMoveMsgToTrash();
	return useCallback(
		({ isConversation, id, dispatch, folderId, deselectAll, foldersExcludedTrash }) => {
			const action = isConversation
				? moveConversationToTrash({ ids: [id], dispatch, folderId, deselectAll })
				: moveMsgToTrash({ ids: [id], dispatch, deselectAll });
			return !foldersExcludedTrash.includes(getFolderIdParts(folderId).id ?? '0') && action;
		},
		[moveConversationToTrash, moveMsgToTrash]
	);
};

export const useDeletePermanentlyAction = (): ((arg: {
	isConversation: boolean;
	id: string;
	deselectAll: () => void;
	dispatch: AppDispatch;
	foldersIncludedDeletePermanently: string[];
	folderId: string;
}) => ActionReturnType) => {
	const deleteConversationPermanently = useDeleteConversationPermanently();
	const deleteMessagePermanently = useDeleteMessagePermanently();
	return useCallback(
		({ isConversation, id, deselectAll, dispatch, foldersIncludedDeletePermanently, folderId }) => {
			const action = isConversation
				? deleteConversationPermanently({ ids: [id], deselectAll })
				: deleteMessagePermanently({ ids: [id], dispatch, deselectAll });
			return (
				foldersIncludedDeletePermanently.includes(getFolderIdParts(folderId).id ?? '0') && action
			);
		},
		[deleteConversationPermanently, deleteMessagePermanently]
	);
};

export function getAddRemoveFlagAction({
	isConversation,
	id,
	item,
	dispatch
}: {
	isConversation: boolean;
	id: string;
	item: MailMessage | Conversation;
	dispatch: AppDispatch;
}): ActionReturnType {
	return isConversation
		? setConversationsFlag({ ids: [id], value: item.flagged, dispatch })
		: setMsgFlag({ ids: [id], value: item.flagged, dispatch });
}

export function getSendDraftAction({
	item,
	dispatch,
	folderIncludedSendDraft,
	folderId,
	generateEditor,
	addEditor,
	createSnackbar,
	t
}: {
	item: MailMessage;
	dispatch: AppDispatch;
	folderIncludedSendDraft: string[];
	folderId: string;
	generateEditor: (params: GenerateEditorParams) => MailsEditorV2 | null;
	addEditor: ({ id, editor }: AddEditorParams) => void;
	createSnackbar: CreateSnackbarFn;
	t: TFunction;
}): ActionReturnType {
	if (!folderIncludedSendDraft.includes(getFolderIdParts(folderId).id ?? '0')) {
		return false;
	}

	const generateEditorFunction = async (): Promise<MailsEditorV2> => {
		const editor = generateEditor({
			action: EditViewActions.EDIT_AS_DRAFT,
			id: item.id,
			messagesStoreDispatch: dispatch,
			message: item,
			compositionData: undefined
		});
		if (!editor) {
			throw new Error('No editor provided');
		}
		addEditor({ id: editor.id, editor });
		const { savedAttachments } = editor;
		const hasSmartLinks =
			savedAttachments.filter((attachment) => attachment.requiresSmartLinkConversion).length > 0;
		if (hasSmartLinks)
			await updateEditorWithSmartLinks({
				createSnackbar,
				t,
				editorId: editor.id
			});

		return useEditorsStore.getState().editors[editor.id];
	};

	return sendDraftFromPreview({ generateEditorFunction, dispatch });
}

export const useMarkRemoveSpam = (): ((arg: {
	isConversation: boolean;
	id: string;
	folderId: string;
	dispatch: AppDispatch;
	deselectAll: () => void;
	foldersExcludedMarkUnmarkSpam: string[];
}) => ActionReturnType) => {
	const setConversationAsSpam = useSetConversationAsSpam();
	const setMsgAsSpam = useSetMsgAsSpam();
	return useCallback(
		({ isConversation, id, folderId, dispatch, deselectAll, foldersExcludedMarkUnmarkSpam }) => {
			const action = isConversation
				? setConversationAsSpam({
						ids: [id],
						value: getFolderIdParts(folderId).id === FOLDERS.SPAM,
						dispatch,
						deselectAll
					})
				: setMsgAsSpam({
						ids: [id],
						value: getFolderIdParts(folderId).id === FOLDERS.SPAM,
						dispatch,
						folderId
					});
			return (
				!foldersExcludedMarkUnmarkSpam.includes(getFolderIdParts(folderId).id ?? '0') && action
			);
		},
		[setConversationAsSpam, setMsgAsSpam]
	);
};

export function getPreviewOnSeparatedWindowAction({
	isConversation,
	id,
	folderId,
	subject,
	createWindow,
	messageActions
}: {
	isConversation: boolean;
	id: string;
	folderId: string;
	subject: string;
	createWindow: ExtraWindowsContextType['createWindow'];
	messageActions: Array<MessageAction>;
}): ActionReturnType {
	return isConversation
		? previewConversationOnSeparatedWindowAction(id, folderId, subject, createWindow)
		: previewMessageOnSeparatedWindow(id, folderId, subject, createWindow, messageActions);
}

export function getApplyTagAction({
	tags,
	item,
	isConversation,
	foldersExcludedTags,
	folderId
}: {
	tags: Tags;
	item: MailMessage | Conversation;
	isConversation: boolean;
	foldersExcludedTags: string[];
	folderId: string;
}): ActionReturnType {
	const action = applyTag({ tags, conversation: item, isMessage: !isConversation });
	return (
		!foldersExcludedTags.includes(getFolderIdParts(folderId).id ?? '0') &&
		(action as ActionReturnType)
	);
}

export const useMoveToFolderAction = (): ((arg: {
	isConversation: boolean;
	id: string;
	dispatch: AppDispatch;
	folderId: string;
	deselectAll: () => void;
}) => ActionReturnType) => {
	const moveConversationToFolder = useMoveConversationToFolder();
	const moveMessageToFolder = useMoveMessageToFolder();
	return useCallback(
		({ isConversation, id, dispatch, folderId, deselectAll }) =>
			isConversation
				? moveConversationToFolder({
						ids: [id],
						dispatch,
						folderId,
						isRestore: getFolderIdParts(folderId).id === FOLDERS.TRASH,
						deselectAll
					})
				: moveMessageToFolder({
						id: [id],
						folderId,
						dispatch,
						isRestore: getFolderIdParts(folderId).id === FOLDERS.TRASH,
						deselectAll
					}),
		[moveConversationToFolder, moveMessageToFolder]
	);
};

export function getPrintAction({
	isConversation,
	item,
	folderExcludedPrintMessage,
	folderId
}: {
	isConversation: boolean;
	item: MailMessage | Conversation;
	folderExcludedPrintMessage: string[];
	folderId: string;
}): ActionReturnType {
	const action = isConversation
		? printConversation({
				conversation: [item as Conversation]
			})
		: printMsg({ message: item as MailMessage });
	return !folderExcludedPrintMessage.includes(getFolderIdParts(folderId).id ?? '0') && action;
}

export const useRedirectAction = (): ((arg: {
	isConversation: boolean;
	id: string;
	folderExcludedRedirect: string[];
	folderId: string;
}) => ActionReturnType) => {
	const redirectMsg = useRedirectMsg();
	return useCallback(
		({ isConversation, id, folderExcludedRedirect, folderId }) => {
			const action = isConversation ? false : redirectMsg({ id });
			return !folderExcludedRedirect.includes(getFolderIdParts(folderId).id ?? '0') && action;
		},
		[redirectMsg]
	);
};

export const useEditDraftAction = (): ((arg: {
	isConversation: boolean;
	id: string;
	folderId: string;
	folderIncludeEditDraft: string[];
}) => ActionReturnType) => {
	const editDraft = useEditDraft();
	return useCallback(
		({ isConversation, id, folderId, folderIncludeEditDraft }) => {
			const action = isConversation ? false : editDraft({ id, folderId });
			return folderIncludeEditDraft.includes(getFolderIdParts(folderId).id ?? '0') && action;
		},
		[editDraft]
	);
};

export function getEditAsNewAction({
	isConversation,
	id,
	folderId,
	folderExcludedEditAsNew
}: {
	isConversation: boolean;
	id: string;
	folderId: string;
	folderExcludedEditAsNew: string[];
}): ActionReturnType {
	const action = isConversation ? false : editAsNewMsg({ id });
	return !folderExcludedEditAsNew.includes(getFolderIdParts(folderId).id ?? '0') && action;
}

export function getShowOriginalAction({
	id,
	folderExcludedShowOriginal,
	folderId
}: {
	isConversation: boolean;
	id: string;
	folderExcludedShowOriginal: string[];
	folderId: string;
}): ActionReturnType {
	const action = showOriginalMsg({ id });

	return !folderExcludedShowOriginal.includes(getFolderIdParts(folderId).id ?? '0') && action;
}

export function getDownloadEmlAction({
	id,
	folderId,
	folderExcludedDownloadEML,
	isConversation
}: {
	id: string;
	folderId: string;
	folderExcludedDownloadEML: string[];
	isConversation: boolean;
}): ActionReturnType {
	const action = isConversation ? false : downloadEml({ id });

	return !folderExcludedDownloadEML.includes(getFolderIdParts(folderId).id ?? '0') && action;
}

export const useCreateAppointmentAction = (): (({
	item,
	folderId,
	folderExcludedCreateAppointment,
	isConversation,
	openAppointmentComposer,
	isAvailable
}: {
	item: MailMessage | Conversation;
	folderId: string;
	folderExcludedCreateAppointment: string[];
	isConversation: boolean;
	openAppointmentComposer: ReturnType<typeof useIntegratedFunction>[0];
	isAvailable: boolean;
}) => ActionReturnType) => {
	const createAppointment = useCreateAppointment();

	return useCallback(
		({
			item,
			folderId,
			folderExcludedCreateAppointment,
			isConversation,
			openAppointmentComposer,
			isAvailable
		}: {
			item: MailMessage | Conversation;
			folderId: string;
			folderExcludedCreateAppointment: string[];
			isConversation: boolean;
			openAppointmentComposer: ReturnType<typeof useIntegratedFunction>[0];
			isAvailable: boolean;
		}): ActionReturnType => {
			const action =
				isConversation || !isAvailable
					? false
					: createAppointment({ item: item as MailMessage, openAppointmentComposer });

			return (
				!folderExcludedCreateAppointment.includes(getFolderIdParts(folderId).id ?? '0') && action
			);
		},
		[createAppointment]
	);
};
