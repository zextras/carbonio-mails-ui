/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { UIActionDescriptor } from './use-redirect-msg';
import { useReplyConvDescriptor } from './use-reply-conv';
import { getParentFolderId } from '../../helpers/folders';

export type HoverMessageActionsType = {
	firstMessageId: string;
	firstMessageParent: string;
	messagesLength: number;
};

export const useHoverConversationActions = ({
	firstMessageId,
	firstMessageParent,
	messagesLength
}: HoverMessageActionsType): Array<UIActionDescriptor> => {
	const folderId = getParentFolderId(firstMessageParent);
	const replyDescriptor = useReplyConvDescriptor({ firstMessageId, folderId, messagesLength });

	return useMemo(() => [replyDescriptor], [replyDescriptor]);
};
