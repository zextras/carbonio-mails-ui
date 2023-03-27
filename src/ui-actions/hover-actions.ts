/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Account, FOLDERS, Tags } from '@zextras/carbonio-shell-ui';
import { Dispatch } from 'react';
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
import { AppDispatch } from '../store/redux';

type GetMessageActionsProps = {
	item: MailMessage | Conversation;
	dispatch: AppDispatch;
	deselectAll: () => void;
	account: Account;
	tags: Tags;
};

type MsgConvActionsReturnType = [
	Array<Omit<ActionReturnType, 'false'>>,
	Array<Omit<ActionReturnType, 'false'>>
];

export function getHoverActions({
	item,
	dispatch,
	deselectAll,
	account,
	tags
}: GetMessageActionsProps): (
	_item: MailMessage | Conversation,
	closeEditor?: boolean
) => MsgConvActionsReturnType {
	const isConversation = 'messages' in (item || {});

	const folderId = item.parent;
	const { id } = item;

	const foldersExcludedMarkReadUnread = [FOLDERS.DRAFTS, FOLDERS.SPAM, FOLDERS.TRASH];
	const foldersExcludedTrash = [FOLDERS.TRASH];
	const foldersIncludedDeletePermanently = [FOLDERS.TRASH];
	const foldersExcludedFlag: Array<string> = [];
	const foldersExcludedTags = [FOLDERS.SPAM];
	const foldersExcludedMarkUnmarkSpam = [FOLDERS.DRAFTS, FOLDERS.TRASH];
	const folderExcludedPrintMessage = [FOLDERS.DRAFTS, FOLDERS.TRASH];
	const folderExcludedShowOriginal = [FOLDERS.DRAFTS, FOLDERS.TRASH];
	const foldersIncludesMoveToFolder = [FOLDERS.TRASH];

	const folderIncludeEditDraft = [FOLDERS.DRAFTS];
	const folderExcludedReply = [FOLDERS.DRAFTS, FOLDERS.TRASH];
	const folderExcludedReplyAll = [FOLDERS.DRAFTS, FOLDERS.TRASH];
	const folderExcludedForward = [FOLDERS.DRAFTS, FOLDERS.TRASH];
	const folderExcludedEditAsNew = [FOLDERS.DRAFTS, FOLDERS.TRASH];
	const folderIncludedSendDraft = [FOLDERS.DRAFTS];
	const folderExcludedRedirect = [FOLDERS.DRAFTS, FOLDERS.TRASH];

	const addRemoveFlagAction = (): ActionReturnType => {
		const action = isConversation
			? setConversationsFlag({ ids: [id], value: item.flagged, dispatch })
			: setMsgFlag({ ids: [id], value: item.flagged, dispatch });
		return !foldersExcludedFlag.includes(folderId) && action;
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
		return !foldersExcludedMarkReadUnread.includes(getParentId(item) ?? '0') && action;
	};

	const getMoveToTrashAction = (): false | ConvActionReturnType | MessageActionReturnType => {
		const action = isConversation
			? moveConversationToTrash({ ids: [id], dispatch, folderId, deselectAll })
			: moveMsgToTrash({ ids: [id], dispatch, deselectAll });
		return !foldersExcludedTrash.includes(getParentId(item) ?? '0') && action;
	};

	const deletePermanentlyAction = (): ActionReturnType => {
		const action = isConversation
			? deleteConversationPermanently({ ids: [id], deselectAll })
			: deleteMessagePermanently({ ids: [id], dispatch, deselectAll });
		return foldersIncludedDeletePermanently.includes(getParentId(item) ?? '0') && action;
	};

	const moveToFolderAction = (): ActionReturnType => {
		const action = isConversation
			? moveConversationToFolder({
					ids: [id],
					dispatch,
					folderId,
					isRestore: false,
					deselectAll
			  })
			: moveMessageToFolder({
					id: [id],
					folderId,
					dispatch,
					isRestore: true,
					deselectAll
			  });
		return foldersIncludesMoveToFolder.includes(getParentId(item) ?? '0') && action;
	};

	const printAction = (): ActionReturnType => {
		const action = isConversation
			? printConversation({
					conversation: [item as Conversation],
					account
			  })
			: printMsg({ message: item as MailMessage, account });
		return !folderExcludedPrintMessage.includes(getParentId(item) ?? '0') && action;
	};

	const applyTagAction = (): false | TagActionItemType => {
		const action = applyTag({ tags, conversation: item, isMessage: !isConversation });
		return !foldersExcludedTags.includes(getParentId(item) ?? '0') && action;
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
		return !foldersExcludedMarkUnmarkSpam.includes(getParentId(item) ?? '0') && action;
	};

	const showOriginalAction = (): ActionReturnType => {
		const action = isConversation ? false : showOriginalMsg({ id });

		return !folderExcludedShowOriginal.includes(getParentId(item) ?? '0') && action;
	};

	const editDraftAction = (): ActionReturnType => {
		const action = isConversation ? false : editDraft({ id, folderId });
		return folderIncludeEditDraft.includes(getParentId(item) ?? '0') && action;
	};

	const replyMsgAction = (): ActionReturnType => {
		const action = isConversation ? false : replyMsg({ id, folderId });
		return !folderExcludedReply.includes(getParentId(item) ?? '0') && action;
	};

	const replyAllMsgAction = (): ActionReturnType => {
		const action = isConversation ? false : replyAllMsg({ id, folderId });
		return !folderExcludedReplyAll.includes(getParentId(item) ?? '0') && action;
	};

	const forwardMsgAction = (): ActionReturnType => {
		const action = isConversation ? false : forwardMsg({ id, folderId });
		return !folderExcludedForward.includes(getParentId(item) ?? '0') && action;
	};

	const editAsNewAction = (): ActionReturnType => {
		const action = isConversation ? false : editAsNewMsg({ id, folderId });
		return !folderExcludedEditAsNew.includes(getParentId(item) ?? '0') && action;
	};

	const sendDraftAction = (): ActionReturnType => {
		const action = isConversation
			? false
			: sendDraft({ id, message: item as MailMessage, dispatch });
		return folderIncludedSendDraft.includes(getParentId(item) ?? '0') && action;
	};

	const redirectMsgAction = (): ActionReturnType => {
		const action = isConversation ? false : redirectMsg({ id });
		return !folderExcludedRedirect.includes(getParentId(item) ?? '0') && action;
	};

	// const markMsgAsNotSpam = (): ActionReturnType => {
	// 	const selectedItems = filter(
	// 		items,
	// 		(item: MsgOrConv) =>
	// 			ids.includes(id ?? '0') &&
	// 			foldersIncludedMarkNotSpam.includes(getParentId(item) ?? '0')
	// 	);
	// 	const action = isConversation
	// 		? setConversationsSpam({
	// 				ids: [id],
	// 				value: true,
	// 				dispatch,
	// 				deselectAll
	// 		  })
	// 		: setMsgAsSpam({ ids: [id], value: true, dispatch, folderId: folderId });

	// 	return selectedItems.length > 0 && selectedItems.length === ids.length && action;
	// };

	/**
	 * Primary actions are the ones that are shown when the user hovers over a message
	 * @returns an array of arrays of actions
	 */
	const primaryActions: Array<Omit<ActionReturnType, 'false'>> = [
		replyMsgAction(),
		replyAllMsgAction(),
		forwardMsgAction(),
		setMsgReadUnreadAction(),
		getMoveToTrashAction(),
		deletePermanentlyAction()
	].reduce((acc: Array<ActionReturnType>, action) => {
		if (action) {
			acc.push(action);
		}
		return acc;
	}, []);

	/**
	 * Secondary actions are the ones that are shown when the user right-clicks on the message
	 * @returns an array of arrays of actions
	 */
	const secondaryActions: Array<Omit<ActionReturnType, 'false'>> = [
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
	].reduce((acc: Array<ActionReturnType>, action) => {
		if (action) {
			acc.push(action);
		}
		return acc;
	}, []);

	/**
	 * Returns the actions for the message or conversation based on the type of the item and whether the editor is open or not (for conversations)
	 * @param _item the message or conversation
	 * @param closeEditor whether to close the editor or not
	 */
	const result = (
		_item: Conversation | MailMessage,
		closeEditor?: boolean
	): MsgConvActionsReturnType => [primaryActions, secondaryActions];

	return result;
}
