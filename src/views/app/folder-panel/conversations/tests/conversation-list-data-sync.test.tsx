/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { useParams } from 'react-router-dom';
import type { Mock } from 'vitest';

import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateFoldersStore } from '@test-utils/store/folders';
import { generateConversationFromAPI, generateConvMessageFromAPI } from '__test__/generators/api';
import { SearchRequest, SearchResponse } from 'types/soap/search';
import { ConversationList } from 'views/app/folder-panel/conversations/conversation-list';
import { simulateReplyToSingleMessageConversation } from 'views/app/folder-panel/tests/utils';
import { useSyncDataHandler } from 'views/sidebar/commons/use-sync-data-handler';

vi.mock('react-router-dom', async () => ({
	...(await vi.importActual('react-router-dom')),
	useParams: vi.fn()
}));

vi.mock('@zextras/carbonio-ui-commons', async () => ({
	...(await vi.importActual('@zextras/carbonio-ui-commons')),
	folderWorker: {
		postMessage: vi.fn()
	},
	tagsWorker: {
		postMessage: vi.fn()
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
		(useParams as Mock).mockReturnValue({
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
