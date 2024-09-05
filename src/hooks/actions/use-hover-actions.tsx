/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { UIActionDescriptor } from './use-redirect-msg-descriptor';
import { useReplyMsgDescriptor } from './use-reply-msg-descriptor';

export const useHoverMessageActions = (id: string): Array<UIActionDescriptor<never, never>> => {
	const replyDescriptor = useReplyMsgDescriptor(id);
	return [
		replyDescriptor
		/*		replyAllDescriptor,
		forwardDescriptor,
		moveToTrashdescriptor,
		deletePermanentlyDescriptor,
		messageReadDescriptor,
		messageUnreadDescriptor,
		flagDescriptor,
		unflagDescriptor */
	];
};
