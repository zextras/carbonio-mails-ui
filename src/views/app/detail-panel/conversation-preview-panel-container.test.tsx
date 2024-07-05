/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';
import { useParams } from 'react-router-dom';

import { ConversationPreviewPanelContainer } from './conversation-preview-panel-container';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS } from '../../../constants';
import { generateStore } from '../../../tests/generators/store';
import { MailsStateType } from '../../../types';

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useParams: jest.fn()
}));

describe('Conversation Preview Panel', () => {
	it.skip('should display the conversation in searches', async () => {
		const conversationSubject = 'Test conversation';
		const initialState: Partial<MailsStateType> = {
			messages: {
				messages: { 100: {} },
				searchRequestStatus: API_REQUEST_STATUS.fulfilled,
				searchedInFolder: {}
			},
			conversations: {
				conversations: {},
				currentFolder: '2',
				expandedStatus: {
					'1': API_REQUEST_STATUS.fulfilled
				},
				searchRequestStatus: API_REQUEST_STATUS.fulfilled,
				searchedInFolder: {}
			},
			searches: {
				searchResults: undefined,
				searchResultsIds: [],
				messages: {
					messages: { 100: {} },
					searchRequestStatus: API_REQUEST_STATUS.fulfilled,
					searchedInFolder: {}
				},
				conversations: {
					1: {
						id: '1',
						date: 0,
						messages: [
							{
								id: '100',
								parent: '1',
								date: 0
							}
						],
						participants: [],
						subject: conversationSubject,
						fragment: '',
						read: false,
						hasAttachment: false,
						flagged: false,
						urgent: false,
						tags: [],
						parent: '2',
						messagesInConversation: 0,
						sortIndex: 0
					}
				},
				more: false,
				offset: 0,
				status: API_REQUEST_STATUS.fulfilled
			}
		};
		const store = generateStore(initialState);
		// ${path}/folder/:folderId/conversation/:conversationId
		(useParams as jest.Mock).mockReturnValue({ folderId: '2', conversationId: '1' });

		setupTest(<ConversationPreviewPanelContainer />, { store });
		expect(await screen.findByText(conversationSubject)).toBeVisible();
	});

	it('should display the conversation in conversations slice', async () => {
		const conversationSubject = 'Test conversation';
		const initialState: Partial<MailsStateType> = {
			messages: {
				messages: { 100: {} },
				searchRequestStatus: API_REQUEST_STATUS.fulfilled,
				searchedInFolder: {}
			},
			conversations: {
				conversations: {
					'1': {
						id: '1',
						date: 0,
						messages: [
							{
								id: '100',
								parent: '1',
								date: 0
							}
						],
						participants: [],
						subject: conversationSubject,
						fragment: '',
						read: false,
						hasAttachment: false,
						flagged: false,
						urgent: false,
						tags: [],
						parent: '2',
						messagesInConversation: 0,
						sortIndex: 0
					}
				},
				currentFolder: '2',
				expandedStatus: {
					'1': API_REQUEST_STATUS.fulfilled
				},
				searchRequestStatus: API_REQUEST_STATUS.fulfilled,
				searchedInFolder: {}
			}
		};
		const store = generateStore(initialState);
		(useParams as jest.Mock).mockReturnValue({ folderId: '2', conversationId: '1' });

		setupTest(<ConversationPreviewPanelContainer />, { store });
		expect(await screen.findByText(conversationSubject)).toBeVisible();
	});
});
