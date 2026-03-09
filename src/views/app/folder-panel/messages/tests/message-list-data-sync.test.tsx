/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, within } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { useParams } from 'react-router-dom';
import type { Mock } from 'vitest';

import { makeListItemsVisible, setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateFoldersStore } from '@test-utils/store/folders';
import { generateMessageFromAPI } from '__test__/generators/api';
import { SearchRequest, SearchResponse } from 'types/soap/search';
import { MessageList } from 'views/app/folder-panel/messages/message-list';
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
		(useParams as Mock).mockReturnValue({
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
