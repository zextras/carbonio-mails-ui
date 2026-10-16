/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, waitFor } from '@testing-library/react';
import { NavigateFunction } from 'react-router-dom';

import { SearchConversationPanel } from '../search-conversation-panel';
import { setupTest } from '@test-setup';
import { generateConversation } from '__test__/generators/generateConversation';
import {
	handleNotifyDeleted,
	setSearchResultsByConversation,
	updateConversationStatus,
	updateConversations
} from 'store/emails/store';

const mockNavigateSpy = vi.fn();

vi.mock('react-router-dom', async () => ({
	...(await vi.importActual('react-router-dom')),
	useNavigate: (): NavigateFunction => mockNavigateSpy
}));

function renderPanelForSingleMessageConversation(): void {
	setSearchResultsByConversation([generateConversation({ id: '-5', messageIds: ['5'] })], false);
	updateConversationStatus('-5', 'error');

	setupTest(<SearchConversationPanel />, {
		initialEntries: ['/conversation/-5'],
		path: '/conversation/:conversationId'
	});
}

describe('SearchConversationPanel', () => {
	it('should follow the new conversation when a single message conversation is replaced', async () => {
		renderPanelForSingleMessageConversation();

		await act(async () => {
			updateConversations([generateConversation({ id: '500', messageIds: ['5', '501'] })]);
			handleNotifyDeleted(['-5']);
		});

		await waitFor(() =>
			expect(mockNavigateSpy).toHaveBeenCalledWith('/search/conversation/500', { replace: true })
		);
	});

	it('should go back to the search when the conversation is deleted without replacement', async () => {
		renderPanelForSingleMessageConversation();

		await act(async () => {
			handleNotifyDeleted(['-5']);
		});

		await waitFor(() => expect(mockNavigateSpy).toHaveBeenCalledWith('/search', { replace: true }));
	});
});
