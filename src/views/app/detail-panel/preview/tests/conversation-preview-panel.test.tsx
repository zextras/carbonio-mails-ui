/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { waitFor } from '@testing-library/react';

import { createSoapAPIInterceptor } from '../../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupTest, screen } from '../../../../../carbonio-ui-commons/test/test-setup';
import { updateConversationsOnly } from '../../../../../store/zustand/emails/store';
import { generateConvMessageFromAPI } from '../../../../../tests/generators/api';
import { generateConversation } from '../../../../../tests/generators/generateConversation';
import { generateStore } from '../../../../../tests/generators/store';
import { SearchConvRequest, SearchConvResponse } from '../../../../../types';
import { ConversationPreviewPanel } from '../../conversation-preview-panel';

/**
 * Test the Conversation Preview Panel component in different scenarios
 */
describe('Conversation Preview Panel', () => {
	it('renders the Conversation Preview Panel component and every conversation message', async () => {
		const conversation = generateConversation({ id: '123' });
		updateConversationsOnly([conversation]);
		const message1 = generateConvMessageFromAPI({ id: '1', cid: '123' });
		const message2 = generateConvMessageFromAPI({ id: '2', cid: '123' });
		const searchResponse = {
			m: [message1, message2],
			more: false,
			offset: '0',
			orderBy: 'any'
		} as SearchConvResponse;

		createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>('SearchConv', searchResponse);

		const store = generateStore();
		setupTest(<ConversationPreviewPanel conversationId={'123'} isInsideExtraWindow={false} />, {
			store
		});

		await waitFor(() => {
			expect(screen.getByTestId('ConversationMessagePreview-1')).toBeInTheDocument();
		});
		await waitFor(() => {
			expect(screen.getByTestId('ConversationMessagePreview-2')).toBeInTheDocument();
		});
	});
});
