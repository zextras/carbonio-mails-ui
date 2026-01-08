/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { waitFor } from '@testing-library/react';

import { generateConversation } from '../../../../../__test__/generators/generateConversation';
import { generateMessage } from '../../../../../__test__/generators/generateMessage';
import { updateConversations, updateMessages } from '../../../../../store/emails/store';
import { ConversationPreviewBody } from '../conversation-preview-body';
import { screen, setupTest } from '@test-setup';

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
			messageIds: messages.map((m) => m.id)
		});
		updateConversations([conversation]);
		setupTest(<ConversationPreviewBody conversation={conversation} />);

		await waitFor(async () => {
			expect(screen.getByTestId('ConversationMessagePreview-1')).toBeInTheDocument();
		});
		await waitFor(async () => {
			expect(screen.getByTestId('ConversationMessagePreview-2')).toBeInTheDocument();
		});
	});
});
