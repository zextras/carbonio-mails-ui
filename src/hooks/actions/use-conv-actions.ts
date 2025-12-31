/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { isTrash } from '@zextras/carbonio-ui-commons';
import { find } from 'lodash';

import { getFolderIdParts, getParentFolderId, isDraft } from 'helpers/folders';
import { useConvApplyTagDescriptor } from 'hooks/actions/use-conv-apply-tag';
import { useConvDeletePermanentlyDescriptor } from 'hooks/actions/use-conv-delete-permanently';
import { useConvForwardDescriptor } from 'hooks/actions/use-conv-forward';
import { useConvForwardAsAttachmentDescriptor } from 'hooks/actions/use-conv-forward-as-attachment';
import { useConvMoveToFolderDescriptor } from 'hooks/actions/use-conv-move-to-folder';
import { useConvMoveToTrashDescriptor } from 'hooks/actions/use-conv-move-to-trash';
import { useConvPreviewOnSeparatedWindowDescriptor } from 'hooks/actions/use-conv-preview-on-separated-window';
import { useConvPrintDescriptor } from 'hooks/actions/use-conv-print';
import { useConvReplyDescriptor } from 'hooks/actions/use-conv-reply';
import { useConvReplyAllDescriptor } from 'hooks/actions/use-conv-reply-all';
import { useConvRestoreDescriptor } from 'hooks/actions/use-conv-restore';
import { useConvSetFlagDescriptor } from 'hooks/actions/use-conv-set-flag';
import { useConvSetNotSpamDescriptor } from 'hooks/actions/use-conv-set-not-spam';
import { useConvSetReadDescriptor } from 'hooks/actions/use-conv-set-read';
import { useConvSetSpamDescriptor } from 'hooks/actions/use-conv-set-spam';
import { useConvSetUnflagDescriptor } from 'hooks/actions/use-conv-set-unflag';
import { useConvSetUnreadDescriptor } from 'hooks/actions/use-conv-set-unread';
import { useConvShowOriginalDescriptor } from 'hooks/actions/use-conv-show-original';
import { useConversationMessages } from 'store/emails/store';
import { NormalizedConversation, UIActionAggregator, UIActionDescriptor } from 'types/index.d';

export type ConversationActionsArgumentType = {
	conversation: NormalizedConversation;
	shouldReplaceHistory?: boolean;
	routeFolderId?: string;
};

type ConversationActionsReturnType = {
	replyDescriptor: UIActionDescriptor;
	replyAllDescriptor: UIActionDescriptor;
	forwardDescriptor: UIActionDescriptor;
	forwardAsAttachmentDescriptor: UIActionDescriptor;
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
	shouldReplaceHistory = false,
	routeFolderId
}: ConversationActionsArgumentType): ConversationActionsReturnType => {
	const messages = useConversationMessages(conversation.id);
	const firstConversationMessage =
		find(messages, (msg) => {
			const folderIdParts = getFolderIdParts(msg.parent).id ?? '';
			return !isTrash(folderIdParts) && !isDraft(folderIdParts);
		}) ?? messages?.[0];

	const folderId = routeFolderId ?? getParentFolderId(firstConversationMessage.parent);

	const replyDescriptor = useConvReplyDescriptor({
		firstMessageId: firstConversationMessage.id,
		folderId,
		messagesLength: messages.length
	});
	const replyAllDescriptor = useConvReplyAllDescriptor({
		firstMessageId: firstConversationMessage.id,
		folderId,
		messagesLength: messages.length
	});
	const forwardDescriptor = useConvForwardDescriptor({
		firstMessageId: firstConversationMessage.id,
		folderId,
		messagesLength: messages.length
	});
	const forwardAsAttachmentDescriptor = useConvForwardAsAttachmentDescriptor({
		firstMessageId: firstConversationMessage.id,
		folderId,
		messagesLength: messages.length
	});
	const moveToTrashDescriptor = useConvMoveToTrashDescriptor({
		ids: [conversation.id],
		folderId
	});
	const deletePermanentlyDescriptor = useConvDeletePermanentlyDescriptor({
		ids: [conversation.id],
		folderId
	});
	const setAsReadDescriptor = useConvSetReadDescriptor({
		ids: [conversation.id],
		folderId,
		isConversationRead: conversation.read
	});
	const setAsUnreadDescriptor = useConvSetUnreadDescriptor({
		ids: [conversation.id],
		folderId,
		isConversationRead: conversation.read
	});
	const setFlagDescriptor = useConvSetFlagDescriptor([conversation.id], conversation.flagged);
	const unflagDescriptor = useConvSetUnflagDescriptor([conversation.id], conversation.flagged);
	const markAsSpamDescriptor = useConvSetSpamDescriptor({
		ids: [conversation.id],
		shouldReplaceHistory,
		folderId
	});
	const markAsNotSpamDescriptor = useConvSetNotSpamDescriptor({
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
		ids: [conversation.id]
	});
	const restoreFolderDescriptor = useConvRestoreDescriptor({
		folderId,
		conversationId: conversation.id
	});
	const printDescriptor = useConvPrintDescriptor([conversation], folderId);

	const showOriginalDescriptor = useConvShowOriginalDescriptor(
		firstConversationMessage.id,
		folderId
	);

	const previewOnSeparatedWindowDescriptor = useConvPreviewOnSeparatedWindowDescriptor({
		conversationId: conversation.id,
		folderId
	});

	return useMemo(
		() => ({
			replyDescriptor,
			replyAllDescriptor,
			forwardDescriptor,
			forwardAsAttachmentDescriptor,
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
			forwardAsAttachmentDescriptor,
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
