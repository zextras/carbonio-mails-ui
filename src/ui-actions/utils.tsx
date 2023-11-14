/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find } from 'lodash';

import type { Conversation, MailMessage, MessageAction } from '../types';

type GetFolderParentIdProps = {
	folderId: string;
	isConversation: boolean;
	items: Array<Partial<MailMessage> & Pick<MailMessage, 'id'>> | Array<Conversation>;
};

// FIXME the function name and the parameters are misleading
// FIXME this function implementation is strictly linked to the
//  search list and multiple selection list. Should be moved
//  closer to them
export function getFolderParentId({
	folderId,
	isConversation,
	items
}: GetFolderParentIdProps): string {
	if (folderId) return folderId;
	if (isConversation) return (items as Conversation[])?.[0]?.messages?.[0]?.parent;
	return (items as MailMessage[])?.[0]?.parent;
}

/**
 *
 * @param actions
 * @param id
 */
export const findMessageActionById = (
	actions: Array<MessageAction>,
	id: string
): MessageAction | undefined => {
	if (!actions || !actions.length) {
		return undefined;
	}

	return find(actions, ['id', id]);
};
