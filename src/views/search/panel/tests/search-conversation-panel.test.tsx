/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { NormalizedConversation } from '../../../../types';
import { SearchConversationPanel } from '../search-conversation-panel';

describe('Conversation Preview', () => {
	it.skip('should render a conversation', () => {
		const normalizedConversation: NormalizedConversation = {
			date: 0,
			flagged: false,
			fragment: '',
			hasAttachment: false,
			id: '123',
			messages: [],
			messagesInConversation: 0,
			parent: '',
			participants: [],
			read: false,
			subject: '',
			tags: [],
			urgent: false
		};
		setupTest(<SearchConversationPanel conversationId="123" folderId="2" />, {});
	});
});
