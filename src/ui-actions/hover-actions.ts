/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Account, FOLDERS, Tags } from '@zextras/carbonio-shell-ui';
import { AppDispatch } from '../store/redux';
import {
	ActionReturnType,
	ConvActionReturnType,
	Conversation,
	MailMessage,
	MessageActionReturnType,
	TagActionItemType
} from '../types';
import { getParentId } from '../views/sidebar/utils';
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

// TODO maybe the name of the function should be getMessageActions
export function getHoverActions({
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

	const foldersExcludedMarkReadUnread = [FOLDERS.DRAFTS, FOLDERS.SPAM, FOLDERS.TRASH];
	const foldersExcludedTrash = [FOLDERS.TRASH, FOLDERS.SPAM];
	const foldersIncludedDeletePermanently = [FOLDERS.TRASH, FOLDERS.SPAM];
	const foldersExcludedTags = [FOLDERS.SPAM];
	const foldersExcludedMarkUnmarkSpam = [FOLDERS.DRAFTS, FOLDERS.TRASH];
	const folderExcludedPrintMessage = [FOLDERS.DRAFTS, FOLDERS.TRASH];
	const folderExcludedShowOriginal = [FOLDERS.DRAFTS, FOLDERS.TRASH];
	const folderIncludeEditDraft = [FOLDERS.DRAFTS];
	const folderExcludedReply = [FOLDERS.DRAFTS, FOLDERS.SPAM];
	const folderExcludedReplyAll = [FOLDERS.DRAFTS, FOLDERS.SPAM];
	const folderExcludedForward = [FOLDERS.DRAFTS, FOLDERS.SPAM];
	const folderExcludedEditAsNew = [FOLDERS.DRAFTS, FOLDERS.TRASH];
	const folderIncludedSendDraft = [FOLDERS.DRAFTS];
	const folderExcludedRedirect = [FOLDERS.DRAFTS, FOLDERS.TRASH];

	const addRemoveFlagAction = (): ActionReturnType => {
		const action = isConversation
			? setConversationsFlag({ ids: [id], value: item.flagged, dispatch })
			: setMsgFlag({ ids: [id], value: item.flagged, dispatch });
		return action;
	};

	const setMsgReadUnreadAction = (): ActionReturnType => {
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
		return !foldersExcludedMarkReadUnread.includes(getParentId(folderId) ?? '0') && action;
	};

	const getMoveToTrashAction = (): false | ConvActionReturnType | MessageActionReturnType => {
		const action = isConversation
			? moveConversationToTrash({ ids: [id], dispatch, folderId, deselectAll })
			: moveMsgToTrash({ ids: [id], dispatch, deselectAll });
		return !foldersExcludedTrash.includes(getParentId(folderId) ?? '0') && action;
	};

	const deletePermanentlyAction = (): ActionReturnType => {
		const action = isConversation
			? deleteConversationPermanently({ ids: [id], deselectAll })
			: deleteMessagePermanently({ ids: [id], dispatch, deselectAll });
		return foldersIncludedDeletePermanently.includes(getParentId(folderId) ?? '0') && action;
	};

	const moveToFolderAction = (): ActionReturnType => {
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
	};

	const printAction = (): ActionReturnType => {
		const action = isConversation
			? printConversation({
					conversation: [item as Conversation],
					account
			  })
			: printMsg({ message: item as MailMessage, account });
		return !folderExcludedPrintMessage.includes(getParentId(folderId) ?? '0') && action;
	};

	const applyTagAction = (): false | TagActionItemType => {
		const action = applyTag({ tags, conversation: item, isMessage: !isConversation });
		return !foldersExcludedTags.includes(getParentId(folderId) ?? '0') && action;
	};

	const markRemoveSpam = (): ActionReturnType => {
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
		return !foldersExcludedMarkUnmarkSpam.includes(getParentId(folderId) ?? '0') && action;
	};

	const showOriginalAction = (): ActionReturnType => {
		const action = isConversation ? false : showOriginalMsg({ id });

		return !folderExcludedShowOriginal.includes(getParentId(folderId) ?? '0') && action;
	};

	const editDraftAction = (): ActionReturnType => {
		const action = isConversation ? false : editDraft({ id, folderId });
		return folderIncludeEditDraft.includes(getParentId(folderId) ?? '0') && action;
	};

	const replyMsgAction = (): ActionReturnType => {
		const action = isConversation
			? isSingleMessageConversation && replyMsg({ id: firstConversationMessageId, folderId })
			: replyMsg({ id, folderId });
		return !folderExcludedReply.includes(getParentId(folderId) ?? '0') && action;
	};

	const replyAllMsgAction = (): ActionReturnType => {
		const action = isConversation
			? isSingleMessageConversation && replyAllMsg({ id: firstConversationMessageId, folderId })
			: replyAllMsg({ id, folderId });
		return !folderExcludedReplyAll.includes(getParentId(folderId) ?? '0') && action;
	};

	const forwardMsgAction = (): ActionReturnType => {
		const action = isConversation
			? isSingleMessageConversation && forwardMsg({ id: firstConversationMessageId, folderId })
			: forwardMsg({ id, folderId });
		return !folderExcludedForward.includes(getParentId(folderId) ?? '0') && action;
	};

	const editAsNewAction = (): ActionReturnType => {
		const action = isConversation ? false : editAsNewMsg({ id, folderId });
		return !folderExcludedEditAsNew.includes(getParentId(folderId) ?? '0') && action;
	};

	const sendDraftAction = (): ActionReturnType => {
		const action = isConversation
			? false
			: sendDraft({ id, message: item as MailMessage, dispatch });
		return folderIncludedSendDraft.includes(getParentId(folderId) ?? '0') && action;
	};

	const redirectMsgAction = (): ActionReturnType => {
		const action = isConversation ? false : redirectMsg({ id });
		return !folderExcludedRedirect.includes(getParentId(folderId) ?? '0') && action;
	};

	/**
	 * Primary actions are the ones that are shown when the user hovers over a message
	 * @returns an array of arrays of actions
	 */
	const primaryActions: Array<Exclude<ActionReturnType, false>> = [
		replyMsgAction(),
		replyAllMsgAction(),
		forwardMsgAction(),
		setMsgReadUnreadAction(),
		getMoveToTrashAction(),
		deletePermanentlyAction(),
		addRemoveFlagAction()
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
		replyMsgAction(),
		replyAllMsgAction(),
		forwardMsgAction(),
		setMsgReadUnreadAction(),
		getMoveToTrashAction(),
		deletePermanentlyAction(),
		addRemoveFlagAction(),
		moveToFolderAction(),
		applyTagAction(),
		markRemoveSpam(),
		printAction(),
		showOriginalAction(),
		editDraftAction(),
		editAsNewAction(),
		sendDraftAction(),
		redirectMsgAction()
	].reduce((acc: Array<Exclude<ActionReturnType, false>>, action) => {
		if (action) {
			acc.push(action);
		}
		return acc;
	}, []);

	return () => [primaryActions, secondaryActions];
}
