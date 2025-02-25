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

/*
 When replying to a single message conversation we see that:
 - the conversation id changes from negative to positive
 - the negative conversation id is deleted
 - a draft message is created, associated to the new conversation id
 - the original message changes to the new conversation id
*/
function simulateReplyToSingleMessageConversation({
	newConversationId,
	originalMessageId,
	newMessageId
}: {
	newConversationId: string;
	originalMessageId: string;
	newMessageId: string;
}) {
	const realLifeNotifyResponse = {
		seq: 6,
		deleted: ['-3'],
		created: {
			m: [
				{
					s: 1427,
					d: 1740495650000,
					l: FOLDERS.DRAFTS,
					cid: newConversationId,
					f: 'sd',
					rev: 57246,
					id: newMessageId,
					e: [
						{
							a: 'zextras@demo.zextras.io',
							d: 'zextras',
							p: 'zextras',
							t: 't'
						},
						{
							a: 'zextras@demo.zextras.io',
							d: 'Carbonio',
							p: 'Carbonio Admin',
							t: 'f'
						}
					],
					su: 'RE: Email with 1 attachments',
					fr: '-- From: "undefined" <zextras@demo.zextras.io> To: "undefined" <zextras@demo.zextras.io> Sent: Wednesday, December 11, 2024 2:58 PM Subject: Email ...'
				}
			],
			c: [
				{
					id: newConversationId,
					u: 0,
					n: 2,
					f: 'sad',
					d: 1740495650000,
					su: 'Email with 1 attachments',
					e: [
						{
							a: 'zextras@demo.zextras.io',
							d: 'Carbonio',
							p: 'Carbonio Admin',
							t: 'f'
						}
					]
				}
			]
		},
		modified: {
			m: [
				{
					cid: newConversationId,
					id: originalMessageId
				}
			],
			mbx: [
				{
					s: 1068264279
				}
			] as [{ s: number }],
			folder: [
				{
					id: FOLDERS.DRAFTS,
					uuid: 'f7346160-c02c-408b-aa18-bd3efe05b804',
					deletable: false,
					n: 58,
					s: 4374,
					i4ms: 57247,
					i4next: 7993
				},
				{
					id: FOLDERS.INBOX,
					uuid: '418437ae-5bc6-43e4-b865-bbf4d48c157c',
					deletable: true,
					n: 4,
					s: 7312,
					i4ms: 57246,
					i4next: 7992
				}
			]
		}
	};
	mockShellSoapNotify(realLifeNotifyResponse);
}

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
