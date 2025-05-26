/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';
import { useParams } from 'react-router-dom';

import {
	createSoapAPIInterceptor,
	FOLDERS,
	populateFoldersStore,
	setupTest
} from '@zextras/carbonio-ui-commons';
import {
	generateConversationFromAPI,
	generateConvMessageFromAPI
} from '../../../../../tests/generators/api';
import { SearchRequest, SearchResponse } from '../../../../../types';
import { useSyncDataHandler } from '../../../../sidebar/commons/use-sync-data-handler';
import { simulateReplyToSingleMessageConversation } from '../../tests/utils';
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
		const originalMessage = generateConvMessageFromAPI({ id: '1', cid: '-3', l: FOLDERS.INBOX });
		const singleMessageConversation = generateConversationFromAPI({
			id: '-3',
			m: [originalMessage]
		});
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [singleMessageConversation],
			more: false
		});

		const { rerender } = setupTest(<ConversationListDataSyncTest />);
		const conversationItems = await screen.findAllByTestId('conversation-invisible-item');
		expect(conversationItems.length).toBe(1);
		const conversationListItem = await screen.findByTestId(
			`conversation-list-item-${singleMessageConversation.id}`
		);
		expect(conversationListItem).toBeVisible();

		// simulate reply To
		const newConversationId = '2000';
		const newMessageId = '101';
		simulateReplyToSingleMessageConversation({
			deletedConversationId: singleMessageConversation.id,
			newConversationId,
			newMessageId,
			originalMessageId: originalMessage.id
		});

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => rerender(<ConversationListDataSyncTest />));

		const conversationItemsAfter = await screen.findAllByTestId('conversation-invisible-item');
		expect(conversationItemsAfter.length).toBe(1);

		const conversationListItemAfter = await screen.findByTestId(
			`conversation-list-item-${newConversationId}`
		);
		expect(conversationListItemAfter).toBeVisible();
	});
});
