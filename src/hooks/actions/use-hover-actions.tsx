/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { useForwardMsgDescriptor } from './use-forward-msg-descriptor';
import { useMoveToTrashDescriptor } from './use-move-to-trash-descriptor';
import { UIActionDescriptor } from './use-redirect-msg-descriptor';
import { useReplyAllMsgDescriptor } from './use-reply-all-msg-descriptor';
import { useReplyMsgDescriptor } from './use-reply-msg-descriptor';

export const useHoverMessageActions = (id: string): Array<UIActionDescriptor<never, never>> => {
	const replyDescriptor = useReplyMsgDescriptor(id);
	const replyAllDescriptor = useReplyAllMsgDescriptor(id);
	const forwardDescriptor = useForwardMsgDescriptor(id);
	const moveToTrashDescriptor = useMoveToTrashDescriptor();
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
		[forwardDescriptor, moveToTrashDescriptor, replyAllDescriptor, replyDescriptor]
	);
};
