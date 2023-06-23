/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Account, FOLDERS, Tags } from '@zextras/carbonio-shell-ui';
import { getFolderIdParts } from '../helpers/folders';
import { AppDispatch } from '../store/redux';
import type { ActionReturnType, Conversation, MailMessage } from '../types';
import {
	deleteConversationPermanently,
	moveConversationToFolder,
	moveConversationToTrash,
	printConversation,
	setConversationsFlag,
	setConversationsRead,
	setConversationsSpam
} from './conversation-actions';
import {
	deleteMessagePermanently,
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
} from './message-actions';
import { applyTag } from './tag-actions';

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
		? isSingleMessageConversation && replyMsg({ id: firstConversationMessageId, folderId })
		: replyMsg({ id, folderId });
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
		? isSingleMessageConversation && replyAllMsg({ id: firstConversationMessageId, folderId })
		: replyAllMsg({ id, folderId });
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
		? isSingleMessageConversation && forwardMsg({ id: firstConversationMessageId, folderId })
		: forwardMsg({ id, folderId });
	return !folderExcludedForward.includes(getFolderIdParts(folderId).id ?? '0') && action;
}

export function getMoveToTrashAction({
	isConversation,
	id,
	dispatch,
	folderId,
	deselectAll,
	foldersExcludedTrash
}: {
	isConversation: boolean;
	id: string;
	dispatch: AppDispatch;
	folderId: string;
	deselectAll: () => void;
	foldersExcludedTrash: string[];
}): ActionReturnType {
	const action = isConversation
		? moveConversationToTrash({ ids: [id], dispatch, folderId, deselectAll })
		: moveMsgToTrash({ ids: [id], dispatch, deselectAll });
	return !foldersExcludedTrash.includes(getFolderIdParts(folderId).id ?? '0') && action;
}

export function getDeletePermanentlyAction({
	isConversation,
	id,
	deselectAll,
	dispatch,
	foldersIncludedDeletePermanently,
	folderId
}: {
	isConversation: boolean;
	id: string;
	deselectAll: () => void;
	dispatch: AppDispatch;
	foldersIncludedDeletePermanently: string[];
	folderId: string;
}): ActionReturnType {
	const action = isConversation
		? deleteConversationPermanently({ ids: [id], deselectAll })
		: deleteMessagePermanently({ ids: [id], dispatch, deselectAll });
	return foldersIncludedDeletePermanently.includes(getFolderIdParts(folderId).id ?? '0') && action;
}

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
	const action = isConversation
		? setConversationsFlag({ ids: [id], value: item.flagged, dispatch })
		: setMsgFlag({ ids: [id], value: item.flagged, dispatch });
	return action;
}

export function getSendDraftAction({
	isConversation,
	id,
	item,
	dispatch,
	folderIncludedSendDraft,
	folderId
}: {
	isConversation: boolean;
	id: string;
	item: MailMessage | Conversation;
	dispatch: AppDispatch;
	folderIncludedSendDraft: string[];
	folderId: string;
}): ActionReturnType {
	const action = isConversation ? false : sendDraft({ id, message: item as MailMessage, dispatch });
	return folderIncludedSendDraft.includes(getFolderIdParts(folderId).id ?? '0') && action;
}

export function getMarkRemoveSpam({
	isConversation,
	id,
	folderId,
	dispatch,
	deselectAll,
	foldersExcludedMarkUnmarkSpam
}: {
	isConversation: boolean;
	id: string;
	folderId: string;
	dispatch: AppDispatch;
	deselectAll: () => void;
	foldersExcludedMarkUnmarkSpam: string[];
}): ActionReturnType {
	const action = isConversation
		? setConversationsSpam({
				ids: [id],
				value: folderId === FOLDERS.SPAM,
				dispatch,
				deselectAll
		  })
		: setMsgAsSpam({
				ids: [id],
				value: folderId === FOLDERS.SPAM,
				dispatch,
				folderId
		  });
	return !foldersExcludedMarkUnmarkSpam.includes(getFolderIdParts(folderId).id ?? '0') && action;
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

export function getMoveToFolderAction({
	isConversation,
	id,
	dispatch,
	folderId,
	deselectAll
}: {
	isConversation: boolean;
	id: string;
	dispatch: AppDispatch;
	folderId: string;
	deselectAll: () => void;
}): ActionReturnType {
	const action = isConversation
		? moveConversationToFolder({
				ids: [id],
				dispatch,
				folderId,
				isRestore: folderId === FOLDERS.TRASH,
				deselectAll
		  })
		: moveMessageToFolder({
				id: [id],
				folderId,
				dispatch,
				isRestore: folderId === FOLDERS.TRASH,
				deselectAll
		  });
	return action;
}

export function getPrintAction({
	isConversation,
	item,
	account,
	folderExcludedPrintMessage,
	folderId
}: {
	isConversation: boolean;
	item: MailMessage | Conversation;
	account: Account;
	folderExcludedPrintMessage: string[];
	folderId: string;
}): ActionReturnType {
	const action = isConversation
		? printConversation({
				conversation: [item as Conversation],
				account
		  })
		: printMsg({ message: item as MailMessage, account });
	return !folderExcludedPrintMessage.includes(getFolderIdParts(folderId).id ?? '0') && action;
}

export function getRedirectAction({
	isConversation,
	id,
	folderExcludedRedirect,
	folderId
}: {
	isConversation: boolean;
	id: string;
	folderExcludedRedirect: string[];
	folderId: string;
}): ActionReturnType {
	const action = isConversation ? false : redirectMsg({ id });
	return !folderExcludedRedirect.includes(getFolderIdParts(folderId).id ?? '0') && action;
}

export function getEditDraftAction({
	isConversation,
	id,
	folderId,
	folderIncludeEditDraft
}: {
	isConversation: boolean;
	id: string;
	folderId: string;
	folderIncludeEditDraft: string[];
}): ActionReturnType {
	const action = isConversation ? false : editDraft({ id, folderId });
	return folderIncludeEditDraft.includes(getFolderIdParts(folderId).id ?? '0') && action;
}

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
	const action = isConversation ? false : editAsNewMsg({ id, folderId });
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
