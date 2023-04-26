/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Conversation } from '../../../../types';

export function getFolderParentId({
	folderId,
	isConversation,
	item
}: {
	folderId: string | undefined;
	isConversation: boolean;
	item: Conversation;
}): string {
	if (folderId) return folderId;
	if (isConversation) return item?.messages?.[0]?.parent;
	return item?.parent;
}
