/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act } from '@testing-library/react';

import { setupTest, screen } from '../../../../../carbonio-ui-commons/test/test-setup';
import { updateConversationsOnly, updateMessages } from '../../../../../store/zustand/emails/store';
import { generateConversation } from '../../../../../tests/generators/generateConversation';
import { generateMessage } from '../../../../../tests/generators/generateMessage';
import { generateStore } from '../../../../../tests/generators/store';
import { ConversationPreviewPanel } from '../../conversation-preview-panel';

/**
 * Test the Conversation Preview Panel component in different scenarios
 */
describe('Conversation Preview Panel', () => {
	it('renders the Conversation Preview Panel component and every conversation message', async () => {
		const message1 = generateMessage({ id: '1' });
		const message2 = generateMessage({ id: '2' });
		const messages = [message1, message2];

		updateMessages(messages);
		const conversation = generateConversation({
			id: '123',
			messages
		});
		updateConversationsOnly([conversation]);
		const store = generateStore();
		setupTest(
			<ConversationPreviewPanel conversation={conversation} isInsideExtraWindow={false} />,
			{
				store
			}
		);

		await act(async () => {
			expect(screen.getByTestId('ConversationMessagePreview-1')).toBeInTheDocument();
		});
		await act(async () => {
			expect(screen.getByTestId('ConversationMessagePreview-2')).toBeInTheDocument();
		});
	});
});
