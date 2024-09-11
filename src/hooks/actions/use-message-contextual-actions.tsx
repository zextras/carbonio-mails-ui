/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import { MessageActionsType, useMsgActions } from './use-msg-actions';
import { UIActionDescriptor } from './use-redirect-msg';

/*
		replyAction,
		replyAllAction,
		forwardAction,
		sendDraftAction,
		moveToTrashAction,
		deletePermanentlyAction,
		msgReadUnreadAction,
		addRemoveFlagAction,
		markRemoveSpam,
		applyTagAction,
		moveToFolderAction,
		createAppointmentAction,
		printAction,
		previewOnSeparatedWindow,
		redirectAction,
		editDraftAction,
		editAsNewAction,
		showOriginalAction,
		downloadEmlAction
* */

export const useMessageContextualActions = (
	params: MessageActionsType
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
