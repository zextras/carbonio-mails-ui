/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, within } from '@testing-library/react';
import { useParams } from 'react-router-dom';

import { FOLDERS } from '../../../../../carbonio-ui-commons/constants/folders';
import { createSoapAPIInterceptor } from '../../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../../../../carbonio-ui-commons/test/mocks/store/folders';
import {
	makeListItemsVisible,
	setupTest
} from '../../../../../carbonio-ui-commons/test/test-setup';
import { generateMessageFromAPI } from '../../../../../tests/generators/api';
import { SearchRequest, SearchResponse } from '../../../../../types';
import { useSyncDataHandler } from '../../../../sidebar/commons/use-sync-data-handler';
import { simulateReplyToSingleMessageConversation } from '../../tests/utils';
import { MessageList } from '../message-list';

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useParams: jest.fn()
}));

jest.mock('../../../../../carbonio-ui-commons/worker', () => ({
	...jest.requireActual('../../../../../carbonio-ui-commons/worker'),
	folderWorker: {
		postMessage: jest.fn()
	},
	tagsWorker: {
		postMessage: jest.fn()
	}
}));

const MessageListDataSyncTest: () => React.JSX.Element = () => {
	useSyncDataHandler();
	return (
		<>
			<MessageList />
		</>
	);
};

describe('message-list data-sync', () => {
	it('should not remove participants names from message that is being replied', async () => {
		(useParams as jest.Mock).mockReturnValue({
			folderId: FOLDERS.INBOX
		});
		populateFoldersStore();

		const originalMessage = generateMessageFromAPI({
			id: '1',
			cid: '-3',
			l: FOLDERS.INBOX,
			e: [
				{
					a: 'myguy@test.com',
					t: 'f',
					p: ''
				}
			]
		});
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			m: [originalMessage],
			more: false
		});

		const { rerender } = setupTest(<MessageListDataSyncTest />);
		const messageItems = await screen.findAllByTestId('invisible-item');
		expect(messageItems.length).toBe(1);
		const messageListItem = await screen.findByTestId(`message-item-${originalMessage.id}`);
		expect(messageListItem).toBeVisible();

		makeListItemsVisible();

		const participantsNameLabelBefore =
			within(messageListItem).getByTestId('participants-name-label');

		expect(participantsNameLabelBefore).toBeVisible();
		expect(participantsNameLabelBefore).toHaveTextContent('myguy@test.com');

		// simulate reply To
		const newConversationId = '2000';
		const newMessageId = '101';
		simulateReplyToSingleMessageConversation({
			deletedConversationId: '-3',
			newConversationId,
			newMessageId,
			originalMessageId: originalMessage.id
		});

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => rerender(<MessageListDataSyncTest />));

		const messageListItemAfter = await screen.findByTestId(`message-item-${originalMessage.id}`);
		expect(messageListItemAfter).toBeVisible();

		makeListItemsVisible();

		const participantsNameLabel =
			within(messageListItemAfter).getByTestId('participants-name-label');

		expect(participantsNameLabel).toBeVisible();
		expect(participantsNameLabel).toHaveTextContent('myguy@test.com');
	});
});
