/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { find } from 'lodash';

import { useConvDeletePermanentlyDescriptor } from './use-conv-delete-permanently';
import { useConvForwardDescriptor } from './use-conv-forward';
import { useConvMoveToTrashDescriptor } from './use-conv-move-to-trash';
import { useConvSetAsRead } from './use-conv-set-as-read';
import { useConvSetAsUnread } from './use-conv-set-as-unread';
import { useConvSetFlagDescriptor } from './use-conv-set-flag';
import { useConvUnsetFlagDescriptor } from './use-conv-unset-flag';
import { useReplyAllConvDescriptor } from './use-reply-all-conv';
import { useReplyConvDescriptor } from './use-reply-conv';
import { isTrash } from '../../carbonio-ui-commons/helpers/folders';
import { getFolderIdParts, isDraft } from '../../helpers/folders';
import { Conversation, UIActionDescriptor } from '../../types';

export type ConversationActionsArgumentType = {
	conversation: Conversation;
	deselectAll: () => void;
	/*	shouldReplaceHistory?: boolean;
	messagePreviewFactory: () => React.JSX.Element; */
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
	/* sendDraftDescriptor: UIActionDescriptor;
	markAsSpamDescriptor: UIActionDescriptor;
	markAsNotSpamDescriptor: UIActionDescriptor;
	applyTagDescriptor: UIActionAggregator;
	moveToFolderDescriptor: UIActionDescriptor;
	restoreFolderDescriptor: UIActionDescriptor;
	createAppointmentDescriptor: UIActionDescriptor;
	printDescriptor: UIActionDescriptor;
	previewOnSeparatedWindowDescriptor: UIActionDescriptor;
	redirectDescriptor: UIActionDescriptor;
	editDraftDescriptor: UIActionDescriptor;
	editAsNewDescriptor: UIActionDescriptor;
	showOriginalDescriptor: UIActionDescriptor;
	downloadEmlDescriptor: UIActionDescriptor; */
};

export const useConvActions = ({
	conversation,
	deselectAll
}: ConversationActionsArgumentType): ConversationActionsReturnType => {
	const firstConversationMessage =
		find(conversation?.messages, (msg) => {
			const folderIdParts = getFolderIdParts(msg.parent).id ?? '';
			return !isTrash(folderIdParts) && !isDraft(folderIdParts);
		}) ?? conversation?.messages?.[0];

	// TODO: This condition is not the proper one as the first message is not a good indication of the folder id we are currently navigating.
	const folderId = firstConversationMessage.parent ?? '';

	const replyDescriptor = useReplyConvDescriptor({
		firstMessageId: firstConversationMessage.id,
		folderId,
		messagesLength: conversation.messages.length
	});
	const replyAllDescriptor = useReplyAllConvDescriptor({
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
	const setAsReadDescriptor = useConvSetAsRead({
		ids: [conversation.id],
		deselectAll,
		folderId,
		isConversationRead: conversation.read
	});
	const setAsUnreadDescriptor = useConvSetAsUnread({
		ids: [conversation.id],
		deselectAll,
		folderId,
		isConversationRead: conversation.read
	});
	const setFlagDescriptor = useConvSetFlagDescriptor([conversation.id], conversation.flagged);
	const unflagDescriptor = useConvUnsetFlagDescriptor([conversation.id], conversation.flagged);
	/* const sendDraftDescriptor = useMsgSendDraftDescriptor(conversation, folderId);
	const markAsSpamDescriptor = useMsgMarkAsSpamDescriptor({
		ids: [conversation.id],
		shouldReplaceHistory,
		folderId
	});
	const markAsNotSpamDescriptor = useMsgMarkAsNotSpamDescriptor({
		ids: [conversation.id],
		shouldReplaceHistory,
		folderId
	});
	const applyTagDescriptor = useMsgApplyTagDescriptor(conversation.id, conversation.tags, folderId);
	const moveToFolderDescriptor = useMsgMoveToFolderDescriptor({
		folderId,
		messageId: conversation.id,
		deselectAll
	});
	const restoreFolderDescriptor = useMsgRestoreDescriptor({
		folderId,
		messageId: conversation.id,
		deselectAll
	});
	const createAppointmentDescriptor = useMsgCreateAppointmentDescriptor(conversation, folderId);
	const printDescriptor = useMsgPrintDescriptor(conversation, folderId);

	const redirectDescriptor = useMsgRedirectDescriptor(conversation.id, folderId);
	const editDraftDescriptor = useMsgEdiDraftDescriptor(
		conversation.id,
		conversation.isScheduled,
		folderId
	);
	const editAsNewDescriptor = useMsgEditAsNewDescriptor(conversation.id, folderId);
	const showOriginalDescriptor = useMsgShowOriginalDescriptor(conversation.id, folderId);
	const downloadEmlDescriptor = useMsgDownloadEmlDescriptor(conversation.id, folderId);

	const previewOnSeparatedWindowDescriptor = useMsgPreviewOnSeparatedWindowDescriptor({
		messageId: conversation.id,
		subject: conversation.subject,
		messagePreviewFactory
	}); */

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
			unflagDescriptor
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
			unflagDescriptor
		]
	);
};
