/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { find } from 'lodash';

import { useConvApplyTagDescriptor } from './use-conv-apply-tag';
import { useConvDeletePermanentlyDescriptor } from './use-conv-delete-permanently';
import { useConvForwardDescriptor } from './use-conv-forward';
import { useConvMarkAsNotSpamDescriptor } from './use-conv-mark-as-not-spam';
import { useConvMarkAsSpamDescriptor } from './use-conv-mark-as-spam';
import { useConvMoveToFolderDescriptor } from './use-conv-move-to-folder';
import { useConvMoveToTrashDescriptor } from './use-conv-move-to-trash';
import { useConvPreviewOnSeparatedWindowDescriptor } from './use-conv-preview-on-separated-window';
import { useConvPrintDescriptor } from './use-conv-print';
import { useConvReplyDescriptor } from './use-conv-reply';
import { useConvReplyAllDescriptor } from './use-conv-reply-all';
import { useConvRestoreDescriptor } from './use-conv-restore';
import { useConvSetFlagDescriptor } from './use-conv-set-flag';
import { useConvSetReadDescriptor } from './use-conv-set-read';
import { useConvSetUnreadDescriptor } from './use-conv-set-unread';
import { useConvShowOriginalDescriptor } from './use-conv-show-original';
import { useConvUnsetFlagDescriptor } from './use-conv-unset-flag';
import { isTrash } from '../../carbonio-ui-commons/helpers/folders';
import { getFolderIdParts, isDraft } from '../../helpers/folders';
import { Conversation, UIActionAggregator, UIActionDescriptor } from '../../types';

export type ConversationActionsArgumentType = {
	conversation: Conversation;
	deselectAll: () => void;
	shouldReplaceHistory?: boolean;
	conversationPreviewFactory: () => React.JSX.Element;
};

type ConversationActionsReturnType = {
	replyDescriptor: UIActionDescriptor;
	replyAllDescriptor: UIActionDescriptor;
	forwardDescriptor: UIActionDescriptor;
	moveToTrashDescriptor: UIActionDescriptor;
	deletePermanentlyDescriptor: UIActionDescriptor;
	setAsReadDescriptor: UIActionDescriptor;
	setAsUnreadDescriptor: UIActionDescriptor;
	setFlagDescriptor: UIActionDescriptor;
	unflagDescriptor: UIActionDescriptor;
	markAsSpamDescriptor: UIActionDescriptor;
	markAsNotSpamDescriptor: UIActionDescriptor;
	applyTagDescriptor: UIActionAggregator;
	moveToFolderDescriptor: UIActionDescriptor;
	restoreFolderDescriptor: UIActionDescriptor;
	printDescriptor: UIActionDescriptor;
	previewOnSeparatedWindowDescriptor: UIActionDescriptor;
	showOriginalDescriptor: UIActionDescriptor;
};

export const useConvActions = ({
	conversation,
	deselectAll,
	shouldReplaceHistory = false,
	conversationPreviewFactory
}: ConversationActionsArgumentType): ConversationActionsReturnType => {
	const firstConversationMessage =
		find(conversation?.messages, (msg) => {
			const folderIdParts = getFolderIdParts(msg.parent).id ?? '';
			return !isTrash(folderIdParts) && !isDraft(folderIdParts);
		}) ?? conversation?.messages?.[0];

	// TODO: This condition is not the proper one as the first message is not a good indication of the folder id we are currently navigating.
	const folderId = firstConversationMessage.parent;

	const replyDescriptor = useConvReplyDescriptor({
		firstMessageId: firstConversationMessage.id,
		folderId,
		messagesLength: conversation.messages.length
	});
	const replyAllDescriptor = useConvReplyAllDescriptor({
		firstMessageId: firstConversationMessage.id,
		folderId,
		messagesLength: conversation.messages.length
	});
	const forwardDescriptor = useConvForwardDescriptor({
		firstMessageId: firstConversationMessage.id,
		folderId,
		messagesLength: conversation.messages.length
	});
	const moveToTrashDescriptor = useConvMoveToTrashDescriptor({
		ids: [conversation.id],
		deselectAll,
		folderId
	});
	const deletePermanentlyDescriptor = useConvDeletePermanentlyDescriptor({
		ids: [conversation.id],
		deselectAll,
		folderId
	});
	const setAsReadDescriptor = useConvSetReadDescriptor({
		ids: [conversation.id],
		deselectAll,
		folderId,
		isConversationRead: conversation.read
	});
	const setAsUnreadDescriptor = useConvSetUnreadDescriptor({
		ids: [conversation.id],
		deselectAll,
		folderId,
		isConversationRead: conversation.read
	});
	const setFlagDescriptor = useConvSetFlagDescriptor([conversation.id], conversation.flagged);
	const unflagDescriptor = useConvUnsetFlagDescriptor([conversation.id], conversation.flagged);
	const markAsSpamDescriptor = useConvMarkAsSpamDescriptor({
		ids: [conversation.id],
		shouldReplaceHistory,
		folderId
	});
	const markAsNotSpamDescriptor = useConvMarkAsNotSpamDescriptor({
		ids: [conversation.id],
		shouldReplaceHistory,
		folderId
	});

	const applyTagDescriptor = useConvApplyTagDescriptor({
		ids: [conversation.id],
		conversationTags: conversation.tags,
		folderId
	});
	const moveToFolderDescriptor = useConvMoveToFolderDescriptor({
		folderId,
		ids: [conversation.id],
		deselectAll
	});
	const restoreFolderDescriptor = useConvRestoreDescriptor({
		folderId,
		conversationId: conversation.id,
		deselectAll
	});
	const printDescriptor = useConvPrintDescriptor([conversation], folderId);

	const showOriginalDescriptor = useConvShowOriginalDescriptor(
		firstConversationMessage.id,
		folderId
	);

	const previewOnSeparatedWindowDescriptor = useConvPreviewOnSeparatedWindowDescriptor({
		conversationId: conversation.id,
		subject: conversation.subject,
		conversationPreviewFactory
	});

	return useMemo(
		() => ({
			replyDescriptor,
			replyAllDescriptor,
			forwardDescriptor,
			moveToTrashDescriptor,
			deletePermanentlyDescriptor,
			setAsReadDescriptor,
			setAsUnreadDescriptor,
			setFlagDescriptor,
			unflagDescriptor,
			markAsSpamDescriptor,
			markAsNotSpamDescriptor,
			applyTagDescriptor,
			moveToFolderDescriptor,
			restoreFolderDescriptor,
			printDescriptor,
			previewOnSeparatedWindowDescriptor,
			showOriginalDescriptor
		}),
		[
			replyDescriptor,
			replyAllDescriptor,
			forwardDescriptor,
			moveToTrashDescriptor,
			deletePermanentlyDescriptor,
			setAsReadDescriptor,
			setAsUnreadDescriptor,
			setFlagDescriptor,
			unflagDescriptor,
			markAsSpamDescriptor,
			markAsNotSpamDescriptor,
			applyTagDescriptor,
			moveToFolderDescriptor,
			restoreFolderDescriptor,
			printDescriptor,
			previewOnSeparatedWindowDescriptor,
			showOriginalDescriptor
		]
	);
};
