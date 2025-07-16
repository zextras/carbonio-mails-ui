/* eslint-disable testing-library/prefer-user-event */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { useParams } from 'react-router-dom';

import { within, setupTest, triggerLoadMore } from '@test-setup';
import { generateFolder } from '@test-utils/folders/folders-generator';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateFoldersStore } from '@test-utils/store/folders';
import { updateConversationsResultsLoadingStatus } from 'store/emails/store';
import { TESTID_SELECTORS } from 'tests/constants';
import { generateConversationFromAPI, generateConvMessageFromAPI } from 'tests/generators/api';
import { ConvActionRequest, SearchRequest, SearchResponse } from 'types/index.d';
import { ConversationList } from 'views/app/folder-panel/conversations/conversation-list';
import { makeAllItemsVisible } from 'views/settings/filters/tests/test-utils';

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useParams: jest.fn()
}));

function fakeCounter(): { count: number; setCount: (value: number) => void } {
	let count = 0;
	const setCount = (value: number): void => {
		count = value;
	};
	return { count, setCount };
}

describe('ConversationList Component', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		const folderId = '2';
		(useParams as jest.Mock).mockReturnValue({
			folderId
		});
		populateFoldersStore({
			customFolders: [generateFolder({ id: folderId })]
		});
	});
	it('renders without crashing when there are no conversations', async () => {
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [],
			more: false
		});
		updateConversationsResultsLoadingStatus('fulfilled');

		setupTest(<ConversationList />);

		await act(async () => {
			expect(screen.getByText('displayer.list_folder_title')).toBeInTheDocument();
		});
	});

	it('displays a list of conversations', async () => {
		const message = generateConvMessageFromAPI({ id: '1', l: '2' });
		const conversation1 = generateConversationFromAPI({ id: '-1', m: [message] });
		const conversation2 = generateConversationFromAPI({ id: '-2', m: [message] });
		const conversation3 = generateConversationFromAPI({ id: '-3', m: [message] });
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversation1, conversation2, conversation3],
			more: false
		});

		setupTest(<ConversationList />);

		expect((await screen.findAllByTestId('conversation-invisible-item')).length).toBe(3);
	});

	const conversation1Subject = 'conversation 1 subject';
	it('loads more conversations when reaching bottom of the list', async () => {
		const conversation1 = generateConversationFromAPI({
			id: '1',
			m: [generateConvMessageFromAPI({ id: '1', l: '2', cid: '1' })],
			su: conversation1Subject
		});

		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversation1],
			more: true
		});

		await act(async () => {
			setupTest(<ConversationList />);
		});

		makeAllItemsVisible();

		expect(screen.getByText(/conversation 1 subject/i)).toBeInTheDocument();

		const conversation2 = generateConversationFromAPI({
			id: '2',
			m: [generateConvMessageFromAPI({ id: '2', l: '2', cid: '2' })],
			su: 'conversation 2 subject'
		});

		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversation2],
			more: false
		});

		await act(async () => {
			triggerLoadMore();
		});

		makeAllItemsVisible();

		expect(screen.getByText(/conversation 1 subject/i)).toBeInTheDocument();
		await waitFor(() => {
			expect(screen.getByText(/conversation 2 subject/i)).toBeInTheDocument();
		});
	});

	it('list-bottom-element should not be in the document when there are no more conversations', async () => {
		const conversation1 = generateConversationFromAPI({
			id: '1',
			m: [generateConvMessageFromAPI({ id: '1', l: '2', cid: '1' })],
			su: conversation1Subject
		});

		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversation1],
			more: false
		});

		await act(async () => {
			setupTest(<ConversationList />);
		});

		makeAllItemsVisible();

		expect(screen.getByText(/conversation 1 subject/i)).toBeInTheDocument();
		expect(screen.queryByTestId('list-bottom-element')).not.toBeInTheDocument();
	});

	it('list-bottom-element should be in the document when there are more conversations', async () => {
		const conversation1 = generateConversationFromAPI({
			id: '1',
			m: [generateConvMessageFromAPI({ id: '1', l: '2', cid: '1' })],
			su: conversation1Subject
		});

		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversation1],
			more: true
		});

		await act(async () => {
			setupTest(<ConversationList />);
		});

		makeAllItemsVisible();

		expect(screen.getByText(/conversation 1 subject/i)).toBeInTheDocument();
		expect(screen.getByTestId('list-bottom-element')).toBeInTheDocument();
	});

	it('should move a conversation to trash when the trash action button is clicked', async () => {
		const convActionInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
		await act(async () => {
			populateFoldersStore();
		});

		const conversation1 = generateConversationFromAPI({
			id: '1',
			m: [generateConvMessageFromAPI({ id: '1', l: '2', cid: '1' })],
			su: conversation1Subject
		});

		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversation1],
			more: true
		});

		const { user } = await act(async () => setupTest(<ConversationList />));

		makeAllItemsVisible();

		const actionWrapper = await screen.findByTestId(`ConversationListItem-1`);
		await act(async () => {
			user.hover(actionWrapper);
		});

		const deleteButton = await screen.findByTestId('icon: Trash2Outline');
		await user.click(deleteButton);
		const convActionRequest = await waitFor(async () => convActionInterceptor);
		expect(convActionRequest.action.op).toBe('trash');
		expect(convActionRequest.action.id).toBe('1');
	});

	it('should delete a conversation when the permanently delete action button is clicked', async () => {
		const convActionInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
		await act(async () => {
			populateFoldersStore();
		});

		const conversation1 = generateConversationFromAPI({
			id: '1',
			m: [generateConvMessageFromAPI({ id: '1', l: FOLDERS.TRASH, cid: '1' })],
			su: conversation1Subject
		});

		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversation1],
			more: true
		});
		(useParams as jest.Mock).mockReturnValue({
			folderId: FOLDERS.TRASH
		});
		const { user } = await act(async () => setupTest(<ConversationList />));

		makeAllItemsVisible();

		const actionWrapper = await screen.findByTestId(`ConversationListItem-1`);
		await act(async () => {
			user.hover(actionWrapper);
		});

		const deleteButton = await screen.findByTestId('icon: DeletePermanentlyOutline');
		await user.click(deleteButton);
		const confirmButton = await screen.findByText('Delete permanently');

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => {
			fireEvent.click(confirmButton);
		});

		const convActionRequest = await convActionInterceptor;
		expect(convActionRequest.action.op).toBe('delete');
		expect(convActionRequest.action.id).toBe('1');
	});

	describe('when in multiple selection mode', () => {
		it('should move a conversation to trash when the trash action button is clicked', async () => {
			const convActionInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
			await act(async () => {
				populateFoldersStore();
			});

			const conversation1 = generateConversationFromAPI({
				id: '1',
				m: [generateConvMessageFromAPI({ id: '1', l: FOLDERS.INBOX, cid: '1' })],
				su: conversation1Subject
			});

			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [conversation1],
				more: true
			});
			(useParams as jest.Mock).mockReturnValue({
				folderId: FOLDERS.INBOX
			});
			const { user } = await act(async () => setupTest(<ConversationList />));

			makeAllItemsVisible();

			expect(screen.getByTestId('conversation-list-item-avatar-1')).toBeInTheDocument();
			await user.click(await screen.findByTestId('select-icon-checkbox'));
			await user.click(screen.getByRole('button', { name: /label\.select_all/i }));

			const multipleSelectionPanel = await screen.findByTestId('MultipleSelectionActionPanel');
			const multipleSelectionTrashButton = await within(multipleSelectionPanel).findByRoleWithIcon(
				'button',
				{
					icon: TESTID_SELECTORS.icons.trash
				}
			);
			await user.click(multipleSelectionTrashButton);
			const request = await waitFor(() => convActionInterceptor);
			expect(request.action.op).toBe('trash');
			expect(request.action.id).toBe('1');
		});
		it('should delete a conversation when the permanently delete action button is clicked', async () => {
			const convActionInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
			await act(async () => {
				populateFoldersStore();
			});

			const conversation1 = generateConversationFromAPI({
				id: '1',
				m: [generateConvMessageFromAPI({ id: '1', l: FOLDERS.TRASH, cid: '1' })],
				su: conversation1Subject
			});

			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [conversation1],
				more: true
			});
			(useParams as jest.Mock).mockReturnValue({
				folderId: FOLDERS.TRASH
			});
			const { user } = await act(async () => setupTest(<ConversationList />));

			makeAllItemsVisible();

			expect(screen.getByTestId('conversation-list-item-avatar-1')).toBeInTheDocument();
			await user.click(await screen.findByTestId('select-icon-checkbox'));
			await user.click(screen.getByRole('button', { name: /label\.select_all/i }));
			const multipleSelectionPanel = await screen.findByTestId('MultipleSelectionActionPanel');
			const multipleSelectionTrashButton = await within(multipleSelectionPanel).findByRoleWithIcon(
				'button',
				{
					icon: TESTID_SELECTORS.icons.deletePermanently
				}
			);
			await user.click(multipleSelectionTrashButton);
			const confirmButton = await screen.findByText('Delete permanently');

			await user.click(confirmButton);
			const request = await waitFor(() => convActionInterceptor);
			expect(request.action.op).toBe('delete');
			expect(request.action.id).toBe('1');
		});
	});
});
