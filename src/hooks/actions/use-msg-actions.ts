/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { useMsgApplyTagDescriptor } from './use-msg-apply-tag';
import { useMsgCreateAppointmentDescriptor } from './use-msg-create-appointment';
import { useMsgDeletePermanentlyDescriptor } from './use-msg-delete-permanently';
import { useMsgDownloadEmlDescriptor } from './use-msg-download-eml';
import { useMsgEditAsNewDescriptor } from './use-msg-edit-as-new';
import { useMsgEditDraftDescriptor } from './use-msg-edit-draft';
import { useMsgFlagDescriptor } from './use-msg-flag';
import { useMsgForwardDescriptor } from './use-msg-forward';
import { useMsgMarkAsNotSpamDescriptor } from './use-msg-mark-as-not-spam';
import { useMsgMarkAsSpamDescriptor } from './use-msg-mark-as-spam';
import { useMsgMoveToFolderDescriptor } from './use-msg-move-to-folder';
import { useMsgMoveToTrashDescriptor } from './use-msg-move-to-trash';
import { useMsgPreviewOnSeparatedWindowDescriptor } from './use-msg-preview-on-separated-window';
import { useMsgPrintDescriptor } from './use-msg-print';
import { useMsgRedirectDescriptor } from './use-msg-redirect';
import { useMsgReplyDescriptor } from './use-msg-reply';
import { useMsgReplyAllDescriptor } from './use-msg-reply-all';
import { useMsgRestoreDescriptor } from './use-msg-restore';
import { useMsgSendDraftDescriptor } from './use-msg-send-draft';
import { useMsgSetReadDescriptor } from './use-msg-set-read';
import { useMsgSetUnreadDescriptor } from './use-msg-set-unread';
import { useMsgShowOriginalDescriptor } from './use-msg-show-original';
import { useMsgUnflagDescriptor } from './use-msg-unflag';
import { getParentFolderId } from '../../helpers/folders';
import { MailMessage, UIActionAggregator, UIActionDescriptor } from '../../types';

export type MessageActionsArgumentType = {
	message: MailMessage;
	deselectAll: () => void;
	shouldReplaceHistory?: boolean;
	messagePreviewFactory: () => React.JSX.Element;
};

type MessageActionsReturnType = {
	replyDescriptor: UIActionDescriptor;
	replyAllDescriptor: UIActionDescriptor;
	forwardDescriptor: UIActionDescriptor;
	moveToTrashDescriptor: UIActionDescriptor;
	deletePermanentlyDescriptor: UIActionDescriptor;
	messageReadDescriptor: UIActionDescriptor;
	messageUnreadDescriptor: UIActionDescriptor;
	flagDescriptor: UIActionDescriptor;
	unflagDescriptor: UIActionDescriptor;
	sendDraftDescriptor: UIActionDescriptor;
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
};

export const useMsgActions = ({
	deselectAll,
	message,
	shouldReplaceHistory = false,
	messagePreviewFactory
}: MessageActionsArgumentType): MessageActionsReturnType => {
	const folderId = getParentFolderId(message.parent);

	const replyDescriptor = useMsgReplyDescriptor(message.id, folderId);
	const replyAllDescriptor = useMsgReplyAllDescriptor(message.id, folderId);
	const forwardDescriptor = useMsgForwardDescriptor(message.id, folderId);
	const moveToTrashDescriptor = useMsgMoveToTrashDescriptor({
		ids: [message.id],
		deselectAll,
		folderId,
		shouldReplaceHistory
	});
	const deletePermanentlyDescriptor = useMsgDeletePermanentlyDescriptor({
		ids: [message.id],
		deselectAll,
		folderId
	});
	const messageReadDescriptor = useMsgSetReadDescriptor({
		ids: [message.id],
		deselectAll,
		shouldReplaceHistory,
		folderId,
		isMessageRead: message.read
	});
	const messageUnreadDescriptor = useMsgSetUnreadDescriptor({
		ids: [message.id],
		deselectAll,
		shouldReplaceHistory,
		folderId,
		isMessageRead: message.read
	});
	const flagDescriptor = useMsgFlagDescriptor([message.id], message.flagged);
	const unflagDescriptor = useMsgUnflagDescriptor([message.id], message.flagged);
	const sendDraftDescriptor = useMsgSendDraftDescriptor(message, folderId);
	const markAsSpamDescriptor = useMsgMarkAsSpamDescriptor({
		ids: [message.id],
		shouldReplaceHistory,
		folderId
	});
	const markAsNotSpamDescriptor = useMsgMarkAsNotSpamDescriptor({
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
		ids: [message.id],
		deselectAll
	});
	const restoreFolderDescriptor = useMsgRestoreDescriptor({
		folderId,
		messageId: message.id,
		deselectAll
	});
	const createAppointmentDescriptor = useMsgCreateAppointmentDescriptor(message, folderId);
	const printDescriptor = useMsgPrintDescriptor(message, folderId);

	const redirectDescriptor = useMsgRedirectDescriptor(message.id, folderId);
	const editDraftDescriptor = useMsgEditDraftDescriptor(message.id, message.isScheduled, folderId);
	const editAsNewDescriptor = useMsgEditAsNewDescriptor(message.id, folderId);
	const showOriginalDescriptor = useMsgShowOriginalDescriptor(message.id, folderId);
	const downloadEmlDescriptor = useMsgDownloadEmlDescriptor(message.id, folderId);

	const previewOnSeparatedWindowDescriptor = useMsgPreviewOnSeparatedWindowDescriptor({
		messageId: message.id,
		subject: message.subject,
		messagePreviewFactory
	});

	return useMemo(
		() => ({
			replyDescriptor,
			replyAllDescriptor,
			forwardDescriptor,
			moveToTrashDescriptor,
			deletePermanentlyDescriptor,
			messageReadDescriptor,
			messageUnreadDescriptor,
			flagDescriptor,
			unflagDescriptor,
			sendDraftDescriptor,
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
			downloadEmlDescriptor
		}),
		[
			applyTagDescriptor,
			createAppointmentDescriptor,
			deletePermanentlyDescriptor,
			downloadEmlDescriptor,
			editAsNewDescriptor,
			editDraftDescriptor,
			flagDescriptor,
			forwardDescriptor,
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
			sendDraftDescriptor,
			showOriginalDescriptor,
			unflagDescriptor
		]
	);
};
