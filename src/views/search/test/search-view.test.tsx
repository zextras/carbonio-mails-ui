/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { act, waitFor } from '@testing-library/react';
import type { QueryChip, SearchViewProps } from '@zextras/carbonio-search-ui';
import * as hooks from '@zextras/carbonio-shell-ui';
import { AccountSettings, ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';
import * as reactRouterDom from 'react-router-dom';

import * as searchSoapApi from '../../../api/search-soap-api';
import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { generateSettings } from '../../../carbonio-ui-commons/test/mocks/settings/settings-generator';
import { buildSoapErrorResponseBody } from '../../../carbonio-ui-commons/test/mocks/utils/soap';
import {
	screen,
	makeListItemsVisible,
	setupTest,
	within
} from '../../../carbonio-ui-commons/test/test-setup';
import * as useSelection from '../../../hooks/use-selection';
import { TESTID_SELECTORS } from '../../../tests/constants';
import { generateSoapConversationMessage } from '../../../tests/generators/api';
import {
	ConvActionRequest,
	ConvActionResponse,
	GetMsgRequest,
	GetMsgResponse,
	MsgActionRequest,
	MsgActionResponse,
	SearchConvRequest,
	SearchConvResponse,
	SearchRequest,
	SearchResponse,
	SoapConversation,
	SoapIncompleteMessage,
	SoapMailMessage
} from '../../../types';
import SearchView from '../search-view';

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useNavigate: jest.fn()
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
	jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
	return {
		settings,
		queryChip
	};
};
const mockedUseSelection: ReturnType<typeof useSelection.useSelection> = {
	selectAll: jest.fn(),
	selected: { '10': true },
	toggle: jest.fn(),
	isSelectModeOn: false,
	setIsSelectModeOn: jest.fn(),
	deselectAll: jest.fn(),
	isAllSelected: false,
	selectAllModeOff: jest.fn()
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

describe('SearchView', () => {
	beforeAll(() => {
		jest.spyOn(reactRouterDom, 'useNavigate').mockReturnValue(jest.fn());
	});

	describe('view by conversations', () => {
		it('should display label "Results for" when soap API fulfilled', async () => {
			const { queryChip } = setupSearchViewTest({ viewBy: 'conversation', query: 'hello' });

			const mockUseQuery = jest.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
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
			const mockUseQuery = jest.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);

			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
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

			const mockUseQuery = jest.fn();
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
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
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
			const navigate = jest.fn();
			(reactRouterDom.useNavigate as jest.Mock).mockReturnValue(navigate);
			const { queryChip } = setupSearchViewTest({ viewBy: 'conversation', query: 'hello' });
			const mockUseQuery = jest.fn();
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
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
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
			const mockUseQuery = jest.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				useDisableSearch: () => [false, noop],
				ResultsHeader: (props: { label: string }): ReactElement => <>{props.label}</>
			};
			const { count, setCount } = fakeCounter();
			jest.spyOn(hooks, 'useAppContext').mockReturnValue({ count, setCount });

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

			const mockUseQuery = jest.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
			};
			jest.spyOn(hooks, 'useAppContext').mockReturnValue(fakeCounter());

			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [getSoapConversation('123', { l: FOLDERS.TRASH })],
				more: false
			});
			const { user } = setupTest(<SearchView {...searchViewProps} />);
			await waitAndMakeConversationVisible('123');
			const actionWrapper = await screen.findByTestId(`ConversationListItem-123`);
			await user.hover(actionWrapper);
			expect(actionWrapper).toBeVisible();

			const hoverBar = await screen.findByTestId('primary-actions-bar-123');
			expect(hoverBar).toBeVisible();

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
			const mockUseQuery = jest.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
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
			const mockUseQuery = jest.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
			};
			jest.spyOn(hooks, 'useAppContext').mockReturnValue(fakeCounter());
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
			const mockUseQuery = jest.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
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
			const mockUseQuery = jest.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
			};
			jest.spyOn(hooks, 'useAppContext').mockReturnValue(fakeCounter());
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

			const mockUseQuery = jest.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
			};

			setupTest(<SearchView {...searchViewProps} />, {
				initialEntries: [`/message/${messageId}`]
			});

			// await waitFor(() => searchInterceptor);
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
			jest.spyOn(useSelection, 'useSelection').mockReturnValue(mockedUseSelection);

			const mockUseQuery = jest.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
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
		it('should call MsgActionRequest with the correct parameters when user click on a message', async () => {
			const { queryChip } = setupSearchViewTest({ viewBy: 'message', query: 'hello' });

			const searchInterceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				m: [getSoapMessage('10', { su: 'message 1 Subject', f: 'u' })],
				more: false
			});
			const msgActionInterceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
				'MsgAction',
				aRandomMsgActionResponse
			);

			const mockUseQuery = jest.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
			};

			jest.spyOn(useSelection, 'useSelection').mockReturnValue(mockedUseSelection);
			const { user } = setupTest(<SearchView {...searchViewProps} />);
			await waitFor(async () => searchInterceptor);

			expect(await screen.findByText('label.results_for')).toBeInTheDocument();

			await waitAndMakeMessageVisible('10');
			const messageContainer = await screen.findByTestId(`MessageListItem-10`);
			await user.hover(messageContainer);
			const hoverContainer = await screen.findByTestId('hover-container-10');
			user.click(hoverContainer);
			const requestParameter = await waitFor(async () => msgActionInterceptor);

			await waitFor(() => expect(requestParameter.action).toEqual({ id: '10', op: 'read' }));
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

			const mockUseQuery = jest.fn();
			mockUseQuery.mockReturnValue([[queryChip], noop]);
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: mockUseQuery,
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
			};

			const { rerender } = setupTest(<SearchView {...searchViewProps} />, {
				initialEntries: [`/message/${messageId}`]
			});

			expect(await screen.findByTestId(`SearchMessagePanel-${messageId}`)).toBeInTheDocument();

			// Re-execute search with a different word but related to the same email
			const updatedSearchSettings = setupSearchViewTest({ viewBy: 'message', query: 'subject' });
			const { queryChip: updatedQueryChip } = updatedSearchSettings;

			rerender(<SearchView {...searchViewProps} useQuery={() => [[updatedQueryChip], noop]} />);

			expect(await screen.findByTestId(`SearchMessagePanel-${messageId}`)).toBeInTheDocument();
		});
	});

	it('should display a disabled Advanced Filters button when SearchDisabled is true', async () => {
		const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
		const searchViewProps: SearchViewProps = {
			useQuery: () => [[], noop],
			useDisableSearch: () => [true, noop],
			ResultsHeader: resultsHeader
		};

		setupTest(<SearchView {...searchViewProps} />);
		const advancedFiltersButton = screen.getByRole('button', {
			name: /label\.single_advanced_filter/i
		});
		expect(advancedFiltersButton).toBeVisible();
		expect(advancedFiltersButton).toBeDisabled();
	});

	it('should not call search API if query empty', async () => {
		const searchSpy = jest.spyOn(searchSoapApi, 'searchSoapApi');
		const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
		const searchViewProps: SearchViewProps = {
			useQuery: () => [[], noop],
			useDisableSearch: () => [false, noop],
			ResultsHeader: resultsHeader
		};

		setupTest(<SearchView {...searchViewProps} />);

		const advancedFiltersButton = screen.getByRole('button', {
			name: /label\.single_advanced_filter/i
		});
		expect(advancedFiltersButton).toBeVisible();
		expect(advancedFiltersButton).toBeEnabled();
		expect(searchSpy).not.toHaveBeenCalled();
	});

	it('should call setSearchDisabled button if Search API fails with mail.QUERY_PARSE_ERROR', async () => {
		const interceptor = createSoapAPIInterceptor<SearchRequest, ErrorSoapBodyResponse>(
			'Search',
			buildSoapErrorResponseBody({
				detailCode: 'mail.QUERY_PARSE_ERROR',
				reason: 'Failed to execute search'
			})
		);
		createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>('GetMsg', {
			m: {}
		} as GetMsgResponse);

		const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
		const setSearchDisabled = jest.fn();
		const queryChip: QueryChip = {
			hasAvatar: false,
			id: '0',
			label: 'ciao'
		};

		const mockUseQuery = jest.fn();
		mockUseQuery.mockReturnValue([[queryChip], noop]);
		const searchViewProps: SearchViewProps = {
			useQuery: mockUseQuery,
			useDisableSearch: () => [false, setSearchDisabled],
			ResultsHeader: resultsHeader
		};

		setupTest(<SearchView {...searchViewProps} />);
		await interceptor;
		await waitFor(() => expect(setSearchDisabled).toHaveBeenCalled());
	});

	it('should not call setSearchDisabled button if Search API fails with another error', async () => {
		const interceptor = createSoapAPIInterceptor<SearchRequest, ErrorSoapBodyResponse>(
			'Search',
			buildSoapErrorResponseBody({
				detailCode: 'Other code',
				reason: 'Failed to execute search'
			})
		);
		const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
		const setSearchDisabled = jest.fn();
		const queryChip: QueryChip = {
			hasAvatar: false,
			id: '0',
			label: 'ciao'
		};
		const searchViewProps: SearchViewProps = {
			useQuery: () => [[queryChip], noop],
			useDisableSearch: () => [false, setSearchDisabled],
			ResultsHeader: resultsHeader
		};

		setupTest(<SearchView {...searchViewProps} />);

		await interceptor;
		act(() => {
			jest.advanceTimersByTime(10_000);
		});

		expect(setSearchDisabled).not.toHaveBeenCalled();
	});

	it('should route to message panel when clicking message in list', async () => {
		const navigate = jest.fn();
		(reactRouterDom.useNavigate as jest.Mock).mockReturnValue(navigate);
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
		const mockUseQuery = jest.fn();
		mockUseQuery.mockReturnValue([[queryChip], noop]);
		const settings = generateSettings(customSettings);
		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
		const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
		const searchViewProps: SearchViewProps = {
			useQuery: mockUseQuery,
			useDisableSearch: () => [false, noop],
			ResultsHeader: resultsHeader
		};

		jest.spyOn(useSelection, 'useSelection').mockReturnValue(mockedUseSelection);
		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
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
});
