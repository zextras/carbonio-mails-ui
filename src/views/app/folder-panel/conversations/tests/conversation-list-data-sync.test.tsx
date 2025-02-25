/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';
import { useParams } from 'react-router-dom';

import { FOLDERS } from '../../../../../carbonio-ui-commons/constants/folders';
import { createSoapAPIInterceptor } from '../../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../../../../carbonio-ui-commons/test/mocks/store/folders';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import {
	generateConversationFromAPI,
	generateConvMessageFromAPI
} from '../../../../../tests/generators/api';
import { SearchRequest, SearchResponse } from '../../../../../types';
import { useSyncDataHandler } from '../../../../sidebar/commons/use-sync-data-handler';
import { mockShellSoapNotify } from '../../../../sidebar/tests/test-helpers';
import { ConversationList } from '../conversation-list';

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

const ConversationListDataSyncTest: () => React.JSX.Element = () => {
	useSyncDataHandler();
	return (
		<>
			<ConversationList />
		</>
	);
};

describe('conversation-list-data-sync', () => {
	it('single message conversation should not disappear from the list when replying', async () => {
		(useParams as jest.Mock).mockReturnValue({
			folderId: FOLDERS.INBOX
		});

		populateFoldersStore();

		const message = generateConvMessageFromAPI({ id: '1', cid: '-3', l: FOLDERS.INBOX });
		const conversation = generateConversationFromAPI({ id: '-3', m: [message] });
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversation],
			more: false
		});

		const { rerender } = setupTest(<ConversationListDataSyncTest />);

		const conversationItems = await screen.findAllByTestId('conversation-invisible-item');
		expect(conversationItems.length).toBe(1);
		const conversationListItem = await screen.findByTestId(
			`conversation-list-item-${conversation.id}`
		);
		expect(conversationListItem).toBeVisible();

		const newMessages = generateConvMessageFromAPI({ id: '2', cid: '3', l: FOLDERS.INBOX });
		const newConversation = generateConversationFromAPI({ id: '3', m: [newMessages] });
		mockShellSoapNotify({
			created: {
				m: [newMessages],
				c: [newConversation]
			},
			deleted: ['-3']
		});

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => rerender(<ConversationListDataSyncTest />));

		const conversationItemsAfter = await screen.findAllByTestId('conversation-invisible-item');
		expect(conversationItemsAfter.length).toBe(1);

		const conversationListItemAfter = await screen.findByTestId(
			`conversation-list-item-${newConversation.id}`
		);
		expect(conversationListItemAfter).toBeVisible();
	});
});
