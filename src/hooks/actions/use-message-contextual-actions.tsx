/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';
import { UIActionDescriptor } from '../../types';
import { MessageActionsType, useMsgActions } from './use-msg-actions';

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
		sendDraftDescriptor,
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
			sendDraftDescriptor,
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
			sendDraftDescriptor,
			messageReadDescriptor,
			messageUnreadDescriptor,
			moveToTrashDescriptor,
			replyAllDescriptor,
			replyDescriptor,
			unflagDescriptor
		]
	);
};
