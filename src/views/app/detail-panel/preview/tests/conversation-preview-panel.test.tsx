/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import * as shell from '../../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { setupTest, screen } from '../../../../../carbonio-ui-commons/test/test-setup';
import { getConv } from '../../../../../store/actions';
import { generateStore } from '../../../../../tests/generators/store';
import { ConversationPreviewPanel } from '../../conversation-preview-panel';

/**
 * Test the Conversation Preview Panel component in different scenarios
 */
describe('Conversation Preview Panel', () => {
	it('renders the Conversation Preview Panel component and every conversation message', async () => {
		const conversationId = '1';
		const store = generateStore();
		await store.dispatch<any>(getConv({ conversationId }));
		const state = store.getState();
		const conversation = state.conversations.conversations[conversationId];

		// Render the component
		setupTest(
			<ConversationPreviewPanel conversation={conversation} isInsideExtraWindow={false} />,
			{ store }
		);
		conversation.messages.forEach((message) => {
			const mailPreviewDataTestId = `ConversationMessagePreview-${message.id}`;
			expect(screen.getByTestId(mailPreviewDataTestId)).toBeInTheDocument();
		});
	});
	it('renders the first message at the top if the convSortOrder is set from oldToNew (dateDesc)', async () => {
		const conversationId = '1';
		const store = generateStore();
		await store.dispatch<any>(getConv({ conversationId }));
		const state = store.getState();
		const conversation = state.conversations.conversations[conversationId];
		// Render the component
		setupTest(
			<ConversationPreviewPanel conversation={conversation} isInsideExtraWindow={false} />,
			{ store }
		);
		const renderedMessages = screen.getAllByTestId(`ConversationMessagePreview`, {
			exact: false
		});

		const renderedMessagesIds = renderedMessages.map(
			(message) => message.dataset.testid?.split('-')[1]
		);

		const messagesSortedFromOldToNew = conversation.messages
			.slice()
			.sort((a, b) => -(a.date - b.date));

		const messagesIdsSortedFromOldToNew = messagesSortedFromOldToNew.map((message) =>
			message.id.toString()
		);

		expect(renderedMessagesIds).toEqual(messagesIdsSortedFromOldToNew);
	});
	it('renders the last message at the top if the convSortOrder is set from newToOld (dateAsc)', async () => {
		const conversationId = '1';
		const store = generateStore();
		await store.dispatch<any>(getConv({ conversationId }));
		const state = store.getState();
		const conversation = state.conversations.conversations[conversationId];
		shell.useUserSettings.mockReturnValue({
			...shell.useUserSettings(),
			prefs: { ...shell.useUserSettings().prefs, zimbraPrefConversationOrder: 'dateAsc' }
		});
		// Render the component
		setupTest(
			<ConversationPreviewPanel conversation={conversation} isInsideExtraWindow={false} />,
			{ store }
		);
		const renderedMessages = screen.getAllByTestId(`ConversationMessagePreview`, {
			exact: false
		});

		const renderedMessagesIds = renderedMessages.map(
			(message) => message.dataset.testid?.split('-')[1]
		);

		const messagesSortedFromOldToNew = conversation.messages
			.slice()
			.sort((a, b) => a.date - b.date);

		const messagesIdsSortedFromOldToNew = messagesSortedFromOldToNew.map((message) =>
			message.id.toString()
		);

		expect(renderedMessagesIds).toEqual(messagesIdsSortedFromOldToNew);
	});
});
