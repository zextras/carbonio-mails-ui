/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SyntheticEvent } from 'react';

import { FOLDERS, useTags } from '@zextras/carbonio-shell-ui';
import { filter } from 'lodash';

import { useUIActionConvForward } from './conv-forward';
import { useUIActionConvReply } from './conv-reply';
import { useUIActionConvReplyAll } from './conv-reply-all';
import {
	getAddRemoveFlagAction,
	getApplyTagAction,
	getDeletePermanentlyAction,
	getDownloadEmlAction,
	getEditAsNewAction,
	getEditDraftAction,
	getForwardAction,
	getMarkRemoveSpam,
	getMoveToFolderAction,
	getMoveToTrashAction,
	getPreviewOnSeparatedWindowAction,
	getPrintAction,
	getReadUnreadAction,
	getRedirectAction,
	getReplyAction,
	getReplyAllAction,
	getSendDraftAction,
	getShowOriginalAction
} from './get-msg-conv-actions-functions';
import { getFolderIdParts } from '../helpers/folders';
import { getParentFolderId, isConversation } from '../helpers/messages';
import { useAppDispatch } from '../hooks/redux';
import type {
	ActionReturnType,
	Conversation,
	MailMessage,
	MessageAction,
	UIAction
} from '../types';
import { useExtraWindowsManager } from '../views/app/extra-windows/extra-window-manager';

type useMsgConvActionsProps = {
	item: MailMessage | Conversation;
	deselectAll: () => void;
	messageActionsForExtraWindow: Array<MessageAction>;
};

export type MsgConvActionsReturnType = [
	Array<Exclude<ActionReturnType, false>>,
	Array<Exclude<ActionReturnType, false>>
];

const createUIActionAdapter = <T extends UIAction>(
	action: T,
	invoker: () => void
): T & { onClick: (ev?: KeyboardEvent | SyntheticEvent<HTMLElement, Event>) => void } => ({
	...action,
	onClick: invoker
});

export function useMsgConvActions({
	item,
	deselectAll,
	messageActionsForExtraWindow
}: useMsgConvActionsProps): MsgConvActionsReturnType {
	const isConv = isConversation(item);
	const folderId = getParentFolderId(item);
	const dispatch = useAppDispatch();
	const tags = useTags();
	const { createWindow } = useExtraWindowsManager();

	const uiActionConvReply = useUIActionConvReply();
	const uiActionConvReplyAll = useUIActionConvReplyAll();
	const uiActionConvForward = useUIActionConvForward();

	if (!folderId) {
		return [[], []];
	}

	const firstConversationMessage = isConv
		? filter(
				item?.messages,
				(msg) => ![FOLDERS.TRASH, FOLDERS.DRAFTS].includes(getFolderIdParts(msg.parent).id ?? '')
		  )?.[0] ?? {}
		: item;
	const { id } = item;

	/**
	 * Folders where the actions are enabled or disabled
	 */
	const foldersExcludedMarkReadUnread = [FOLDERS.DRAFTS];
	const foldersExcludedTrash = [FOLDERS.TRASH];
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
	const folderExcludedDownloadEML = [FOLDERS.DRAFTS];

	const addRemoveFlagAction = getAddRemoveFlagAction({
		isConversation: isConv,
		id,
		item,
		dispatch
	});

	const msgReadUnreadAction = getReadUnreadAction({
		isConversation: isConv,
		id,
		item,
		dispatch,
		folderId,
		deselectAll,
		foldersExcludedMarkReadUnread
	});

	const moveToTrashAction = getMoveToTrashAction({
		isConversation: isConv,
		id,
		dispatch,
		folderId: firstConversationMessage.parent,
		deselectAll,
		foldersExcludedTrash
	});

	const deletePermanentlyAction = getDeletePermanentlyAction({
		isConversation: isConv,
		id,
		deselectAll,
		dispatch,
		foldersIncludedDeletePermanently,
		folderId: firstConversationMessage.parent
	});

	const moveToFolderAction = getMoveToFolderAction({
		isConversation: isConv,
		id,
		dispatch,
		folderId: firstConversationMessage.parent,
		deselectAll
	});

	const printAction = getPrintAction({
		isConversation: isConv,
		item,
		folderExcludedPrintMessage,
		folderId
	});

	const applyTagAction = getApplyTagAction({
		tags,
		item,
		isConversation: isConv,
		foldersExcludedTags,
		folderId
	});

	const markRemoveSpam = getMarkRemoveSpam({
		isConversation: isConv,
		id,
		folderId,
		dispatch,
		deselectAll,
		foldersExcludedMarkUnmarkSpam
	});

	const showOriginalAction = getShowOriginalAction({
		isConversation: isConv,
		id: firstConversationMessage.id,
		folderExcludedShowOriginal,
		folderId: firstConversationMessage.parent
	});

	const editDraftAction = getEditDraftAction({
		isConversation: isConv,
		id,
		folderId,
		folderIncludeEditDraft
	});

	const msgReplyAction = isConv
		? false
		: getReplyAction(false, false, id, folderId, id, folderExcludedReply);

	const convReplyAction: ActionReturnType =
		isConv && uiActionConvReply.canExecute?.(item)
			? createUIActionAdapter(uiActionConvReply, () =>
					uiActionConvReply.execute?.({ conversation: item })
			  )
			: false;

	const msgReplyAllAction = isConv
		? false
		: getReplyAllAction({
				isConversation: false,
				isSingleMessageConversation: false,
				firstConversationMessageId: id,
				folderId,
				id,
				folderExcludedReplyAll
		  });

	const convReplyAllAction: ActionReturnType =
		isConv && uiActionConvReplyAll.canExecute?.(item)
			? createUIActionAdapter(uiActionConvReplyAll, () =>
					uiActionConvReplyAll.execute?.({ conversation: item })
			  )
			: false;

	const msgForwardAction = isConv
		? false
		: getForwardAction({
				isConversation: false,
				isSingleMessageConversation: false,
				firstConversationMessageId: id,
				folderId,
				id,
				folderExcludedForward
		  });

	const convForwardAction: ActionReturnType =
		isConv && uiActionConvForward.canExecute?.(item)
			? createUIActionAdapter(uiActionConvForward, () =>
					uiActionConvForward.execute?.({ conversation: item })
			  )
			: false;

	const editAsNewAction = getEditAsNewAction({
		isConversation: isConv,
		id,
		folderId,
		folderExcludedEditAsNew
	});

	const sendDraftAction = getSendDraftAction({
		isConversation: isConv,
		item,
		dispatch,
		folderIncludedSendDraft,
		folderId
	});

	const redirectAction = getRedirectAction({
		isConversation: isConv,
		id,
		folderExcludedRedirect,
		folderId
	});

	const previewOnSeparatedWindow = getPreviewOnSeparatedWindowAction({
		isConversation: isConv,
		id,
		folderId,
		subject: item.subject,
		createWindow,
		messageActions: messageActionsForExtraWindow
	});

	const downloadEmlAction = getDownloadEmlAction({
		isConversation: isConv,
		id,
		folderId,
		folderExcludedDownloadEML
	});

	/**
	 * Primary actions are the ones that are shown when the user hovers over a message
	 * @returns an array of arrays of actions
	 */
	const primaryActions: Array<Exclude<ActionReturnType, false>> = [
		editDraftAction,
		msgReplyAction,
		convReplyAction,
		msgReplyAllAction,
		convReplyAllAction,
		msgForwardAction,
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
		msgReplyAction,
		convReplyAction,
		msgReplyAllAction,
		convReplyAllAction,
		msgForwardAction,
		convForwardAction,
		sendDraftAction,
		moveToTrashAction,
		deletePermanentlyAction,
		msgReadUnreadAction,
		addRemoveFlagAction,
		markRemoveSpam,
		applyTagAction,
		moveToFolderAction,
		printAction,
		previewOnSeparatedWindow,
		redirectAction,
		editDraftAction,
		editAsNewAction,
		showOriginalAction,
		downloadEmlAction
	].reduce((acc: Array<Exclude<ActionReturnType, false>>, action) => {
		if (action) {
			acc.push(action);
		}
		return acc;
	}, []);

	return [primaryActions, secondaryActions];
}
