/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { SearchConversationPreviewPanelContainer } from './search-conversation-preview-panel-container';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS } from '../../../constants';
import { NormalizedConversation } from '../../../types';

describe('Conversation Preview', () => {
	it('should render a conversation', () => {
		const normalizedConversation: NormalizedConversation = {
			date: 0,
			flagged: false,
			fragment: '',
			hasAttachment: false,
			id: '',
			messages: [],
			messagesInConversation: 0,
			parent: '',
			participants: [],
			read: false,
			subject: '',
			tags: [],
			urgent: false
		};
		setupTest(
			<SearchConversationPreviewPanelContainer
				useConversationById={() => normalizedConversation}
				useConversationStatus={() => API_REQUEST_STATUS.fulfilled}
			></SearchConversationPreviewPanelContainer>,
			{}
		);
	});
});
