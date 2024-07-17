/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { NormalizedConversation } from '../conversations';
import { IncompleteMessage, MailMessage } from '../messages';

export type MessagesSliceState = {
	populatedItems: {
		messages: Record<string, MailMessage | IncompleteMessage>;
		conversations: Record<string, NormalizedConversation>;
		setConversations: (conversations: Record<string, NormalizedConversation>) => void;
		// setMessages: (conversations: Record<string, NormalizedConversation>) => void;
	};
};
