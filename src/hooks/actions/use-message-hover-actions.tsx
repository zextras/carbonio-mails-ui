/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import { MessageActionsArgumentType, useMsgActions } from './use-msg-actions';
import { UIActionDescriptor } from '../../types';

export const useMessageHoverActions = (
	params: MessageActionsArgumentType
): Array<UIActionDescriptor> => {
	const {
		replyDescriptor,
		replyAllDescriptor,
		forwardDescriptor,
		moveToTrashDescriptor,
		deletePermanentlyDescriptor,
		messageReadDescriptor,
		messageUnreadDescriptor,
		flagDescriptor,
		unflagDescriptor
	} = useMsgActions(params);

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
