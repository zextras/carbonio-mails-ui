/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import {
	FOLDERS,
	FolderState,
	ParticipantRole,
	useFolderStore,
	useTagStore
} from '@zextras/carbonio-ui-commons';
import { useParams } from 'react-router-dom';
import type { Mock } from 'vitest';

import { within, setupTest, triggerLoadMore, makeListItemsVisible } from '@test-setup';
import { generateFolder } from '@test-utils/folders/folders-generator';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateFoldersStore } from '@test-utils/store/folders';
import { tags } from '@test-utils/tags/tags';
import { TESTID_SELECTORS } from '__test__/constants';
import { generateCompleteMessageFromAPI } from '__test__/generators/api';
import { MsgActionRequest, MsgActionResponse } from 'types/soap/msg-action';
import { MessageList } from 'views/app/folder-panel/messages/message-list';
import { makeAllItemsVisible } from 'views/settings/filters/tests/test-utils';

vi.mock('react-router-dom', async () => ({
	...(await vi.importActual('react-router-dom')),
	useParams: vi.fn()
}));

describe('message-list', () => {
	const message1Subject = 'message 1 subject';
	const invisibleItemTestId = 'invisible-item';

	it('should render without crashing', async () => {
		populateFoldersStore();
		const folderId = FOLDERS.INBOX;
		const searchResponse = {
			m: [generateCompleteMessageFromAPI({ id: '1', l: folderId })],
			more: false
		};
		createSoapAPIInterceptor('Search', searchResponse);
		(useParams as Mock).mockReturnValue({ folderId });

		setupTest(<MessageList />);

		expect(await screen.findByTestId(`message-list-${folderId}`)).toBeInTheDocument();
	});

	it('should render the sender without modifying them', async () => {
		const folder = generateFolder({ id: 'testFolder', parent: FOLDERS.INBOX });
		populateFoldersStore({ customFolders: [folder] });
		const folderId = folder.id;
		const participants = [
			{
				a: 'a',
				p: 'from nAme',
				t: ParticipantRole.FROM
			},
			{
				a: 'a',
				p: 'cc nAme',
				t: ParticipantRole.CARBON_COPY
			}
		];
		const searchResponse = {
			m: [generateCompleteMessageFromAPI({ id: '1', l: folderId, e: participants })],
			more: false
		};
		createSoapAPIInterceptor('Search', searchResponse);
		(useParams as Mock).mockReturnValue({ folderId });

		setupTest(<MessageList />);

		expect(await screen.findAllByTestId(invisibleItemTestId)).toHaveLength(1);

		makeAllItemsVisible();

		expect(await screen.findByText(/from nAme/)).toBeInTheDocument();
	});

	it('should render the correct number of list items', async () => {
		const searchResponse = {
			m: [
				generateCompleteMessageFromAPI({ id: '1', l: FOLDERS.INBOX }),
				generateCompleteMessageFromAPI({ id: '2', l: FOLDERS.INBOX }),
				generateCompleteMessageFromAPI({ id: '3', l: FOLDERS.INBOX })
			],
			more: false
		};
		createSoapAPIInterceptor('Search', searchResponse);
		populateFoldersStore();
		const folderId = FOLDERS.INBOX;
		(useParams as Mock).mockReturnValue({ folderId });

		setupTest(<MessageList />);

		expect(await screen.findAllByTestId(invisibleItemTestId)).toHaveLength(3);
	});

	describe('loadMore', () => {
		it('loads more messages when reaching bottom of the list', async () => {
			populateFoldersStore();
			const folderId = FOLDERS.INBOX;
			(useParams as Mock).mockReturnValue({ folderId });

			const searchResponse = {
				m: [generateCompleteMessageFromAPI({ id: '1', su: message1Subject, l: folderId })],
				more: true
			};
			createSoapAPIInterceptor('Search', searchResponse);

			setupTest(<MessageList />);

			expect(await screen.findAllByTestId(invisibleItemTestId)).toHaveLength(1);

			makeAllItemsVisible();

			expect(screen.getByText(/message 1 subject/i)).toBeInTheDocument();

			const searchResponse2 = {
				m: [generateCompleteMessageFromAPI({ id: '2', su: 'message 2 subject', l: folderId })],
				more: false
			};

			createSoapAPIInterceptor('Search', searchResponse2);

			await act(async () => {
				triggerLoadMore();
			});

			makeAllItemsVisible();

			expect(screen.getByText(/message 1 subject/i)).toBeInTheDocument();
			expect(screen.getByText(/message 2 subject/i)).toBeInTheDocument();
		});

		it('list-bottom-element should not be in the document when there are no more messages', async () => {
			populateFoldersStore();
			const folderId = FOLDERS.INBOX;
			(useParams as Mock).mockReturnValue({ folderId });

			const searchResponse = {
				m: [generateCompleteMessageFromAPI({ id: '1', l: folderId, su: message1Subject })],
				more: false
			};

			createSoapAPIInterceptor('Search', searchResponse);

			setupTest(<MessageList />);

			expect(await screen.findAllByTestId(invisibleItemTestId)).toHaveLength(1);

			makeAllItemsVisible();

			expect(screen.getByText(/message 1 subject/i)).toBeInTheDocument();
			expect(screen.queryByTestId('list-bottom-element')).not.toBeInTheDocument();
		});

		it('list-bottom-element should be in the document when there are more messages', async () => {
			populateFoldersStore();
			const folderId = FOLDERS.INBOX;
			(useParams as Mock).mockReturnValue({ folderId });

			const searchResponse = {
				m: [generateCompleteMessageFromAPI({ id: '1', l: folderId, su: message1Subject })],
				more: true
			};

			createSoapAPIInterceptor('Search', searchResponse);

			setupTest(<MessageList />);

			expect(await screen.findAllByTestId(invisibleItemTestId)).toHaveLength(1);

			makeAllItemsVisible();

			expect(screen.getByText(/message 1 subject/i)).toBeInTheDocument();
			expect(screen.getByTestId('list-bottom-element')).toBeInTheDocument();
		});
	});

	describe('totalMessages count in BreadCrumb', () => {
		it('should render correct totalMessages count in BreadcrumbCount', async () => {
			populateFoldersStore();
			const folderId = FOLDERS.INBOX;
			const searchResponse = {
				m: [generateCompleteMessageFromAPI({ id: '1', l: folderId })],
				more: false
			};
			createSoapAPIInterceptor('Search', searchResponse);
			(useParams as Mock).mockReturnValue({ folderId });

			setupTest(<MessageList />);

			const breadcrumbCountElement = screen.getByTestId('BreadcrumbCount');
			expect(breadcrumbCountElement).toBeInTheDocument();
			await waitFor(() => expect(breadcrumbCountElement.innerHTML).toBe('1'));
		});

		it('should render correct totalMessages count in BreadcrumbCount when more items loaded using loadMore', async () => {
			populateFoldersStore();
			const folderId = FOLDERS.INBOX;
			const initialMessages = Array.from({ length: 100 }, (_, i) =>
				generateCompleteMessageFromAPI({ id: `${i + 1}`, l: folderId })
			);
			const searchResponse = {
				m: initialMessages,
				more: true
			};
			createSoapAPIInterceptor('Search', searchResponse);
			(useParams as Mock).mockReturnValue({ folderId });

			setupTest(<MessageList />);

			const breadcrumbCountElement = screen.getByTestId('BreadcrumbCount');
			expect(breadcrumbCountElement).toBeInTheDocument();
			await waitFor(() => expect(breadcrumbCountElement.innerHTML).toBe('100'));

			const moreMessages = Array.from({ length: 100 }, (_, i) =>
				generateCompleteMessageFromAPI({ id: `${i + 101}`, l: folderId })
			);
			const searchResponse2 = {
				m: moreMessages,
				more: false
			};
			createSoapAPIInterceptor('Search', searchResponse2);

			await act(async () => {
				triggerLoadMore();
			});

			const breadcrumbCountElementAfterLoadMore = screen.getByTestId('BreadcrumbCount');
			expect(breadcrumbCountElementAfterLoadMore).toBeInTheDocument();
			await waitFor(() => expect(breadcrumbCountElementAfterLoadMore.innerHTML).toBe('200'));
		});
	});

	describe('Displayer title', () => {
		const displayerTitleTestCases = [
			{ folderId: FOLDERS.SPAM, expectedText: 'There are no spam e-mails' },
			{ folderId: FOLDERS.SENT, expectedText: 'You haven’t sent any e-mail yet' },
			{ folderId: FOLDERS.DRAFTS, expectedText: 'There are no saved drafts' },
			{ folderId: FOLDERS.TRASH, expectedText: 'The trash is empty' },
			{ folderId: 'someOtherFolder', expectedText: 'It looks like there are no e-mails yet' }
		];

		test.each(displayerTitleTestCases)(
			'should display the correct displayer title for folderId: $folderId',
			async ({ folderId, expectedText }) => {
				const searchResponse = {
					m: [],
					more: false
				};
				createSoapAPIInterceptor('Search', searchResponse);
				const folder = generateFolder({ id: folderId, n: 0, l: FOLDERS.ROOT });
				const initialStoreState: FolderState = {
					linksIdMap: {},
					folders: { [folder.id]: folder },
					searches: {},
					updateFolder: vi.fn()
				};
				useFolderStore.setState(initialStoreState, true);
				(useParams as Mock).mockReturnValue({ folderId });

				setupTest(<MessageList />);

				expect(await screen.findByText(new RegExp(expectedText, 'i'))).toBeVisible();
			}
		);
	});

	describe('message actions', () => {
		describe('single message actions', () => {
			it('should execute MsgAction with op trash when message is in inbox', async () => {
				(useParams as Mock).mockReturnValue({ folderId: FOLDERS.INBOX });

				await act(async () => {
					populateFoldersStore();
				});

				const msgActionInterceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
				const messageId = '1';

				const soapAPIInterceptor = createSoapAPIInterceptor('Search', {
					m: [generateCompleteMessageFromAPI({ id: messageId, l: FOLDERS.INBOX })],
					more: false
				});

				const { user } = await act(async () => setupTest(<MessageList />));

				await waitFor(() => soapAPIInterceptor);
				makeAllItemsVisible();

				const messageListItem = screen.getByTestId(`MessageListItem-${messageId}`);

				await user.hover(messageListItem);

				fireEvent.contextMenu(await screen.findByTestId(/hover-container-/));

				const deleteMenuItem = (await screen.findAllByTestId('dropdown-item')).find(
					(item) => item.textContent === 'Delete'
				) as Element;

				await user.click(deleteMenuItem);

				const msgActionRequest = await waitFor(() => msgActionInterceptor);

				await act(async () => {
					expect(msgActionRequest.action).toMatchObject({ op: 'trash', id: messageId });
				});
				const successMessage = await screen.findByText('It looks like there are no e-mails yet');
				await act(async () => {
					expect(successMessage).toBeInTheDocument();
				});
			});

			it('should execute MsgAction with op delete when message is in trash', async () => {
				await act(async () => {
					populateFoldersStore();
				});
				(useParams as Mock).mockReturnValue({ folderId: FOLDERS.TRASH });

				const msgActionInterceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
				const messageId = '100';

				const soapAPIInterceptor = createSoapAPIInterceptor('Search', {
					m: [generateCompleteMessageFromAPI({ id: messageId, l: FOLDERS.TRASH })],
					more: false
				});

				const { user } = await act(async () => setupTest(<MessageList />));

				await waitFor(() => soapAPIInterceptor);

				makeAllItemsVisible();

				const messageListItem = await screen.findByTestId(`MessageListItem-${messageId}`);
				expect(messageListItem).toBeInTheDocument();

				await act(async () => {
					await user.hover(messageListItem);
				});

				fireEvent.contextMenu(await screen.findByTestId(/hover-container-/));

				const deletePermanentlyMenuItem = (await screen.findAllByTestId('dropdown-item')).find(
					(item) => item.textContent === 'Delete Permanently'
				) as Element;

				await user.click(deletePermanentlyMenuItem);
				await user.click(
					within(await screen.findByTestId('modal')).getByRole('button', {
						name: /delete permanently/i
					})
				);

				const msgActionRequest = await waitFor(() => msgActionInterceptor);
				await act(async () => {
					expect(msgActionRequest.action).toMatchObject({ op: 'delete', id: messageId });
				});
				const successMessage = await screen.findByText('E-mail permanently deleted');
				await act(async () => {
					expect(successMessage).toBeInTheDocument();
				});
			});
		});

		describe('multiple selection mode', () => {
			// FIXME: failing
			it.skip('should move a message to trash when the trash action button is clicked', async () => {
				const messageId = '10';

				(useParams as Mock).mockReturnValue({ folderId: FOLDERS.INBOX });
				const msgActionRequestInterceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
				populateFoldersStore();

				createSoapAPIInterceptor('Search', {
					m: [generateCompleteMessageFromAPI({ id: messageId, l: FOLDERS.INBOX })],
					more: false
				});

				const { user } = setupTest(<MessageList />);
				await screen.findByTestId('invisible-item');
				makeListItemsVisible();
				const actionWrapper = await screen.findByTestId(`message-item-10`);
				await user.hover(actionWrapper);

				const itemAvatar = await screen.findByTestId('message-list-item-avatar-10');
				const avatar = within(itemAvatar).getByTestId('avatar');
				await act(async () => {
					await user.click(avatar);
				});
				await within(itemAvatar).findByTestId('icon: Checkmark');
				const multipleSelectionPanel = await screen.findByTestId('MultipleSelectionActionPanel');
				const multipleSelectionTrashButton = await within(
					multipleSelectionPanel
				).findByRoleWithIcon('button', {
					icon: TESTID_SELECTORS.icons.trash
				});
				await user.click(multipleSelectionTrashButton);

				const msgActionRequest = await waitFor(() => msgActionRequestInterceptor);
				await act(async () => {
					expect(msgActionRequest.action).toMatchObject({ op: 'trash', id: messageId });
				});
				const successMessage = await screen.findByText('E-mail moved to Trash');
				await act(async () => {
					expect(successMessage).toBeInTheDocument();
				});
			});

			// FIXME: failing
			it.skip('should delete a message when the permanently delete action button is clicked', async () => {
				const messageId = '11';

				(useParams as Mock).mockReturnValue({ folderId: FOLDERS.TRASH });
				const msgActionRequestInterceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
				populateFoldersStore();

				createSoapAPIInterceptor('Search', {
					m: [generateCompleteMessageFromAPI({ id: messageId, l: FOLDERS.TRASH })],
					more: false
				});

				const { user } = setupTest(<MessageList />);

				await screen.findByTestId('invisible-item');
				makeListItemsVisible();
				const actionWrapper = await screen.findByTestId(`message-item-11`);
				await user.hover(actionWrapper);

				const itemAvatar = await screen.findByTestId('message-list-item-avatar-11');
				const avatar = within(itemAvatar).getByTestId('avatar');
				await act(async () => {
					await user.click(avatar);
				});
				await within(itemAvatar).findByTestId('icon: Checkmark');

				const multipleSelectionPanel = await screen.findByTestId('MultipleSelectionActionPanel');
				const multipleSelectionDeletePermanentlyButton = await within(
					multipleSelectionPanel
				).findByRoleWithIcon('button', {
					icon: TESTID_SELECTORS.icons.deletePermanently
				});
				await user.click(multipleSelectionDeletePermanentlyButton);
				const confirmButton = await screen.findByText('Delete permanently');

				await user.click(confirmButton);

				const request = await waitFor(() => msgActionRequestInterceptor);
				await act(async () => {
					expect(request.action.op).toBe('delete');
				});
				await act(async () => {
					expect(request.action.id).toBe(messageId);
				});
				const successMessage = await screen.findByText('E-mail permanently deleted');
				await act(async () => {
					expect(successMessage).toBeInTheDocument();
				});
			});
		});
	});
	describe('multiple selection interactions', () => {
		const message1 = generateCompleteMessageFromAPI({ id: '1', l: FOLDERS.INBOX, t: '' });
		const message2 = generateCompleteMessageFromAPI({ id: '2', l: FOLDERS.INBOX, t: '' });
		const message3 = generateCompleteMessageFromAPI({ id: '3', l: FOLDERS.INBOX, t: '' });

		it('items should still be selected after a multiple selection action', async () => {
			(useParams as Mock).mockReturnValue({ folderId: FOLDERS.INBOX });
			const msgActionRequestInterceptor = createSoapAPIInterceptor<
				MsgActionRequest,
				MsgActionResponse
			>('MsgAction', {
				action: {
					id: '1,2,3',
					op: 'tag'
				}
			});

			populateFoldersStore();

			useTagStore.setState({ tags });
			createSoapAPIInterceptor('Search', {
				m: [message1, message2, message3],
				more: false
			});

			const { user } = setupTest(<MessageList />);

			await screen.findAllByTestId('invisible-item');
			makeListItemsVisible();

			// select all messages
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
			const request = await waitFor(() => msgActionRequestInterceptor);
			await act(async () => {
				expect(request.action.op).toBe('tag');
			});

			// await for the success message to appear
			const successMessage = await screen.findByText(/tag applied/);
			await act(async () => {
				expect(successMessage).toBeInTheDocument();
			});

			// verify that all messages are still selected
			const deselectAllButtonAfterAction = screen.getByRole('button', {
				name: /label\.deselect_all/i
			});
			expect(deselectAllButtonAfterAction).toBeInTheDocument();

			// double check that all 3 messages are selected
			const totalItemsSelected = screen.getAllByTestId('icon: Checkmark');
			expect(totalItemsSelected).toHaveLength(3);
		});

		it('items should still be selected after a single message action on a unselected item', async () => {
			(useParams as Mock).mockReturnValue({ folderId: FOLDERS.INBOX });
			const msgActionRequestInterceptor = createSoapAPIInterceptor<
				MsgActionRequest,
				MsgActionResponse
			>('MsgAction', {
				action: {
					id: '2',
					op: 'tag'
				}
			});

			populateFoldersStore();

			useTagStore.setState({ tags });
			createSoapAPIInterceptor('Search', {
				m: [message1, message2, message3],
				more: false
			});

			const { user } = setupTest(<MessageList />);

			await screen.findAllByTestId('invisible-item');
			makeListItemsVisible();

			// select the first message
			const actionWrapper = await screen.findByTestId(`message-item-1`);
			await user.hover(actionWrapper);
			const itemAvatar = await screen.findByTestId('message-list-item-avatar-1');
			const avatar = within(itemAvatar).getByTestId('avatar');
			await act(async () => {
				await user.click(avatar);
			});
			const totalItemsSelected = screen.getAllByTestId('icon: Checkmark');
			expect(totalItemsSelected).toHaveLength(1);

			// perform a single message action on another message
			const messageListItem = screen.getByTestId('MessageListItem-2');
			await user.hover(messageListItem);
			fireEvent.contextMenu(await screen.findByTestId(/hover-container-2/));
			const tagMenuItem = (await screen.findAllByTestId('dropdown-item')).find(
				(item) => item.textContent === 'Tag'
			) as Element;
			await user.hover(tagMenuItem);
			const tagActionIcon = screen.getByTestId('tag-item-2291');
			const tagActionButton = within(tagActionIcon).getByTestId('icon: Square');
			await user.click(tagActionButton);
			const request = await waitFor(() => msgActionRequestInterceptor);
			await act(async () => {
				expect(request.action.op).toBe('tag');
			});

			// await for the success message to appear
			const successMessage = await screen.findByText(/tag applied/);
			await act(async () => {
				expect(successMessage).toBeInTheDocument();
			});

			// verify that selection mode is still on
			const deselectAllButtonAfterAction = screen.getByRole('button', {
				name: /label\.select_all/i
			});
			expect(deselectAllButtonAfterAction).toBeInTheDocument();

			// double check that 1 messages is still selected
			const totalItemsSelectedAfterAction = screen.getAllByTestId('icon: Checkmark');
			expect(totalItemsSelectedAfterAction).toHaveLength(1);
		});
		it('items should still be selected after a single message action on a selected item', async () => {
			(useParams as Mock).mockReturnValue({ folderId: FOLDERS.INBOX });
			const msgActionRequestInterceptor = createSoapAPIInterceptor<
				MsgActionRequest,
				MsgActionResponse
			>('MsgAction', {
				action: {
					id: '1',
					op: 'tag'
				}
			});

			populateFoldersStore();

			useTagStore.setState({ tags });
			createSoapAPIInterceptor('Search', {
				m: [message1, message2, message3],
				more: false
			});

			const { user } = setupTest(<MessageList />);

			await screen.findAllByTestId('invisible-item');
			makeListItemsVisible();

			// select the first message
			const actionWrapper = await screen.findByTestId(`message-item-1`);
			await user.hover(actionWrapper);
			const itemAvatar = await screen.findByTestId('message-list-item-avatar-1');
			const avatar = within(itemAvatar).getByTestId('avatar');
			await act(async () => {
				await user.click(avatar);
			});
			const totalItemsSelected = screen.getAllByTestId('icon: Checkmark');
			expect(totalItemsSelected).toHaveLength(1);

			// perform a single message action on the selected message
			const messageListItem = screen.getByTestId('MessageListItem-1');
			await user.hover(messageListItem);
			fireEvent.contextMenu(await screen.findByTestId(/hover-container-1/));
			const tagMenuItem = (await screen.findAllByTestId('dropdown-item')).find(
				(item) => item.textContent === 'Tag'
			) as Element;
			await user.hover(tagMenuItem);
			const tagActionIcon = screen.getByTestId('tag-item-2291');
			const tagActionButton = within(tagActionIcon).getByTestId('icon: Square');
			await user.click(tagActionButton);
			const request = await waitFor(() => msgActionRequestInterceptor);
			await act(async () => {
				expect(request.action.op).toBe('tag');
			});

			// await for the success message to appear
			const successMessage = await screen.findByText(/tag applied/);
			await act(async () => {
				expect(successMessage).toBeInTheDocument();
			});

			// verify that selection mode is still on
			const deselectAllButtonAfterAction = screen.getByRole('button', {
				name: /label\.select_all/i
			});
			expect(deselectAllButtonAfterAction).toBeInTheDocument();

			// double check that 1 messages is still selected
			const totalItemsSelectedAfterAction = screen.getAllByTestId('icon: Checkmark');
			expect(totalItemsSelectedAfterAction).toHaveLength(1);
		});

		it('enables select mode on first click and supports range selection with shift-click', async () => {
			(useParams as Mock).mockReturnValue({ folderId: FOLDERS.INBOX });

			populateFoldersStore();

			useTagStore.setState({ tags });
			createSoapAPIInterceptor('Search', {
				m: [message1, message2, message3],
				more: false
			});

			const { user } = setupTest(<MessageList />);

			await screen.findAllByTestId('invisible-item');
			makeListItemsVisible();
			// select the first conversation
			const actionWrapper = await screen.findByTestId(`message-item-1`);
			await user.hover(actionWrapper);
			const itemAvatar = await screen.findByTestId('message-list-item-avatar-1');
			const avatar = within(itemAvatar).getByTestId('avatar');
			await act(async () => {
				await user.click(avatar);
			});
			const totalItemsSelected = screen.getAllByTestId('icon: Checkmark');
			expect(totalItemsSelected).toHaveLength(1);

			// Shift-click to select a range
			const actionWrapper2 = await screen.findByTestId(`message-item-3`);
			await user.hover(actionWrapper2);
			const itemAvatar2 = await screen.findByTestId('message-list-item-avatar-3');
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
			const actionWrapperMid = screen.getByTestId('message-item-2');
			await user.hover(actionWrapperMid);
			const itemAvatarMid = await screen.findByTestId('message-list-item-avatar-2');
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

	describe('scheduled draft messages', () => {
		it('should open warning dialog when double-clicking a scheduled draft message', async () => {
			const scheduledTime = Date.now() + 3600000; // 1 hour in the future
			const scheduledDraftMessage = generateCompleteMessageFromAPI({
				id: '100',
				l: FOLDERS.DRAFTS,
				f: 'd',
				autoSendTime: scheduledTime
			});

			populateFoldersStore();
			(useParams as Mock).mockReturnValue({ folderId: FOLDERS.DRAFTS });

			createSoapAPIInterceptor('Search', {
				m: [scheduledDraftMessage],
				more: false
			});

			const { user } = setupTest(<MessageList />);

			await screen.findAllByTestId('invisible-item');
			makeListItemsVisible();

			const messageListItem = await screen.findByTestId(
				`MessageListItem-${scheduledDraftMessage.id}`
			);
			expect(messageListItem).toBeInTheDocument();

			await user.hover(messageListItem);
			const hoverContainer = await screen.findByTestId(/hover-container-/);

			await act(async () => {
				await user.dblClick(hoverContainer);
			});

			// modal appears
			const modal = await screen.findByTestId('modal');
			expect(modal).toBeInTheDocument();

			// modal title
			expect(within(modal).getByText('label.warning')).toBeInTheDocument();

			// modal message about delayed sending
			expect(within(modal).getByText('messages.edit_schedule_warning')).toBeInTheDocument();

			// "Edit anyway" button exists
			const editAnywayButton = within(modal).getByRole('button', {
				name: 'action.edit_anyway'
			});
			expect(editAnywayButton).toBeInTheDocument();
		});
	});
});
