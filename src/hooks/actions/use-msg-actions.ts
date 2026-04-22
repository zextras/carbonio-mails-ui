/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { useParams } from 'react-router-dom';

import { useMsgArchiveDescriptor } from './use-msg-archive';
import { getParentFolderId } from 'helpers/folders';
import { useMsgApplyTagDescriptor } from 'hooks/actions/use-msg-apply-tag';
import { useMsgCreateAppointmentDescriptor } from 'hooks/actions/use-msg-create-appointment';
import { useMsgDeletePermanentlyDescriptor } from 'hooks/actions/use-msg-delete-permanently';
import { useMsgDownloadEmlDescriptor } from 'hooks/actions/use-msg-download-eml';
import { useMsgEditAsNewDescriptor } from 'hooks/actions/use-msg-edit-as-new';
import { useMsgEditDraftDescriptor } from 'hooks/actions/use-msg-edit-draft';
import { useMsgForwardDescriptor } from 'hooks/actions/use-msg-forward';
import { useMsgForwardAsAttachmentDescriptor } from 'hooks/actions/use-msg-forward-as-attachment';
import { useMsgMoveToFolderDescriptor } from 'hooks/actions/use-msg-move-to-folder';
import { useMsgMoveToTrashDescriptor } from 'hooks/actions/use-msg-move-to-trash';
import { useMsgPreviewOnSeparatedWindowDescriptor } from 'hooks/actions/use-msg-preview-on-separated-window';
import { useMsgPrintDescriptor } from 'hooks/actions/use-msg-print';
import { useMsgRedirectDescriptor } from 'hooks/actions/use-msg-redirect';
import { useMsgReplyDescriptor } from 'hooks/actions/use-msg-reply';
import { useMsgReplyAllDescriptor } from 'hooks/actions/use-msg-reply-all';
import { useMsgRestoreDescriptor } from 'hooks/actions/use-msg-restore';
import { useMsgSetFlagDescriptor } from 'hooks/actions/use-msg-set-flag';
import { useMsgSetNotSpamDescriptor } from 'hooks/actions/use-msg-set-not-spam';
import { useMsgSetReadDescriptor } from 'hooks/actions/use-msg-set-read';
import { useMsgSetSpamDescriptor } from 'hooks/actions/use-msg-set-spam';
import { useMsgSetUnflagDescriptor } from 'hooks/actions/use-msg-set-unflag';
import { useMsgSetUnreadDescriptor } from 'hooks/actions/use-msg-set-unread';
import { useMsgShowOriginalDescriptor } from 'hooks/actions/use-msg-show-original';
import { UIActionAggregator, UIActionDescriptor } from 'types/actions';
import { MailMessage } from 'types/messages';

export type MessageActionsArgumentType = {
	message: MailMessage;
	shouldReplaceHistory?: boolean;
};

type MessageActionsReturnType = {
	replyDescriptor: UIActionDescriptor;
	replyAllDescriptor: UIActionDescriptor;
	forwardDescriptor: UIActionDescriptor;
	forwardAsAttachmentDescriptor: UIActionDescriptor;
	moveToTrashDescriptor: UIActionDescriptor;
	deletePermanentlyDescriptor: UIActionDescriptor;
	messageReadDescriptor: UIActionDescriptor;
	messageUnreadDescriptor: UIActionDescriptor;
	flagDescriptor: UIActionDescriptor;
	unflagDescriptor: UIActionDescriptor;
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
	downloadEmlDescriptor: UIActionDescriptor;
	archiveDescriptor: UIActionDescriptor;
};

export const useMsgActions = ({
	message,
	shouldReplaceHistory = false
}: MessageActionsArgumentType): MessageActionsReturnType => {
	const folderId = getParentFolderId(message.parent);
	const { folderId: routeFolderId } = useParams();

	const replyDescriptor = useMsgReplyDescriptor(message.id, folderId);
	const replyAllDescriptor = useMsgReplyAllDescriptor(message.id, folderId);
	const forwardDescriptor = useMsgForwardDescriptor(message.id, folderId);
	const forwardAsAttachmentDescriptor = useMsgForwardAsAttachmentDescriptor([message.id], folderId);
	const moveToTrashDescriptor = useMsgMoveToTrashDescriptor({
		ids: [message.id],
		messageFolderId: folderId,
		routeFolderId,
		shouldReplaceHistory
	});
	const deletePermanentlyDescriptor = useMsgDeletePermanentlyDescriptor({
		ids: [message.id],
		folderId
	});
	const messageReadDescriptor = useMsgSetReadDescriptor({
		ids: [message.id],
		shouldReplaceHistory,
		folderId,
		isMessageRead: message.read
	});
	const messageUnreadDescriptor = useMsgSetUnreadDescriptor({
		ids: [message.id],
		shouldReplaceHistory,
		folderId,
		isMessageRead: message.read
	});
	const flagDescriptor = useMsgSetFlagDescriptor([message.id], !!message.flagged);
	const unflagDescriptor = useMsgSetUnflagDescriptor([message.id], !!message.flagged);
	const markAsSpamDescriptor = useMsgSetSpamDescriptor({
		ids: [message.id],
		shouldReplaceHistory,
		folderId
	});
	const markAsNotSpamDescriptor = useMsgSetNotSpamDescriptor({
		ids: [message.id],
		shouldReplaceHistory,
		folderId
	});
	const applyTagDescriptor = useMsgApplyTagDescriptor({
		ids: [message.id],
		messageTags: message.tags,
		folderId
	});
	const moveToFolderDescriptor = useMsgMoveToFolderDescriptor({
		folderId,
		ids: [message.id]
	});
	const restoreFolderDescriptor = useMsgRestoreDescriptor({
		folderId,
		messageId: message.id
	});
	const createAppointmentDescriptor = useMsgCreateAppointmentDescriptor(message, folderId);
	const printDescriptor = useMsgPrintDescriptor(message, folderId);
	const archiveDescriptor = useMsgArchiveDescriptor({
		messagesIds: [message.id],
		folderId: routeFolderId ?? folderId
	});

	const redirectDescriptor = useMsgRedirectDescriptor(message.id, folderId);
	const editDraftDescriptor = useMsgEditDraftDescriptor(message.id, message.isScheduled, folderId);
	const editAsNewDescriptor = useMsgEditAsNewDescriptor(message.id, folderId);
	const showOriginalDescriptor = useMsgShowOriginalDescriptor(message.id, folderId);
	const downloadEmlDescriptor = useMsgDownloadEmlDescriptor(message.id, folderId);

	const previewOnSeparatedWindowDescriptor = useMsgPreviewOnSeparatedWindowDescriptor({
		messageId: message.id,
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
			messageReadDescriptor,
			messageUnreadDescriptor,
			flagDescriptor,
			unflagDescriptor,
			markAsSpamDescriptor,
			markAsNotSpamDescriptor,
			applyTagDescriptor,
			moveToFolderDescriptor,
			restoreFolderDescriptor,
			createAppointmentDescriptor,
			printDescriptor,
			previewOnSeparatedWindowDescriptor,
			redirectDescriptor,
			editDraftDescriptor,
			editAsNewDescriptor,
			showOriginalDescriptor,
			downloadEmlDescriptor,
			archiveDescriptor
		}),
		[
			applyTagDescriptor,
			createAppointmentDescriptor,
			deletePermanentlyDescriptor,
			downloadEmlDescriptor,
			archiveDescriptor,
			editAsNewDescriptor,
			editDraftDescriptor,
			flagDescriptor,
			forwardDescriptor,
			forwardAsAttachmentDescriptor,
			markAsNotSpamDescriptor,
			markAsSpamDescriptor,
			messageReadDescriptor,
			messageUnreadDescriptor,
			moveToFolderDescriptor,
			moveToTrashDescriptor,
			previewOnSeparatedWindowDescriptor,
			printDescriptor,
			redirectDescriptor,
			replyAllDescriptor,
			replyDescriptor,
			restoreFolderDescriptor,
			showOriginalDescriptor,
			unflagDescriptor
		]
	);
};
