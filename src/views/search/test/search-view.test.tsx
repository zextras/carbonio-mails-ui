/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import type { QueryChip, SearchViewProps } from '@zextras/carbonio-search-ui';
import * as hooks from '@zextras/carbonio-shell-ui';
import { AccountSettings } from '@zextras/carbonio-shell-ui';
import { FOLDERS, useTagStore } from '@zextras/carbonio-ui-commons';
import { noop } from 'lodash';
import * as reactRouterDom from 'react-router-dom';
import type { Mock } from 'vitest';

import { within, makeListItemsVisible, setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateSettings } from '@test-utils/settings/settings-generator';
import { tags } from '@test-utils/tags/tags';
import { TESTID_SELECTORS } from '__test__/constants';
import { generateSoapConversationMessage } from '__test__/generators/api';
import * as searchSoapApi from 'api/search-soap-api';

import SearchView from 'views/search/search-view';
import { MsgActionRequest, MsgActionResponse } from 'types/soap/msg-action';
import { SoapIncompleteMessage, SoapMailMessage } from 'types/soap/soap-mail-message';
import { SoapConversation } from 'types/soap/soap-conversation';
import { SearchRequest, SearchResponse } from 'types/soap/search';
import { ConvActionRequest, ConvActionResponse } from 'types/soap/conv-action';
import { SearchConvRequest, SearchConvResponse } from 'types/soap/search-conv';
import { GetMsgRequest, GetMsgResponse } from 'types/soap/get-msg';

vi.mock('react-router-dom', async () => ({
	...(await vi.importActual('react-router-dom')),
	useNavigate: vi.fn()
}));

type SetupTest = {
	query: string;
	viewBy: 'message' | 'conversation';
};

const aRandomMsgActionResponse: MsgActionResponse = {
	action: {
		id: '123',
		op: 'trash'
	}
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const setupSearchViewTest = ({ query, viewBy }: Partial<SetupTest>) => {
	const queryChip: QueryChip = {
		hasAvatar: false,
		id: '0',
		label: query
	};
	const customSettings: Partial<AccountSettings> = {
		prefs: {
			zimbraPrefGroupMailBy: viewBy
		}
	};
	const settings = generateSettings(customSettings);
	vi.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
	return {
		settings,
		queryChip
	};
};

async function waitAndMakeConversationVisible(conversationId: string): Promise<void> {
	await screen.findByTestId(`invisible-conversation-${conversationId}`);
	makeListItemsVisible();
}

async function waitAndMakeMessageVisible(messageId: string): Promise<void> {
	await screen.findByTestId(`invisible-message-${messageId}`);
	makeListItemsVisible();
}

function getSoapMessage(
	messageId: string,
	initialData?: Partial<SoapIncompleteMessage>,
	id?: string
): SoapMailMessage {
	return {
		id: messageId,
		cid: id ?? '1',
		e: [],
		su: 'message Subject',
		s: 71116,
		l: '2',
		f: 'au',
		fr: 'fragment',
		mp: [],
		d: 1717752296000,
		...initialData
	};
}

function getSoapConversation(
	id: string,
	messageInitialData?: Partial<SoapIncompleteMessage>
): SoapConversation {
	return {
		id,
		n: 1,
		u: 1,
		f: 'flag',
		tn: 'tag names',
		d: 123,
		m: [getSoapMessage('123', messageInitialData, id)],
		e: [],
		su: 'conversations Subject',
		fr: 'fragment'
	};
}
function fakeCounter(): { count: number; setCount: (value: number) => void } {
	let count = 0;
	const setCount = (value: number): void => {
		count = value;
	};
	return { count, setCount };
}

describe.skip('SearchView', () => {
	beforeAll(() => {
		vi.spyOn(reactRouterDom, 'useNavigate').mockReturnValue(vi.fn());
	});

	describe('view by conversations', () => {
		it('should display label "Results for" when soap API fulfilled', async () => {
			const { queryChip } = setupSearchViewTest({ viewBy: 'conversation', query: 'hello' });

			const mockUseQuery = vi.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				ResultsHeader: resultsHeader,
				useDisableSearch: () => [false, noop]
			};

			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [getSoapConversation('123')],
				more: false
			});

			setupTest(<SearchView {...searchViewProps} />);

			expect(await screen.findByText('label.results_for')).toBeInTheDocument();
		});

		it('should display conversation subject when soap API fulfilled and settings is "display by conversation"', async () => {
			const { queryChip } = setupSearchViewTest({ viewBy: 'conversation', query: 'hello' });
			const mockUseQuery = vi.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);

			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				ResultsHeader: resultsHeader,
				useDisableSearch: () => [false, noop]
			};

			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [getSoapConversation('123')],
				more: false
			});
			setupTest(<SearchView {...searchViewProps} />);

			await waitAndMakeConversationVisible('123');
			const conversation = await screen.findByText('conversations Subject');
			expect(conversation).toBeInTheDocument();
		});

		it('should display the number of messages in a conversation when soap API fulfilled', async () => {
			const { queryChip } = setupSearchViewTest({ viewBy: 'conversation', query: 'hello' });

			const mockUseQuery = vi.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);

			const message1 = generateSoapConversationMessage('100', '123');
			const message2 = generateSoapConversationMessage('200', '123');
			const conversation = { ...getSoapConversation('123'), n: 2, m: [message1, message2] };
			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [conversation],
				more: false
			});
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				ResultsHeader: resultsHeader,
				useDisableSearch: () => [false, noop]
			};

			setupTest(<SearchView {...searchViewProps} />);
			await waitAndMakeConversationVisible('123');
			expect(await screen.findByText('conversations Subject')).toBeInTheDocument();
			const chevron = await screen.findByTestId(`ToggleExpand`);
			const badge = await screen.findByTestId(`conversation-messages-count-${conversation.id}`);
			expect(chevron).toBeInTheDocument();
			expect(badge).toBeInTheDocument();
			expect(badge).toHaveTextContent('2');
		});

		it('should change the route when clicking a conversation in the list', async () => {
			const navigate = vi.fn();
			(reactRouterDom.useNavigate as Mock).mockReturnValue(navigate);
			const { queryChip } = setupSearchViewTest({ viewBy: 'conversation', query: 'hello' });
			const mockUseQuery = vi.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);

			const defaultConversation = getSoapConversation('123');
			const message1 = generateSoapConversationMessage('100', '123');
			const message2 = generateSoapConversationMessage('200', '123');

			const conversation = { ...defaultConversation, n: 2, m: [message1, message2] };
			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [conversation],
				more: false
			});

			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				ResultsHeader: resultsHeader,
				useDisableSearch: () => [false, noop]
			};

			const { user } = setupTest(<SearchView {...searchViewProps} />);
			await waitAndMakeConversationVisible('123');
			expect(await screen.findByText('conversations Subject')).toBeInTheDocument();
			const conversationContainer = await screen.findByTestId(
				`ConversationListItem-${conversation.id}`
			);

			await act(async () => {
				await user.hover(conversationContainer);
			});

			const clickableConversation = await screen.findByTestId(`hover-container-${conversation.id}`);
			await act(async () => {
				await user.click(clickableConversation);
			});
			expect(navigate).toHaveBeenCalledWith('../conversation/123');
		});

		it('should display conversation as selected when user clicks on avatar', async () => {
			const defaultConversation = getSoapConversation('123');
			const message1 = generateSoapConversationMessage('1', '123');

			const conversation = { ...defaultConversation, n: 2, m: [message1] };
			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [conversation],
				more: false
			});

			const { queryChip } = setupSearchViewTest({ viewBy: 'conversation', query: 'hello' });
			const mockUseQuery = vi.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				ResultsHeader: (props: { label: string }): ReactElement => <>{props.label}</>,
				useDisableSearch: () => [false, noop]
			};
			const { count, setCount } = fakeCounter();
			vi.spyOn(hooks, 'useAppContext').mockReturnValue({ count, setCount });

			const { user } = setupTest(<SearchView {...searchViewProps} />);
			await waitAndMakeConversationVisible('123');
			const actionWrapper = await screen.findByTestId(`ConversationListItem-123`);
			await user.hover(actionWrapper);

			const itemAvatar = await screen.findByTestId('conversation-list-item-avatar-123');
			const avatar = within(itemAvatar).getByTestId('avatar');
			await act(async () => {
				await user.click(avatar);
			});

			expect(await within(itemAvatar).findByTestId('icon: Checkmark')).toBeVisible();
		});

		it('should call ConvActionRequest with operation "delete" when clicking delete permanently action', async () => {
			const apiInterceptor = createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>(
				'ConvAction',
				{
					action: {
						id: '123',
						op: 'delete'
					}
				}
			);

			const { queryChip } = setupSearchViewTest({ viewBy: 'conversation', query: 'hello' });

			const mockUseQuery = vi.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				ResultsHeader: resultsHeader,
				useDisableSearch: () => [false, noop]
			};
			vi.spyOn(hooks, 'useAppContext').mockReturnValue(fakeCounter());

			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [getSoapConversation('123', { l: FOLDERS.TRASH })],
				more: false
			});
			const { user } = setupTest(<SearchView {...searchViewProps} />);
			await waitAndMakeConversationVisible('123');
			const actionWrapper = await screen.findByTestId(`ConversationListItem-123`);
			await user.hover(actionWrapper);
			expect(actionWrapper).toBeVisible();

			await screen.findByTestId('primary-actions-bar-123');

			const deletePermanentlyIconButton = screen.getByTestId('icon: DeletePermanentlyOutline');

			await user.click(deletePermanentlyIconButton);
			const deleteButton = await screen.findByText('Delete permanently');
			await user.click(deleteButton);

			const receivedRequest = await apiInterceptor;

			await act(async () => {
				expect(receivedRequest.action.id).toBe('123');
			});
			await act(async () => {
				expect(receivedRequest.action.op).toBe('delete');
			});
		});

		it('should display the conversation view panel', async () => {
			const { queryChip } = setupSearchViewTest({ viewBy: 'conversation', query: 'hello' });

			const defaultConversation = getSoapConversation('123');
			const message1 = generateSoapConversationMessage('100', '123');
			const message2 = generateSoapConversationMessage('200', '123');
			const conversation = { ...defaultConversation, n: 2, m: [message1, message2] };
			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [conversation],
				more: false
			});
			createSoapAPIInterceptor<SearchConvRequest, SearchConvResponse>('SearchConv', {
				m: [message1, message2],
				more: false,
				offset: '0',
				orderBy: 'dateDesc'
			});
			const mockUseQuery = vi.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				ResultsHeader: resultsHeader,
				useDisableSearch: () => [false, noop]
			};

			setupTest(<SearchView {...searchViewProps} />, {
				initialEntries: ['/conversation/123']
			});

			expect(await screen.findByTestId('SearchConversationPanel-123')).toBeInTheDocument();
		});

		it('should call ConvActionRequest with operation "trash" when moving conversation to trash in selection mode', async () => {
			const { queryChip } = setupSearchViewTest({ viewBy: 'conversation', query: 'hello' });

			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [getSoapConversation('123')],
				more: false
			});
			const mockUseQuery = vi.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				ResultsHeader: resultsHeader,
				useDisableSearch: () => [false, noop]
			};
			vi.spyOn(hooks, 'useAppContext').mockReturnValue(fakeCounter());
			const { user } = setupTest(<SearchView {...searchViewProps} />);
			await waitAndMakeConversationVisible('123');
			const actionWrapper = await screen.findByTestId(`ConversationListItem-123`);
			await user.hover(actionWrapper);

			const itemAvatar = await screen.findByTestId('conversation-list-item-avatar-123');
			const avatar = within(itemAvatar).getByTestId('avatar');
			await act(async () => {
				user.click(avatar);
			});
			await within(itemAvatar).findByTestId('icon: Checkmark');
			const multipleSelectionPanel = await screen.findByTestId('MultipleSelectionActionPanel');
			const multipleSelectionTrashButton = await within(multipleSelectionPanel).findByRoleWithIcon(
				'button',
				{
					icon: TESTID_SELECTORS.icons.trash
				}
			);
			const apiInterceptor = createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>(
				'ConvAction',
				{
					action: {
						id: '123',
						op: 'trash'
					}
				}
			);
			await user.click(multipleSelectionTrashButton);
			const receivedRequest = await apiInterceptor;

			await act(async () => {
				expect(receivedRequest.action.id).toBe('123');
			});
			await act(async () => {
				expect(receivedRequest.action.op).toBe('trash');
			});
		});

		describe('multiple selection interactions', () => {
			const conversation1 = getSoapConversation('1', { t: '' });
			const conversation2 = getSoapConversation('2', { t: '' });
			const conversation3 = getSoapConversation('3', { t: '' });

			it('items should still be selected after a multiple selection action', async () => {
				const { queryChip } = setupSearchViewTest({ viewBy: 'conversation', query: 'hello' });

				const searchInterceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>(
					'Search',
					{
						c: [conversation1, conversation2, conversation3],
						more: false
					}
				);

				const convActionInterceptor = createSoapAPIInterceptor<
					ConvActionRequest,
					ConvActionResponse
				>('ConvAction', {
					action: {
						id: '1,2,3',
						op: 'tag'
					}
				});
				const mockUseQuery = vi.fn();
				mockUseQuery.mockReturnValue([[queryChip], noop]);
				const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
				const searchViewProps: SearchViewProps = {
					useQuery: mockUseQuery,
					ResultsHeader: resultsHeader,
					useDisableSearch: () => [false, noop]
				};
				useTagStore.setState({ tags });

				const { user } = setupTest(<SearchView {...searchViewProps} />);
				await waitFor(async () => searchInterceptor);
				expect(await screen.findByText('label.results_for')).toBeInTheDocument();
				await waitAndMakeConversationVisible('1');

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
				const multipleSelectionPanel = await screen.findByTestId('MultipleSelectionActionPanel');
				const multipleSelectionMoreVertical = await within(
					multipleSelectionPanel
				).findByRoleWithIcon('button', {
					icon: 'icon: MoreVertical'
				});
				await user.click(multipleSelectionMoreVertical);
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

				// verify that all conversations are still selected
				const deselectAllButtonAfterAction = screen.getByRole('button', {
					name: /label\.deselect_all/i
				});
				expect(deselectAllButtonAfterAction).toBeInTheDocument();

				// double check that all 3 conversations are still selected
				const totalItemsSelected = screen.getAllByTestId('icon: Checkmark');
				expect(totalItemsSelected).toHaveLength(3);
			});

			it('items should still be selected after a single conversation action on a unselected item', async () => {
				const { queryChip } = setupSearchViewTest({ viewBy: 'conversation', query: 'hello' });

				const searchInterceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>(
					'Search',
					{
						c: [conversation1, conversation2, conversation3],
						more: false
					}
				);
				const convActionInterceptor = createSoapAPIInterceptor<
					ConvActionRequest,
					ConvActionResponse
				>('ConvAction', {
					action: {
						id: '2',
						op: 'tag'
					}
				});
				const mockUseQuery = vi.fn();
				mockUseQuery.mockReturnValue([[queryChip], noop]);
				const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
				const searchViewProps: SearchViewProps = {
					useQuery: mockUseQuery,
					ResultsHeader: resultsHeader,
					useDisableSearch: () => [false, noop]
				};
				useTagStore.setState({ tags });

				const { user } = setupTest(<SearchView {...searchViewProps} />);
				await waitFor(async () => searchInterceptor);
				expect(await screen.findByText('label.results_for')).toBeInTheDocument();
				await waitAndMakeConversationVisible('1');

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

				// perform a single conversation action on the second conversation
				const listItem = screen.getByTestId('ConversationListItem-2');
				await user.hover(listItem);
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
				const selectAllButtonAfterAction = screen.getByRole('button', {
					name: /label\.select_all/i
				});
				expect(selectAllButtonAfterAction).toBeInTheDocument();

				// double check that 1 conversation is still selected
				const totalItemsSelectedAfterAction = screen.getAllByTestId('icon: Checkmark');
				expect(totalItemsSelectedAfterAction).toHaveLength(1);
			});

			it('items should still be selected after a single conversation action on a selected item', async () => {
				const { queryChip } = setupSearchViewTest({ viewBy: 'conversation', query: 'hello' });

				const searchInterceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>(
					'Search',
					{
						c: [conversation1, conversation2, conversation3],
						more: false
					}
				);
				const convActionInterceptor = createSoapAPIInterceptor<
					ConvActionRequest,
					ConvActionResponse
				>('ConvAction', {
					action: {
						id: '2',
						op: 'tag'
					}
				});
				const mockUseQuery = vi.fn();
				mockUseQuery.mockReturnValue([[queryChip], noop]);
				const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
				const searchViewProps: SearchViewProps = {
					useQuery: mockUseQuery,
					ResultsHeader: resultsHeader,
					useDisableSearch: () => [false, noop]
				};
				useTagStore.setState({ tags });

				const { user } = setupTest(<SearchView {...searchViewProps} />);
				await waitFor(async () => searchInterceptor);
				expect(await screen.findByText('label.results_for')).toBeInTheDocument();
				await waitAndMakeConversationVisible('1');

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

				// perform a single conversation action on the selected conversation
				const listItem = screen.getByTestId('ConversationListItem-1');
				await user.hover(listItem);
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
				const selectAllButtonAfterAction = screen.getByRole('button', {
					name: /label\.select_all/i
				});
				expect(selectAllButtonAfterAction).toBeInTheDocument();

				// double check that 1 conversation is still selected
				const totalItemsSelectedAfterAction = screen.getAllByTestId('icon: Checkmark');
				expect(totalItemsSelectedAfterAction).toHaveLength(1);
			});
		});
	});

	describe('view by messages', () => {
		it('should display messages when soap API fulfilled and settings is "display by message"', async () => {
			const { queryChip } = setupSearchViewTest({ viewBy: 'message', query: 'hello' });

			const interceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				m: [
					getSoapMessage('10', { su: 'message 1 Subject' }),
					getSoapMessage('11', { su: 'message 2 Subject' })
				],
				more: false
			});
			const mockUseQuery = vi.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				ResultsHeader: resultsHeader,
				useDisableSearch: () => [false, noop]
			};

			setupTest(<SearchView {...searchViewProps} />);

			await act(async () => {
				await interceptor;
			});

			expect(await screen.findByText('label.results_for')).toBeInTheDocument();

			await waitAndMakeMessageVisible('10');
			expect(await screen.findByTestId('MessageListItem-10')).toBeInTheDocument();
			expect(await screen.findByTestId('MessageListItem-11')).toBeInTheDocument();
		});

		it('should call MsgActionRequest with operation "trash" when moving message to trash in selection mode', async () => {
			const { queryChip } = setupSearchViewTest({ viewBy: 'message', query: 'hello' });

			const searchInterceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				m: [getSoapMessage('10', { su: 'message 1 Subject', f: 'u' })],
				more: false
			});
			const mockUseQuery = vi.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				ResultsHeader: resultsHeader,
				useDisableSearch: () => [false, noop]
			};
			vi.spyOn(hooks, 'useAppContext').mockReturnValue(fakeCounter());
			const { user } = setupTest(<SearchView {...searchViewProps} />);
			await waitFor(() => searchInterceptor);
			await waitAndMakeMessageVisible('10');
			const actionWrapper = await screen.findByTestId(`MessageListItem-10`);
			await user.hover(actionWrapper);

			const itemAvatar = await screen.findByTestId('message-list-item-avatar-10');
			const avatar = await within(itemAvatar).findByTestId('avatar');

			user.click(avatar);
			await within(itemAvatar).findByTestId('icon: Checkmark');
			const multipleSelectionPanel = await screen.findByTestId('MultipleSelectionActionPanel');
			const multipleSelectionTrashButton = await within(multipleSelectionPanel).findByRoleWithIcon(
				'button',
				{
					icon: TESTID_SELECTORS.icons.trash
				}
			);

			const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
				'MsgAction',
				{
					action: {
						id: '10',
						op: 'trash'
					}
				}
			);
			await user.click(multipleSelectionTrashButton);

			const receivedRequest = await apiInterceptor;
			expect(receivedRequest.action.id).toBe('10');
			expect(receivedRequest.action.op).toBe('trash');
		});
		it('should display the message view panel', async () => {
			const { queryChip } = setupSearchViewTest({ viewBy: 'message', query: 'hello' });

			const messageId = '10';
			const soapMessage = getSoapMessage(messageId, { su: 'message 1 Subject', f: 'u' });
			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				m: [soapMessage],
				more: false
			});

			createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>('GetMsg', {
				m: [soapMessage]
			});

			const mockUseQuery = vi.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				ResultsHeader: resultsHeader,
				useDisableSearch: () => [false, noop]
			};

			setupTest(<SearchView {...searchViewProps} />, {
				initialEntries: [`/message/${messageId}`]
			});

			expect(await screen.findByTestId(`SearchMessagePanel-${messageId}`)).toBeInTheDocument();
		});

		it('should open message preview when double-clicking message in list', async () => {
			const { queryChip } = setupSearchViewTest({ viewBy: 'message', query: 'hello' });

			const interceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				m: [
					getSoapMessage('10', { su: 'message 1 Subject' }),
					getSoapMessage('11', { su: 'message 2 Subject' })
				],
				more: false
			});

			const mockUseQuery = vi.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				ResultsHeader: resultsHeader,
				useDisableSearch: () => [false, noop]
			};

			const { user } = setupTest(<SearchView {...searchViewProps} />);

			await act(async () => {
				await interceptor;
			});

			expect(await screen.findByText('label.results_for')).toBeInTheDocument();

			await waitAndMakeMessageVisible('10');
			const messageContainer = await screen.findByTestId(`MessageListItem-10`);

			await act(async () => {
				user.hover(messageContainer);
			});

			const clickableMessage = await screen.findByTestId(`hover-container-10`);
			const response: MsgActionResponse = {
				action: {
					id: '123',
					op: 'trash'
				}
			};
			createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>('MsgAction', response);
			await act(async () => {
				user.dblClick(clickableMessage);
			});

			expect(window.open).toHaveBeenCalledTimes(1);
		});

		it('should not show empty email content when re-executing a search with a different word but relates to same email', async () => {
			const { queryChip } = setupSearchViewTest({ viewBy: 'message', query: 'hello' });

			const messageId = '10';
			const soapMessage = getSoapMessage(messageId, { su: 'message 1 Subject', f: 'u' });

			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				m: [soapMessage],
				more: false
			});

			createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>('GetMsg', {
				m: [soapMessage]
			});

			const mockUseQuery = vi.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				ResultsHeader: resultsHeader,
				useDisableSearch: () => [false, noop]
			};

			const { rerender } = setupTest(<SearchView {...searchViewProps} />, {
				initialEntries: [`/message/${messageId}`]
			});

			expect(await screen.findByTestId(`SearchMessagePanel-${messageId}`)).toBeInTheDocument();

			// Re-execute search with a different word but related to the same email
			const updatedSearchSettings = setupSearchViewTest({ viewBy: 'message', query: 'subject' });
			const { queryChip: updatedQueryChip } = updatedSearchSettings;

			rerender(
				<SearchView {...searchViewProps} useQuery={(): any => [[updatedQueryChip], noop]} />
			);

			expect(await screen.findByTestId(`SearchMessagePanel-${messageId}`)).toBeInTheDocument();
		});

		describe('multiple selection interactions', () => {
			const message1 = getSoapMessage('1', { t: '' });
			const message2 = getSoapMessage('2', { t: '' });
			const message3 = getSoapMessage('3', { t: '' });

			it('items should still be selected after a multiple selection action', async () => {
				const { queryChip } = setupSearchViewTest({ viewBy: 'message', query: 'hello' });

				const searchInterceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>(
					'Search',
					{
						m: [message1, message2, message3],
						more: false
					}
				);

				const msgActionInterceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
					'MsgAction',
					{
						action: {
							id: '1,2,3',
							op: 'tag'
						}
					}
				);
				const mockUseQuery = vi.fn();
				mockUseQuery.mockReturnValue([[queryChip], noop]);
				const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
				const searchViewProps: SearchViewProps = {
					useQuery: mockUseQuery,
					ResultsHeader: resultsHeader,
					useDisableSearch: () => [false, noop]
				};
				useTagStore.setState({ tags });

				const { user } = setupTest(<SearchView {...searchViewProps} />);
				await waitFor(async () => searchInterceptor);
				expect(await screen.findByText('label.results_for')).toBeInTheDocument();
				await waitAndMakeMessageVisible('1');

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
				const multipleSelectionPanel = await screen.findByTestId('MultipleSelectionActionPanel');
				const multipleSelectionMoreVertical = await within(
					multipleSelectionPanel
				).findByRoleWithIcon('button', {
					icon: 'icon: MoreVertical'
				});
				await user.click(multipleSelectionMoreVertical);
				const actionsDropdown = screen.getByTestId('dropdown-popper-list');
				expect(within(actionsDropdown).getByText(/tag/i)).toBeVisible();
				await user.hover(within(actionsDropdown).getByText(/tag/i));
				const tagActionIcon = screen.getByTestId('tag-item-2291');
				const tagActionButton = within(tagActionIcon).getByTestId('icon: Square');
				await user.click(tagActionButton);
				const request = await waitFor(() => msgActionInterceptor);
				await act(async () => {
					expect(request.action.op).toBe('tag');
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
				const { queryChip } = setupSearchViewTest({ viewBy: 'message', query: 'hello' });

				const searchInterceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>(
					'Search',
					{
						m: [message1, message2, message3],
						more: false
					}
				);

				const msgActionInterceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
					'MsgAction',
					{
						action: {
							id: '2',
							op: 'tag'
						}
					}
				);
				const mockUseQuery = vi.fn();
				mockUseQuery.mockReturnValue([[queryChip], noop]);
				const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
				const searchViewProps: SearchViewProps = {
					useQuery: mockUseQuery,
					ResultsHeader: resultsHeader,
					useDisableSearch: () => [false, noop]
				};
				useTagStore.setState({ tags });

				const { user } = setupTest(<SearchView {...searchViewProps} />);
				await waitFor(async () => searchInterceptor);
				expect(await screen.findByText('label.results_for')).toBeInTheDocument();
				await waitAndMakeMessageVisible('1');

				// select the first message
				const actionWrapper = await screen.findByTestId(`MessageListItem-1`);
				await user.hover(actionWrapper);
				const itemAvatar = await screen.findByTestId('message-list-item-avatar-1');
				const avatar = within(itemAvatar).getByTestId('avatar');
				await act(async () => {
					await user.click(avatar);
				});
				const totalItemsSelected = screen.getAllByTestId('icon: Checkmark');
				expect(totalItemsSelected).toHaveLength(1);

				// perform a single message action on the second message
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
				const request = await waitFor(() => msgActionInterceptor);
				await act(async () => {
					expect(request.action.op).toBe('tag');
				});

				// await for the success message to appear
				const successMessage = await screen.findByText(/tag applied/);
				await act(async () => {
					expect(successMessage).toBeInTheDocument();
				});

				// verify that selection mode is still on
				const selectAllButtonAfterAction = screen.getByRole('button', {
					name: /label\.select_all/i
				});
				expect(selectAllButtonAfterAction).toBeInTheDocument();

				// double check that 1 messages is still selected
				const totalItemsSelectedAfterAction = screen.getAllByTestId('icon: Checkmark');
				expect(totalItemsSelectedAfterAction).toHaveLength(1);
			});
			it('items should still be selected after a single message action on a selected item', async () => {
				const { queryChip } = setupSearchViewTest({ viewBy: 'message', query: 'hello' });

				const searchInterceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>(
					'Search',
					{
						m: [message1, message2, message3],
						more: false
					}
				);

				const msgActionInterceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
					'MsgAction',
					{
						action: {
							id: '1',
							op: 'tag'
						}
					}
				);
				const mockUseQuery = vi.fn();
				mockUseQuery.mockReturnValue([[queryChip], noop]);
				const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
				const searchViewProps: SearchViewProps = {
					useQuery: mockUseQuery,
					ResultsHeader: resultsHeader,
					useDisableSearch: () => [false, noop]
				};
				useTagStore.setState({ tags });

				const { user } = setupTest(<SearchView {...searchViewProps} />);
				await waitFor(async () => searchInterceptor);
				expect(await screen.findByText('label.results_for')).toBeInTheDocument();
				await waitAndMakeMessageVisible('1');

				// select the first message
				const actionWrapper = await screen.findByTestId(`MessageListItem-1`);
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
				const request = await waitFor(() => msgActionInterceptor);
				await act(async () => {
					expect(request.action.op).toBe('tag');
				});

				// await for the success message to appear
				const successMessage = await screen.findByText(/tag applied/);
				await act(async () => {
					expect(successMessage).toBeInTheDocument();
				});

				// verify that selection mode is still on
				const selectAllButtonAfterAction = screen.getByRole('button', {
					name: /label\.select_all/i
				});
				expect(selectAllButtonAfterAction).toBeInTheDocument();

				// double check that 1 messages is still selected
				const totalItemsSelectedAfterAction = screen.getAllByTestId('icon: Checkmark');
				expect(totalItemsSelectedAfterAction).toHaveLength(1);
			});
		});
	});

	it('should not call search API if query empty', async () => {
		const searchSpy = vi.spyOn(searchSoapApi, 'searchSoapApi');
		const mockUseQuery = vi.fn();
		mockUseQuery.mockReturnValue([[], noop]);

		const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
		const searchViewProps: SearchViewProps = {
			useQuery: mockUseQuery,
			ResultsHeader: resultsHeader,
			useDisableSearch: () => [false, noop]
		};

		setupTest(<SearchView {...searchViewProps} />);

		const advancedFiltersButton = screen.getByRole('button', {
			name: 'Advanced Filters'
		});

		expect(advancedFiltersButton).toBeVisible();
		expect(advancedFiltersButton).toBeEnabled();
		expect(searchSpy).not.toHaveBeenCalled();
	});

	it('should route to message panel when clicking message in list', async () => {
		const navigate = vi.fn();
		(reactRouterDom.useNavigate as Mock).mockReturnValue(navigate);
		const interceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			m: [
				getSoapMessage('10', { su: 'message 1 Subject' }),
				getSoapMessage('11', { su: 'message 2 Subject' })
			],
			more: false
		});
		const queryChip: QueryChip = {
			hasAvatar: false,
			id: '0',
			label: 'ciao'
		};
		const customSettings: Partial<AccountSettings> = {
			prefs: {
				zimbraPrefGroupMailBy: 'message'
			}
		};
		const mockUseQuery = vi.fn();
		mockUseQuery.mockReturnValue([[queryChip], noop]);
		const settings = generateSettings(customSettings);
		vi.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
		const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
		const searchViewProps: SearchViewProps = {
			useQuery: mockUseQuery,
			ResultsHeader: resultsHeader,
			useDisableSearch: () => [false, noop]
		};

		vi.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
		const { user } = setupTest(<SearchView {...searchViewProps} />);

		await act(async () => {
			await interceptor;
		});

		expect(await screen.findByText('label.results_for')).toBeInTheDocument();

		await waitAndMakeMessageVisible('10');
		const messageContainer = await screen.findByTestId(`MessageListItem-10`);

		await act(async () => {
			await user.hover(messageContainer);
		});

		const clickableMessage = await screen.findByTestId(`hover-container-10`);
		createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
			'MsgAction',
			aRandomMsgActionResponse
		);
		await act(async () => {
			user.click(clickableMessage);
		});
		expect(navigate).toHaveBeenCalledWith('../message/10', { replace: true });
		expect(navigate).toHaveBeenCalledTimes(1);
	});

	it('should call onSearchConfirm with correct parameters when advanced filters are applied', async () => {
		const queryChip: QueryChip = {
			hasAvatar: false,
			id: '0',
			label: 'test'
		};
		const mockUpdateQuery = vi.fn();
		const mockUseQuery = vi.fn();
		mockUseQuery.mockReturnValue([[queryChip], mockUpdateQuery]);

		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [getSoapConversation('123')],
			more: false
		});

		const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
		const searchViewProps: SearchViewProps = {
			useQuery: mockUseQuery,
			ResultsHeader: resultsHeader,
			useDisableSearch: () => [false, noop]
		};

		const { user } = setupTest(<SearchView {...searchViewProps} />);

		await screen.findByText('label.results_for');

		const advancedFiltersButton = screen.getByRole('button', {
			name: 'Advanced Filters'
		});
		await user.click(advancedFiltersButton);

		await screen.findByText('Advanced Filters');

		const searchButton = screen.getByRole('button', {
			name: 'action.search'
		});
		await user.click(searchButton);

		expect(mockUpdateQuery).toHaveBeenCalled();
	});

	it('should not show special character warning for chips with queryChipsToAdvancedFiltersValue', async () => {
		const queryChipWithAdvancedFilters: any = {
			hasAvatar: false,
			id: '0',
			label: 'test!',
			value: 'test!',
			queryChipsToAdvancedFiltersValue: {
				folderId: { value: 'LOCAL_ROOT', label: 'in:Home' }
			}
		};
		const mockUpdateQuery = vi.fn();
		const mockUseQuery = vi.fn();
		mockUseQuery.mockReturnValue([[queryChipWithAdvancedFilters], mockUpdateQuery]);

		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [getSoapConversation('123')],
			more: false
		});

		const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
		const searchViewProps: SearchViewProps = {
			useQuery: mockUseQuery,
			ResultsHeader: resultsHeader,
			useDisableSearch: () => [false, noop]
		};

		setupTest(<SearchView {...searchViewProps} />);

		await screen.findByText('label.results_for');

		expect(screen.queryByText('label.invalid_query')).not.toBeInTheDocument();
	});

	it('should show special character warning for chips without queryChipsToAdvancedFiltersValue', async () => {
		const queryChipWithSpecialChars: QueryChip = {
			hasAvatar: false,
			id: '0',
			label: 'test!',
			value: 'test!'
		};
		const mockUpdateQuery = vi.fn();
		const mockUseQuery = vi.fn();
		mockUseQuery.mockReturnValue([[queryChipWithSpecialChars], mockUpdateQuery]);

		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [getSoapConversation('123')],
			more: false
		});

		const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
		const searchViewProps: SearchViewProps = {
			useQuery: mockUseQuery,
			ResultsHeader: resultsHeader,
			useDisableSearch: () => [false, noop]
		};

		setupTest(<SearchView {...searchViewProps} />);

		await screen.findByText('label.invalid_query');

		expect(screen.getByText('label.invalid_query')).toBeInTheDocument();
	});
});
