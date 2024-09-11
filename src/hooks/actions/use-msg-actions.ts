/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { useDeleteMsgPermanentlyDescriptor } from './use-delete-msg-permanently';
import { useForwardMsgDescriptor } from './use-forward-msg';
import { useMoveToTrashDescriptor } from './use-move-to-trash';
import { useMsgFlagDescriptor } from './use-msg-flag';
import { useMsgUnflagDescriptor } from './use-msg-unflag';
import { UIActionDescriptor } from './use-redirect-msg';
import { useReplyAllMsg } from './use-reply-all-msg';
import { useReplyMsgDescriptor } from './use-reply-msg';
import { useSetMsgReadDescriptor } from './use-set-msg-read';
import { useSetMsgUnreadDescriptor } from './use-set-msg-unread';

export type MessageActionsType = {
	messageId: string;
	folderId: string;
};

export const useMsgActions = ({
	messageId,
	folderId
}: MessageActionsType): Record<string, UIActionDescriptor> => {
	const replyDescriptor = useReplyMsgDescriptor(messageId, folderId);
	const replyAllDescriptor = useReplyAllMsg();
	const forwardDescriptor = useForwardMsgDescriptor();
	const moveToTrashDescriptor = useMoveToTrashDescriptor();
	const deletePermanentlyDescriptor = useDeleteMsgPermanentlyDescriptor({ messageId, deselectAll });
	const messageReadDescriptor = useSetMsgReadDescriptor();
	const messageUnreadDescriptor = useSetMsgUnreadDescriptor();
	const flagDescriptor = useMsgFlagDescriptor();
	const unflagDescriptor = useMsgUnflagDescriptor();
	const sendDraftDescriptor = usesendDraftDescriptor();
	const markAsSpamDescriptor = useMarkAsSpamDescriptor();
	const markAsNotSpamDescriptor = useMarkAsNotSpamDescriptor();
	const applyTagDescriptor = useApplyTagDescriptor();
	const moveToFolderDescriptor = useMoveToFolderDescriptor;
	const createAppointmentDescriptor = useCreateAppointmentDescriptor();
	const printDescriptor = usePrintDescriptor();
	const previewOnSeparatedWindowDescriptor = usePreviewOnSeparatedWindowDescriptor();
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
