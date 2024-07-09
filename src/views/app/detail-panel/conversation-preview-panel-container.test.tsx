/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen } from '@testing-library/react';
import { useParams, useRouteMatch } from 'react-router-dom';

import { ConversationPreviewPanelContainer } from './conversation-preview-panel-container';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS } from '../../../constants';
import * as getConv from '../../../store/actions/get-conv';
import { useSearchStore } from '../../../store/zustand/search/store';
import { generateStore } from '../../../tests/generators/store';
import { MailsStateType } from '../../../types';

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useParams: jest.fn(),
	useRouteMatch: jest.fn()
}));

describe('Conversation Preview Panel', () => {
	describe('when route is "search"', () => {
		it('should display the conversation from searches slice', async () => {
			const conversationSubject = 'Test conversation';
			const conversation = {
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
			};

			useSearchStore.setState({
				conversations: { [conversation.id]: conversation },
				status: API_REQUEST_STATUS.fulfilled
			});

			(useParams as jest.Mock).mockReturnValue({ folderId: '2', conversationId: '1' });
			(useRouteMatch as jest.Mock).mockReturnValue({ path: 'search' });

			setupTest(<ConversationPreviewPanelContainer />, { store: generateStore({}) });
			expect(await screen.findByText(conversationSubject)).toBeVisible();
		});

		it('should not call searchConv API when status is fulfilled', async () => {
			const conversationSubject = 'Test conversation';
			const conversation = {
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
			};

			useSearchStore.setState({
				conversations: { [conversation.id]: conversation },
				status: API_REQUEST_STATUS.fulfilled
			});

			(useParams as jest.Mock).mockReturnValue({ folderId: '2', conversationId: '1' });
			(useRouteMatch as jest.Mock).mockReturnValue({ path: 'search' });

			const getConvAPI = jest.spyOn(getConv, 'getConv');
			setupTest(<ConversationPreviewPanelContainer />, { store: generateStore({}) });
			act(() => {
				jest.advanceTimersByTime(10_000);
			});
			expect(getConvAPI).not.toHaveBeenCalled();
		});
	});

	describe('when route is "mails"', () => {
		it('should display the conversation from conversations slice', async () => {
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

			(useRouteMatch as jest.Mock).mockReturnValue({ path: 'mails' });
			setupTest(<ConversationPreviewPanelContainer />, { store });
			expect(await screen.findByText(conversationSubject)).toBeVisible();
		});
	});
});
