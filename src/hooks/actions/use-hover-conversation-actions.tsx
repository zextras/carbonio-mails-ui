/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { getParentFolderId } from '../../helpers/folders';
import { UIActionDescriptor } from '../../types';
import { useConvReplyDescriptor } from './use-conv-reply';

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
	const replyDescriptor = useConvReplyDescriptor({ firstMessageId, folderId, messagesLength });

	return useMemo(() => [replyDescriptor], [replyDescriptor]);
};
