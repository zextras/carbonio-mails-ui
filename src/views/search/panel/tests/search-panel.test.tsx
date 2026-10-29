/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { waitFor } from '@testing-library/react';
import { Link } from 'react-router-dom';

import { setupTest, screen } from '@test-setup';
import { generateMessage } from '__test__/generators/generateMessage';
import { API_REQUEST_STATUS } from 'constants/index';
import { setSearchResultsByMessage, updateMessageStatus } from 'store/emails/store';
import { SearchPanelProps } from 'types/search';
import SearchPanel from 'views/search/panel/search-panel';

const FIRST_MESSAGE_PANEL = 'MessagePanel-1';

const buildSearchResults = (
	messageListIndex: Array<string>
): SearchPanelProps['searchResults'] => ({
	conversationListIndex: [],
	messageListIndex,
	more: false,
	offset: 0,
	status: API_REQUEST_STATUS.fulfilled
});

describe('Search Panel', () => {
	it('should not remount the open message when the search results change', async () => {
		setSearchResultsByMessage(
			[
				generateMessage({
					id: '1',
					isComplete: true,
					subject: 'Test subject',
					body: 'Test Message body'
				})
			],
			false
		);
		await waitFor(() => {
			updateMessageStatus('1', API_REQUEST_STATUS.fulfilled);
		});

		const { rerender } = setupTest(
			<SearchPanel searchResults={buildSearchResults(['1'])} query={[]} />,
			{ initialEntries: ['/message/1'] }
		);
		const messagePanel = await screen.findByTestId(FIRST_MESSAGE_PANEL);

		rerender(<SearchPanel searchResults={buildSearchResults(['2', '1'])} query={[]} />);

		expect(screen.getByTestId(FIRST_MESSAGE_PANEL)).toBe(messagePanel);
	});

	it('should show the new message when another message is opened', async () => {
		setSearchResultsByMessage(
			[
				generateMessage({ id: '1', isComplete: true, subject: 'First subject' }),
				generateMessage({ id: '2', isComplete: true, subject: 'Second subject' })
			],
			false
		);
		await waitFor(() => {
			updateMessageStatus('1', API_REQUEST_STATUS.fulfilled);
			updateMessageStatus('2', API_REQUEST_STATUS.fulfilled);
		});

		const { user } = setupTest(
			<>
				<Link to="/message/2">open second</Link>
				<SearchPanel searchResults={buildSearchResults(['1', '2'])} query={[]} />
			</>,
			{ initialEntries: ['/message/1'] }
		);
		const firstPanel = await screen.findByTestId(FIRST_MESSAGE_PANEL);
		expect(firstPanel).toBeVisible();

		await user.click(screen.getByText('open second'));

		const secondPanel = await screen.findByTestId('MessagePanel-2');
		expect(secondPanel).toBeVisible();
		// a fresh panel, not the first one reused with the other message's data
		expect(secondPanel).not.toBe(firstPanel);
		expect(screen.queryByTestId(FIRST_MESSAGE_PANEL)).not.toBeInTheDocument();
	});
});
