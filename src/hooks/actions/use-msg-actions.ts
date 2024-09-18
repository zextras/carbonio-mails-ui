/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { useMsgApplyTagDescriptor } from './use-msg-apply-tag';
import { useMsgCreateAppointmentDescriptor } from './use-msg-create-appointment';
import { useDeleteMsgPermanentlyDescriptor } from './use-msg-delete-permanently';
import { useMsgDownloadEmlDescriptor } from './use-msg-download-eml';
import { useMsgEditAsNewDescriptor } from './use-msg-edit-as-new';
import { useMsgEdiDraftDescriptor } from './use-msg-edit-draft';
import { useMsgFlagDescriptor } from './use-msg-flag';
import { useForwardMsgDescriptor } from './use-msg-forward';
import { useMsgMarkAsNotSpamDescriptor } from './use-msg-mark-as-not-spam';
import { useMsgMarkAsSpamDescriptor } from './use-msg-mark-as-spam';
import { useMsgMoveToFolderDescriptor } from './use-msg-move-to-folder';
import { useMsgMoveToTrashDescriptor } from './use-msg-move-to-trash';
import { useMsgPreviewOnSeparatedWindowDescriptor } from './use-msg-preview-on-separated-window';
import { useMsgPrintDescriptor } from './use-msg-print';
import { useMsgRedirectDescriptor } from './use-msg-redirect';
import { useMsgRestoreDescriptor } from './use-msg-restore';
import { useMsgSendDraftDescriptor } from './use-msg-send-draft';
import { useMsgShowOriginalDescriptor } from './use-msg-show-original';
import { useMsgUnflagDescriptor } from './use-msg-unflag';
import { useReplyAllMsg } from './use-reply-all-msg';
import { useReplyMsgDescriptor } from './use-reply-msg';
import { useSetMsgReadDescriptor } from './use-set-msg-read';
import { useSetMsgUnreadDescriptor } from './use-set-msg-unread';
import { getParentFolderId } from '../../helpers/folders';
import { MailMessage, UIActionAggregator, UIActionDescriptor } from '../../types';

export type MessageActionsArgumentType = {
	message: MailMessage;
	deselectAll: () => void;
	shouldReplaceHistory?: boolean;
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
	shouldReplaceHistory = false
}: MessageActionsArgumentType): MessageActionsReturnType => {
	const folderId = getParentFolderId(message.parent);

	const replyDescriptor = useReplyMsgDescriptor(message.id, folderId);
	const replyAllDescriptor = useReplyAllMsg(message.id);
	const forwardDescriptor = useForwardMsgDescriptor(message.id);
	const moveToTrashDescriptor = useMsgMoveToTrashDescriptor({
		ids: [message.id],
		deselectAll,
		folderId,
		shouldReplaceHistory
	});
	const deletePermanentlyDescriptor = useDeleteMsgPermanentlyDescriptor({
		messageId: message.id,
		deselectAll
	});
	const messageReadDescriptor = useSetMsgReadDescriptor({
		ids: [message.id],
		deselectAll,
		shouldReplaceHistory,
		folderId
	});
	const messageUnreadDescriptor = useSetMsgUnreadDescriptor({
		ids: [message.id],
		deselectAll,
		shouldReplaceHistory,
		folderId
	});
	const flagDescriptor = useMsgFlagDescriptor([message.id]);
	const unflagDescriptor = useMsgUnflagDescriptor([message.id]);
	const sendDraftDescriptor = useMsgSendDraftDescriptor(message);
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
	const applyTagDescriptor = useMsgApplyTagDescriptor(message.id, message.tags);
	const moveToFolderDescriptor = useMsgMoveToFolderDescriptor({
		folderId,
		messageId: message.id,
		deselectAll
	});
	const restoreFolderDescriptor = useMsgRestoreDescriptor({
		folderId,
		messageId: message.id,
		deselectAll
	});
	const createAppointmentDescriptor = useMsgCreateAppointmentDescriptor(message);
	const printDescriptor = useMsgPrintDescriptor(message);

	const redirectDescriptor = useMsgRedirectDescriptor(message.id);
	const editDraftDescriptor = useMsgEdiDraftDescriptor(message.id, message.isScheduled);
	const editAsNewDescriptor = useMsgEditAsNewDescriptor(message.id);
	const showOriginalDescriptor = useMsgShowOriginalDescriptor(message.id);
	const downloadEmlDescriptor = useMsgDownloadEmlDescriptor(message.id);

	const previewOnSeparatedWindowDescriptor = useMsgPreviewOnSeparatedWindowDescriptor({
		messageId: message.id,
		folderId,
		subject: message.subject
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
