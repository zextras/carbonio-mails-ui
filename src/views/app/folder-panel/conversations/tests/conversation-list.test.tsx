/* eslint-disable testing-library/prefer-user-event */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { FOLDERS, useTagStore } from '@zextras/carbonio-ui-commons';
import { useParams } from 'react-router-dom';
import type { Mock } from 'vitest';

import { within, setupTest, triggerLoadMore } from '@test-setup';
import { generateFolder } from '@test-utils/folders/folders-generator';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateFoldersStore } from '@test-utils/store/folders';
import { tags } from '@test-utils/tags/tags';
import { TESTID_SELECTORS } from '__test__/constants';
import { generateConversationFromAPI, generateConvMessageFromAPI } from '__test__/generators/api';
import { updateConversationsResultsLoadingStatus } from 'store/emails/store';
import { ConvActionRequest } from 'types/soap/conv-action';
import { SearchRequest, SearchResponse } from 'types/soap/search';
import { ConversationList } from 'views/app/folder-panel/conversations/conversation-list';
import { makeAllItemsVisible } from 'views/settings/filters/tests/test-utils';

vi.mock('react-router-dom', async () => ({
	...(await vi.importActual('react-router-dom')),
	useParams: vi.fn()
}));

describe('ConversationList Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		const folderId = '2';
		(useParams as Mock).mockReturnValue({
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

	describe('conversation actions', () => {
		describe('single actions', () => {
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
				(useParams as Mock).mockReturnValue({
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
		});

		describe('multiple selection actions', () => {
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
				(useParams as Mock).mockReturnValue({
					folderId: FOLDERS.INBOX
				});
				const { user } = await act(async () => setupTest(<ConversationList />));

				makeAllItemsVisible();

				expect(screen.getByTestId('conversation-list-item-avatar-1')).toBeInTheDocument();
				await user.click(await screen.findByTestId('select-icon-checkbox'));
				await user.click(screen.getByRole('button', { name: /label\.select_all/i }));

				const multipleSelectionPanel = await screen.findByTestId('MultipleSelectionActionPanel');
				const multipleSelectionTrashButton = await within(
					multipleSelectionPanel
				).findByRoleWithIcon('button', {
					icon: TESTID_SELECTORS.icons.trash
				});
				await user.click(multipleSelectionTrashButton);
				const request = await waitFor(() => convActionInterceptor);
				await act(async () => {
					expect(request.action.op).toBe('trash');
				});
				await act(async () => {
					expect(request.action.id).toBe('1');
				});
			});
			it('should move multiple conversations to trash when the trash action button is clicked', async () => {
				const convActionInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
				await act(async () => {
					populateFoldersStore();
				});

				const conversation1 = generateConversationFromAPI({
					id: '1',
					m: [generateConvMessageFromAPI({ id: '1', l: FOLDERS.INBOX, cid: '1' })],
					su: conversation1Subject
				});
				const conversation2 = generateConversationFromAPI({
					id: '2',
					m: [generateConvMessageFromAPI({ id: '2', l: FOLDERS.INBOX, cid: '2' })],
					su: conversation1Subject
				});

				createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
					c: [conversation1, conversation2],
					more: true
				});
				(useParams as Mock).mockReturnValue({
					folderId: FOLDERS.INBOX
				});
				const { user } = await act(async () => setupTest(<ConversationList />));

				makeAllItemsVisible();

				expect(await screen.findByTestId('conversation-list-item-avatar-1')).toBeInTheDocument();
				await user.click(await screen.findByTestId('select-icon-checkbox'));
				await user.click(screen.getByRole('button', { name: /label\.select_all/i }));

				const multipleSelectionPanel = await screen.findByTestId('MultipleSelectionActionPanel');
				const multipleSelectionTrashButton = await within(
					multipleSelectionPanel
				).findByRoleWithIcon('button', {
					icon: TESTID_SELECTORS.icons.trash
				});
				await user.click(multipleSelectionTrashButton);
				const request = await waitFor(() => convActionInterceptor);
				await act(async () => {
					expect(request.action.op).toBe('trash');
				});

				await act(async () => {
					expect(request.action.id).toBe('1,2');
				});
			});
		});
	});

	describe('multiple selection interactions', () => {
		const conversation1 = generateConversationFromAPI({
			id: '1',
			m: [generateConvMessageFromAPI({ id: '1', l: FOLDERS.INBOX, cid: '1' })],
			su: conversation1Subject
		});
		const conversation2 = generateConversationFromAPI({
			id: '2',
			m: [generateConvMessageFromAPI({ id: '2', l: FOLDERS.INBOX, cid: '2' })],
			su: conversation1Subject
		});
		const conversation3 = generateConversationFromAPI({
			id: '3',
			m: [generateConvMessageFromAPI({ id: '3', l: FOLDERS.INBOX, cid: '3' })],
			su: conversation1Subject
		});
		it('items should still be selected after a multiple selection action', async () => {
			(useParams as Mock).mockReturnValue({ folderId: FOLDERS.INBOX });
			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [conversation1, conversation2],
				more: true
			});
			populateFoldersStore();

			const convActionInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
			useTagStore.setState({ tags });
			const { user } = await act(async () => setupTest(<ConversationList />));

			makeAllItemsVisible();

			// select all conversations
			const enterMultipleSelectionMode = await screen.findByTestId('icon: CheckmarkSquare');
			await user.click(enterMultipleSelectionMode);
			const selectAllButton = screen.getByRole('button', {
				name: /label\.select_all/i
			});
			await user.click(selectAllButton);
			const deselectAllButton = screen.getByRole('button', {
				name: /label\.deselect_all/i
			});
			expect(deselectAllButton).toBeInTheDocument();

			// perform a multiple selection action
			// using the tag action as an example in order to be able to intercept the confirmation snackbar
			const multipleSelectionPanel = await screen.findByTestId('MultipleSelectionActionPanel');
			const multipleSelectionMarkUnread = await within(multipleSelectionPanel).findByRoleWithIcon(
				'button',
				{
					icon: 'icon: MoreVertical'
				}
			);
			await user.click(multipleSelectionMarkUnread);
			const actionsDropdown = screen.getByTestId('dropdown-popper-list');
			expect(within(actionsDropdown).getByText(/tag/i)).toBeVisible();
			await user.hover(within(actionsDropdown).getByText(/tag/i));
			const tagActionIcon = screen.getByTestId('tag-item-2291');
			const tagActionButton = within(tagActionIcon).getByTestId('icon: Square');
			await user.click(tagActionButton);
			const request = await waitFor(() => convActionInterceptor);
			await act(async () => {
				expect(request.action.op).toBe('tag');
			});

			// await for the success snackbar to appear
			const successSnackbar = await screen.findByText(/tag applied/);
			await act(async () => {
				expect(successSnackbar).toBeInTheDocument();
			});

			// verify that all conversations are still selected
			const deselectAllButtonAfterAction = screen.getByRole('button', {
				name: /label\.deselect_all/i
			});
			expect(deselectAllButtonAfterAction).toBeInTheDocument();

			// double check that all 2 conversations are selected
			const totalItemsSelected = screen.getAllByTestId('icon: Checkmark');
			expect(totalItemsSelected).toHaveLength(2);
		});
		it('items should still be selected after a single conversation action on a unselected item', async () => {
			(useParams as Mock).mockReturnValue({ folderId: FOLDERS.INBOX });
			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [conversation1, conversation2],
				more: true
			});

			const convActionInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

			populateFoldersStore();

			useTagStore.setState({ tags });
			const { user } = await act(async () => setupTest(<ConversationList />));

			makeAllItemsVisible();

			// select the first conversation
			const actionWrapper = await screen.findByTestId(`ConversationListItem-1`);
			await user.hover(actionWrapper);
			const itemAvatar = await screen.findByTestId('conversation-list-item-avatar-1');
			const avatar = within(itemAvatar).getByTestId('avatar');
			await act(async () => {
				await user.click(avatar);
			});
			const totalItemsSelected = screen.getAllByTestId('icon: Checkmark');
			expect(totalItemsSelected).toHaveLength(1);

			// perform a single conversation action on another conversation
			const convListItem = screen.getByTestId('ConversationListItem-2');
			await user.hover(convListItem);
			fireEvent.contextMenu(await screen.findByTestId(/hover-container-2/));
			const tagMenuItem = (await screen.findAllByTestId('dropdown-item')).find(
				(item) => item.textContent === 'Tag'
			) as Element;
			await user.hover(tagMenuItem);
			const tagActionIcon = screen.getByTestId('tag-item-2291');
			const tagActionButton = within(tagActionIcon).getByTestId('icon: Square');
			await user.click(tagActionButton);
			const request = await waitFor(() => convActionInterceptor);
			await act(async () => {
				expect(request.action.op).toBe('tag');
			});

			// await for the success snackbar to appear
			const successSnackbar = await screen.findByText(/tag applied/);
			await act(async () => {
				expect(successSnackbar).toBeInTheDocument();
			});

			// verify that selection mode is still on
			const deselectAllButtonAfterAction = screen.getByRole('button', {
				name: /label\.select_all/i
			});
			expect(deselectAllButtonAfterAction).toBeInTheDocument();

			// double check that 1 conversation is still selected
			const totalItemsSelectedAfterAction = screen.getAllByTestId('icon: Checkmark');
			expect(totalItemsSelectedAfterAction).toHaveLength(1);
		});
		it('items should still be selected after a single conversation action on a selected item', async () => {
			(useParams as Mock).mockReturnValue({ folderId: FOLDERS.INBOX });
			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [conversation1, conversation2],
				more: true
			});

			const convActionInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

			populateFoldersStore();

			useTagStore.setState({ tags });
			const { user } = await act(async () => setupTest(<ConversationList />));

			makeAllItemsVisible();

			// select the first conversation
			const actionWrapper = await screen.findByTestId(`ConversationListItem-1`);
			await user.hover(actionWrapper);
			const itemAvatar = await screen.findByTestId('conversation-list-item-avatar-1');
			const avatar = within(itemAvatar).getByTestId('avatar');
			await act(async () => {
				await user.click(avatar);
			});
			const totalItemsSelected = screen.getAllByTestId('icon: Checkmark');
			expect(totalItemsSelected).toHaveLength(1);

			// select the first conversation action on the selected conversation
			const convListItem = screen.getByTestId('ConversationListItem-1');
			await user.hover(convListItem);
			fireEvent.contextMenu(await screen.findByTestId(/hover-container-1/));
			const tagMenuItem = (await screen.findAllByTestId('dropdown-item')).find(
				(item) => item.textContent === 'Tag'
			) as Element;
			await user.hover(tagMenuItem);
			const tagActionIcon = screen.getByTestId('tag-item-2291');
			const tagActionButton = within(tagActionIcon).getByTestId('icon: Square');
			await user.click(tagActionButton);
			const request = await waitFor(() => convActionInterceptor);
			await act(async () => {
				expect(request.action.op).toBe('tag');
			});

			// await for the success snackbar to appear
			const successSnackbar = await screen.findByText(/tag applied/);
			await act(async () => {
				expect(successSnackbar).toBeInTheDocument();
			});

			// verify that selection mode is still on
			const deselectAllButtonAfterAction = screen.getByRole('button', {
				name: /label\.select_all/i
			});
			expect(deselectAllButtonAfterAction).toBeInTheDocument();

			// double check that 1 conversation is still selected
			const totalItemsSelectedAfterAction = screen.getAllByTestId('icon: Checkmark');
			expect(totalItemsSelectedAfterAction).toHaveLength(1);
		});
		it('enables select mode on first click and supports range selection with shift-click', async () => {
			(useParams as Mock).mockReturnValue({ folderId: FOLDERS.INBOX });
			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [conversation1, conversation2, conversation3],
				more: true
			});

			const { user } = await act(async () => setupTest(<ConversationList />));

			makeAllItemsVisible();

			// select the first conversation
			const actionWrapper = await screen.findByTestId(`ConversationListItem-1`);
			await user.hover(actionWrapper);
			const itemAvatar = await screen.findByTestId('conversation-list-item-avatar-1');
			const avatar = within(itemAvatar).getByTestId('avatar');
			await act(async () => {
				await user.click(avatar);
			});
			const totalItemsSelected = screen.getAllByTestId('icon: Checkmark');
			expect(totalItemsSelected).toHaveLength(1);

			// Shift-click to select a range
			const actionWrapper2 = await screen.findByTestId(`ConversationListItem-3`);
			await user.hover(actionWrapper2);
			const itemAvatar2 = await screen.findByTestId('conversation-list-item-avatar-3');
			const avatar2 = within(itemAvatar2).getByTestId('avatar');
			await act(async () => {
				await user.keyboard('{Shift>}');
				await user.click(avatar2);
				await user.keyboard('{/Shift}');
			});

			const totalItemsSelected2 = screen.getAllByTestId('icon: Checkmark');
			await waitFor(() => {
				expect(totalItemsSelected2).toHaveLength(3);
			});

			// Verify that, after unselecting the second element, the first and last items are selected
			const actionWrapperMid = screen.getByTestId('ConversationListItem-2');
			await user.hover(actionWrapperMid);
			const itemAvatarMid = await screen.findByTestId('conversation-list-item-avatar-2');
			const avatarMid = within(itemAvatarMid).getByTestId('avatar');

			await act(async () => {
				await user.click(avatarMid); // toggle OFF sul secondo
			});

			await waitFor(() => {
				expect(within(itemAvatarMid).queryByTestId('icon: Checkmark')).not.toBeInTheDocument();
			});
			expect(screen.getAllByTestId('icon: Checkmark')).toHaveLength(2);
		});
	});
});
