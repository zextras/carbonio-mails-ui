/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { NormalizedConversation } from '../conversations';
import { IncompleteMessage, MailMessage } from '../messages';
import { SearchRequestStatus } from '../state';

export type PopulatedItemsSliceState = {
	populatedItems: {
		messages: Record<string, MailMessage | IncompleteMessage>;
		conversations: Record<string, NormalizedConversation>;
		conversationsStatus: Record<string, SearchRequestStatus>;
	};
};
