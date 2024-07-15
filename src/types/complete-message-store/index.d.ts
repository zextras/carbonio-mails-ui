/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Conversation } from '../conversations';
import { IncompleteMessage, MailMessage } from '../messages';

export type MessagesSliceState = {
	messages: {
		messages: Record<string, MailMessage | IncompleteMessage>;
		conversations: Record<string, Conversation>;
		setConversations: (conversations: Record<string, Conversation>) => void;
	};
};
