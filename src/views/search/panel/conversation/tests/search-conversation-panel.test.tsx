/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen, within } from '@testing-library/react';
import { Route, Routes, useParams } from 'react-router-dom';

import { SearchConversationPanel } from '../search-conversation-panel';
import { setupTest } from '@test-setup';
import { generateConversation } from '__test__/generators/generateConversation';
import { generateMessage } from '__test__/generators/generateMessage';
import {
	handleNotifyConversationsCreated,
	handleNotifyDeleted,
	handleNotifyMessagesCreated,
	handleNotifyMessagesModified,
	setSearchResultsByConversation,
	updateConversationStatus,
	updateConversations,
	updateMessages
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

	it('should keep the message being read open, without reloading the panel, when the first reply arrives', async () => {
		updateMessages([generateMessage({ id: '5', cid: '-5', folderId: '2' })]);
		setSearchResultsByConversation(
			[generateConversation({ id: '-5', messageIds: ['5'], receiveDate: Date.now() - 60_000 })],
			false
		);
		updateConversationStatus('-5', 'fulfilled');
		setupTest(<SearchViewRoutes />, {
			initialEntries: ['/search/mails/conversation/-5'],
			path: '/search/mails/*'
		});
		const messageBeingRead = await screen.findByTestId('MailPreview-5');
		expect(within(messageBeingRead).getByTestId('MailMessageRendererCollapse')).toBeVisible();

		// the notification of the first reply: the server replaces the virtual conversation with a new one
		await act(async () => {
			handleNotifyConversationsCreated([
				generateConversation({ id: '500', messageIds: ['5', '501'], receiveDate: Date.now() })
			]);
			handleNotifyMessagesCreated([generateMessage({ id: '501', cid: '500', folderId: '2' })]);
			handleNotifyMessagesModified([{ id: '5', conversation: '500' }]);
			handleNotifyDeleted(['-5']);
		});

		expect(await screen.findByTestId('active-item-500')).toBeVisible();
		expect(await screen.findByTestId('MailPreview-501')).toBeInTheDocument();
		expect(screen.getByTestId('MailPreview-5')).toBe(messageBeingRead);
		expect(within(messageBeingRead).getByTestId('MailMessageRendererCollapse')).toBeVisible();
	});
});
