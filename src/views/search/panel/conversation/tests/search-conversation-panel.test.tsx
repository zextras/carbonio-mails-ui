/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen, within } from '@testing-library/react';
import { useTagStore } from '@zextras/carbonio-ui-commons';
import { Route, Routes, useParams } from 'react-router-dom';

import { SearchConversationPanel } from '../search-conversation-panel';
import { setupTest } from '@test-setup';
import {
	generateConversation,
	populateConversationInEmailStore
} from '__test__/generators/generateConversation';
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

	it('shows under the subject the tags of all the messages of the conversation', async () => {
		useTagStore.setState({
			tags: {
				t1: { id: 't1', name: 'Client', color: 1 },
				t2: { id: 't2', name: 'Urgent', color: 2 }
			}
		});
		await act(async () => {
			populateConversationInEmailStore({
				conversationParams: { id: '20', tags: ['t1', 't2'] },
				messageGeneratorParams: [
					{ id: '21', tags: ['t2'] },
					{ id: '22', tags: ['t1'] }
				]
			});
			updateConversationStatus('20', 'fulfilled');
		});
		setupTest(<SearchViewRoutes />, {
			initialEntries: ['/search/mails/conversation/20'],
			path: '/search/mails/*'
		});

		const header = screen.getByTestId('PreviewPanelHeader');
		const tags = await within(header).findByTestId('reading-pane-tags');
		expect(tags).toHaveTextContent('Client');
		expect(tags).toHaveTextContent('Urgent');
	});
});
