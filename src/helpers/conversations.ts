/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { Folder } from '@zextras/carbonio-ui-commons';

import { NormalizedConversation } from 'types/conversations';
import { IncompleteMessage, MailMessage } from 'types/messages';

/**
 * Returns the value of the `parent` field of the messages contained in the given folder.
 * Messages in a mounted shared folder reference the original folder as `<zid>:<rid>`.
 */
export const getMessagesParentForFolder = (folder: Folder): string =>
	'rid' in folder && folder.rid ? `${folder.zid}:${folder.rid}` : folder.id;

/**
 * Returns the date of the conversation as seen in a folder, i.e. the date of its newest message
 * in that folder. This is the date the server uses to sort the conversations of a folder, while
 * the conversation date also includes messages in other folders (e.g. drafts and sent replies).
 * Falls back to the conversation date when none of its messages is known to be in the folder.
 */
export const getConversationDateInFolder = (
	conversation: Pick<NormalizedConversation, 'date'>,
	conversationMessages: Array<Pick<IncompleteMessage | MailMessage, 'parent' | 'date'> | undefined>,
	messagesParent: string
): number => {
	const datesInFolder = conversationMessages
		.filter((message) => message?.parent === messagesParent)
		.map((message) => message?.date ?? 0);
	return datesInFolder.length > 0 ? Math.max(...datesInFolder) : conversation.date;
};
