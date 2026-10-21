/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen } from '@testing-library/react';
import { Route, Routes, useParams } from 'react-router-dom';

import { SearchConversationPanel } from '../search-conversation-panel';
import { setupTest } from '@test-setup';
import { generateConversation } from '__test__/generators/generateConversation';
import {
	handleNotifyDeleted,
	setSearchResultsByConversation,
	updateConversationStatus,
	updateConversations
} from 'store/emails/store';
import { SearchListPanelRouteParams } from 'types/routes';

const ActiveListItemProbe = (): React.JSX.Element => {
	const { itemId } = useParams<SearchListPanelRouteParams>();
	return <div data-testid={`active-item-${itemId}`} />;
};

// mirrors the search view: list and panel are rendered by two sibling Routes
const SearchViewRoutes = (): React.JSX.Element => (
	<>
		<Routes>
			<Route path=":type?/:itemId?" element={<ActiveListItemProbe />} />
		</Routes>
		<Routes>
			<Route path="conversation/:conversationId" element={<SearchConversationPanel />} />
		</Routes>
	</>
);

function renderSearchViewWithSingleMessageConversation(): void {
	setSearchResultsByConversation([generateConversation({ id: '-5', messageIds: ['5'] })], false);
	updateConversationStatus('-5', 'error');

	setupTest(<SearchViewRoutes />, {
		initialEntries: ['/search/mails/conversation/-5'],
		path: '/search/mails/*'
	});
}

describe('SearchConversationPanel', () => {
	it('should keep the list item active when a single message conversation is replaced', async () => {
		renderSearchViewWithSingleMessageConversation();
		expect(screen.getByTestId('active-item--5')).toBeVisible();

		await act(async () => {
			updateConversations([generateConversation({ id: '500', messageIds: ['5', '501'] })]);
			handleNotifyDeleted(['-5']);
		});

		expect(await screen.findByTestId('active-item-500')).toBeVisible();
		expect(screen.getByTestId('SearchConversationPanel-500')).toBeInTheDocument();
	});

	it('should close the panel when the conversation is deleted without replacement', async () => {
		renderSearchViewWithSingleMessageConversation();

		await act(async () => {
			handleNotifyDeleted(['-5']);
		});

		expect(screen.queryByTestId('active-item--5')).not.toBeInTheDocument();
		expect(screen.queryByTestId(/SearchConversationPanel/)).not.toBeInTheDocument();
	});
});
