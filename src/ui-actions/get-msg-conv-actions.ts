/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Account, FOLDERS, Tags } from '@zextras/carbonio-shell-ui';
import { AppDispatch } from '../store/redux';
import { ActionReturnType, Conversation, MailMessage } from '../types';
import {
	getAddRemoveFlagAction,
	getApplyTagAction,
	getDeletePermanentlyAction,
	getEditAsNewAction,
	getEditDraftAction,
	getForwardAction,
	getMarkRemoveSpam,
	getMoveToFolderAction,
	getMoveToTrashAction,
	getPrintAction,
	getReadUnreadAction,
	getRedirectAction,
	getReplyAction,
	getReplyAllAction,
	getSendDraftAction,
	getShowOriginalAction
} from './get-msg-conv-actions-functions';

type GetMessageActionsProps = {
	item: MailMessage | Conversation;
	dispatch: AppDispatch;
	deselectAll: () => void;
	account: Account;
	tags: Tags;
};

export type MsgConvActionsReturnType = [
	Array<Exclude<ActionReturnType, false>>,
	Array<Exclude<ActionReturnType, false>>
];

export function getMsgConvActions({
	item,
	dispatch,
	deselectAll,
	account,
	tags
}: GetMessageActionsProps): () => MsgConvActionsReturnType {
	const isConversation = 'messages' in (item || {});
	const folderId = isConversation ? (item as Conversation)?.messages?.[0].parent : item.parent;
	const firstConversationMessageId = isConversation
		? (item as Conversation)?.messages?.[0]?.id
		: item.id;
	const isSingleMessageConversation =
		isConversation && (item as Conversation).messages.length === 1;

	const { id } = item;

	/**
	 * Folders where the actions are enabled or disabled
	 */
	const foldersExcludedMarkReadUnread = [FOLDERS.DRAFTS];
	const foldersExcludedTrash = [FOLDERS.TRASH, FOLDERS.SPAM];
	const foldersIncludedDeletePermanently = [FOLDERS.TRASH, FOLDERS.SPAM];
	const foldersExcludedTags = [FOLDERS.SPAM];
	const foldersExcludedMarkUnmarkSpam = [FOLDERS.DRAFTS];
	const folderExcludedPrintMessage = [FOLDERS.DRAFTS, FOLDERS.TRASH];
	const folderExcludedShowOriginal = [FOLDERS.DRAFTS, FOLDERS.TRASH];
	const folderIncludeEditDraft = [FOLDERS.DRAFTS];
	const folderExcludedReply = [FOLDERS.DRAFTS, FOLDERS.SPAM];
	const folderExcludedReplyAll = [FOLDERS.DRAFTS, FOLDERS.SPAM];
	const folderExcludedForward = [FOLDERS.DRAFTS, FOLDERS.SPAM];
	const folderExcludedEditAsNew = [FOLDERS.DRAFTS, FOLDERS.TRASH];
	const folderIncludedSendDraft = [FOLDERS.DRAFTS];
	const folderExcludedRedirect = [FOLDERS.DRAFTS, FOLDERS.TRASH];

	const addRemoveFlagAction = getAddRemoveFlagAction({ isConversation, id, item, dispatch });

	const msgReadUnreadAction = getReadUnreadAction({
		isConversation,
		id,
		item,
		dispatch,
		folderId,
		deselectAll,
		foldersExcludedMarkReadUnread
	});

	const moveToTrashAction = getMoveToTrashAction({
		isConversation,
		id,
		dispatch,
		folderId,
		deselectAll,
		foldersExcludedTrash
	});

	const deletePermanentlyAction = getDeletePermanentlyAction({
		isConversation,
		id,
		deselectAll,
		dispatch,
		foldersIncludedDeletePermanently,
		folderId
	});

	const moveToFolderAction = getMoveToFolderAction({
		isConversation,
		id,
		dispatch,
		folderId,
		deselectAll
	});

	const printAction = getPrintAction({
		isConversation,
		item,
		account,
		folderExcludedPrintMessage,
		folderId
	});

	const applyTagAction = getApplyTagAction({
		tags,
		item,
		isConversation,
		foldersExcludedTags,
		folderId
	});

	const markRemoveSpam = getMarkRemoveSpam({
		isConversation,
		id,
		folderId,
		dispatch,
		deselectAll,
		foldersExcludedMarkUnmarkSpam
	});

	const showOriginalAction = getShowOriginalAction({
		isConversation,
		id,
		folderExcludedShowOriginal,
		folderId
	});

	const editDraftAction = getEditDraftAction({
		isConversation,
		id,
		folderId,
		folderIncludeEditDraft
	});

	const replyAction = getReplyAction(
		isConversation,
		isSingleMessageConversation,
		firstConversationMessageId,
		folderId,
		id,
		folderExcludedReply
	);

	const replyAllAction = getReplyAllAction({
		isConversation,
		isSingleMessageConversation,
		firstConversationMessageId,
		folderId,
		id,
		folderExcludedReplyAll
	});

	const forwardAction = getForwardAction({
		isConversation,
		isSingleMessageConversation,
		firstConversationMessageId,
		folderId,
		id,
		folderExcludedForward
	});

	const editAsNewAction = getEditAsNewAction({
		isConversation,
		id,
		folderId,
		folderExcludedEditAsNew
	});

	const sendDraftAction = getSendDraftAction({
		isConversation,
		id,
		item,
		dispatch,
		folderIncludedSendDraft,
		folderId
	});

	const redirectAction = getRedirectAction({
		isConversation,
		id,
		folderExcludedRedirect,
		folderId
	});

	/**
	 * Primary actions are the ones that are shown when the user hovers over a message
	 * @returns an array of arrays of actions
	 */
	const primaryActions: Array<Exclude<ActionReturnType, false>> = [
		replyAction,
		replyAllAction,
		forwardAction,
		moveToTrashAction,
		deletePermanentlyAction,
		msgReadUnreadAction,
		addRemoveFlagAction
	].reduce((acc: Array<Exclude<ActionReturnType, false>>, action) => {
		if (action) {
			acc.push(action);
		}
		return acc;
	}, []);

	/**
	 * Secondary actions are the ones that are shown when the user right-clicks on the message
	 * @returns an array of arrays of actions
	 */
	const secondaryActions: Array<Exclude<ActionReturnType, false>> = [
		replyAction,
		replyAllAction,
		forwardAction,
		sendDraftAction,
		moveToTrashAction,
		deletePermanentlyAction,
		msgReadUnreadAction,
		addRemoveFlagAction,
		markRemoveSpam,
		applyTagAction,
		moveToFolderAction,
		printAction,
		redirectAction,
		editDraftAction,
		editAsNewAction,
		showOriginalAction
	].reduce((acc: Array<Exclude<ActionReturnType, false>>, action) => {
		if (action) {
			acc.push(action as Exclude<ActionReturnType, false>);
		}
		return acc;
	}, []);

	return () => [primaryActions, secondaryActions];
}
