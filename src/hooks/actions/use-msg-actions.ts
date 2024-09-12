/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { useDeleteMsgPermanentlyDescriptor } from './use-delete-msg-permanently';
import { useForwardMsgDescriptor } from './use-forward-msg';
import { useMoveToTrashDescriptor } from './use-move-to-trash';
import { useMsgCreateAppointmentDescriptor } from './use-msg-create-appointment';
import { useMsgFlagDescriptor } from './use-msg-flag';
import { useMsgMarkAsNotSpamDescriptor } from './use-msg-mark-as-not-spam';
import { useMsgMarkAsSpamDescriptor } from './use-msg-mark-as-spam';
import { useMsgMoveToFolderDescriptor } from './use-msg-move-to-folder';
import { useMsgPreviewOnSeparatedWindowDescriptor } from './use-msg-preview-on-separated-window';
import { useMsgPrintDescriptor } from './use-msg-print';
import { useMsgRestoreDescriptor } from './use-msg-restore';
import { useMsgSendDraftDescriptor } from './use-msg-send-draft';
import { useMsgUnflagDescriptor } from './use-msg-unflag';
import { UIActionDescriptor } from './use-redirect-msg';
import { useReplyAllMsg } from './use-reply-all-msg';
import { useReplyMsgDescriptor } from './use-reply-msg';
import { useSetMsgReadDescriptor } from './use-set-msg-read';
import { useSetMsgUnreadDescriptor } from './use-set-msg-unread';
import { applyTag } from '../../ui-actions/tag-actions';

export type MessageActionsType = {
	messageId: string;
	folderId: string;
};

export const useMsgActions = ({
	messageId,
	folderId,
	ids,
	deselectAll,
	closeEditor,
	shouldReplaceHistory,
	message,
	tags,
	messageActions,
	subject,
	createWindow
}: MessageActionsType): Record<string, UIActionDescriptor> => {
	const replyDescriptor = useReplyMsgDescriptor(messageId, folderId);
	const replyAllDescriptor = useReplyAllMsg(messageId);
	const forwardDescriptor = useForwardMsgDescriptor(messageId);
	const moveToTrashDescriptor = useMoveToTrashDescriptor({
		ids,
		deselectAll,
		folderId,
		closeEditor
	});
	const deletePermanentlyDescriptor = useDeleteMsgPermanentlyDescriptor({ messageId, deselectAll });
	const messageReadDescriptor = useSetMsgReadDescriptor({
		ids,
		deselectAll,
		shouldReplaceHistory,
		folderId
	});
	const messageUnreadDescriptor = useSetMsgUnreadDescriptor({
		ids,
		deselectAll,
		shouldReplaceHistory,
		folderId
	});
	const flagDescriptor = useMsgFlagDescriptor(ids);
	const unflagDescriptor = useMsgUnflagDescriptor(ids);
	const sendDraftDescriptor = useMsgSendDraftDescriptor(message);
	const markAsSpamDescriptor = useMsgMarkAsSpamDescriptor({ ids, shouldReplaceHistory, folderId });
	const markAsNotSpamDescriptor = useMsgMarkAsNotSpamDescriptor({
		ids,
		shouldReplaceHistory,
		folderId
	});
	const applyTagDescriptor = applyTag({ tags, conversation: message, isMessage: true });
	const moveToFolderDescriptor = useMsgMoveToFolderDescriptor({
		folderId,
		messageId,
		deselectAll
	});
	const restoreFolderDescriptor = useMsgRestoreDescriptor({
		folderId,
		messageId,
		deselectAll
	});
	const createAppointmentDescriptor = useMsgCreateAppointmentDescriptor(message);
	const printDescriptor = useMsgPrintDescriptor(message);
	const previewOnSeparatedWindowDescriptor = useMsgPreviewOnSeparatedWindowDescriptor({
		messageId,
		folderId,
		messageActions,
		subject,
		createWindow
	});
	const redirectDescriptor = userEdirectDescriptor();
	const editDraftDescriptor = useEditDraftDescriptor();
	const editAsNewDescriptor = useEditAsNewDescriptor();
	const showOriginalDescriptor = useShowOriginalDescriptor();
	const downloadEmlDescriptor = useDownloadEmlDescriptor();

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
			deletePermanentlyDescriptor,
			flagDescriptor,
			forwardDescriptor,
			messageReadDescriptor,
			messageUnreadDescriptor,
			moveToTrashDescriptor,
			replyAllDescriptor,
			replyDescriptor,
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
		]
	);
};
