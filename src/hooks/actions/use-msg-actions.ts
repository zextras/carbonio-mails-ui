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
import { MailMessage, UIActionDescriptor } from '../../types';
import { useGlobalExtraWindowManager } from '../../views/app/extra-windows/global-extra-window-manager';

export type MessageActionsType = {
	message: MailMessage;
};

export const useMsgActions = ({
	message
}: MessageActionsType): Record<string, UIActionDescriptor> => {
	const messageId = message.id;
	const messageActions: UIActionDescriptor[] = [];
	const deselectAll = (): null => null;
	const closeEditor = false;
	const shouldReplaceHistory = false;
	const { createWindow } = useGlobalExtraWindowManager();
	const folderId = getParentFolderId(message.parent);

	const replyDescriptor = useReplyMsgDescriptor(messageId, folderId);
	const replyAllDescriptor = useReplyAllMsg(messageId);
	const forwardDescriptor = useForwardMsgDescriptor(messageId);
	const moveToTrashDescriptor = useMsgMoveToTrashDescriptor({
		ids: [messageId],
		deselectAll,
		folderId,
		closeEditor
	});
	const deletePermanentlyDescriptor = useDeleteMsgPermanentlyDescriptor({ messageId, deselectAll });
	const messageReadDescriptor = useSetMsgReadDescriptor({
		ids: [messageId],
		deselectAll,
		shouldReplaceHistory,
		folderId
	});
	const messageUnreadDescriptor = useSetMsgUnreadDescriptor({
		ids: [messageId],
		deselectAll,
		shouldReplaceHistory,
		folderId
	});
	const flagDescriptor = useMsgFlagDescriptor([messageId]);
	const unflagDescriptor = useMsgUnflagDescriptor([messageId]);
	const sendDraftDescriptor = useMsgSendDraftDescriptor(message);
	const markAsSpamDescriptor = useMsgMarkAsSpamDescriptor({
		ids: [messageId],
		shouldReplaceHistory,
		folderId
	});
	const markAsNotSpamDescriptor = useMsgMarkAsNotSpamDescriptor({
		ids: [messageId],
		shouldReplaceHistory,
		folderId
	});
	const applyTagDescriptor = useMsgApplyTagDescriptor(messageId);
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

	const redirectDescriptor = useMsgRedirectDescriptor(messageId);
	const editDraftDescriptor = useMsgEdiDraftDescriptor(messageId, message.isScheduled);
	const editAsNewDescriptor = useMsgEditAsNewDescriptor(messageId);
	const showOriginalDescriptor = useMsgShowOriginalDescriptor(messageId);
	const downloadEmlDescriptor = useMsgDownloadEmlDescriptor(messageId);
	const previewOnSeparatedWindowDescriptor = useMsgPreviewOnSeparatedWindowDescriptor({
		messageId,
		folderId,
		messageActions,
		subject: message.subject,
		createWindow
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
