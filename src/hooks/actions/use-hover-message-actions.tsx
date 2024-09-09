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

export const useHoverMessageActions = (): Array<UIActionDescriptor<never, never>> => {
	const replyDescriptor = useReplyMsgDescriptor();
	const replyAllDescriptor = useReplyAllMsg();
	const forwardDescriptor = useForwardMsgDescriptor();
	const moveToTrashDescriptor = useMoveToTrashDescriptor();
	const deletePermanentlyDescriptor = useDeleteMsgPermanentlyDescriptor();
	const messageReadDescriptor = useSetMsgReadDescriptor();
	const messageUnreadDescriptor = useSetMsgUnreadDescriptor();
	const flagDescriptor = useMsgFlagDescriptor();
	const unflagDescriptor = useMsgUnflagDescriptor();

	return useMemo(
		() => [
			replyDescriptor,
			replyAllDescriptor,
			forwardDescriptor,
			moveToTrashDescriptor,
			deletePermanentlyDescriptor,
			messageReadDescriptor,
			messageUnreadDescriptor,
			flagDescriptor,
			unflagDescriptor
		],
		[
			deletePermanentlyDescriptor,
			flagDescriptor,
			forwardDescriptor,
			messageReadDescriptor,
			messageUnreadDescriptor,
			moveToTrashDescriptor,
			replyAllDescriptor,
			replyDescriptor,
			unflagDescriptor
		]
	);
};
