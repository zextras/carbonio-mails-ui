/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { act, waitFor } from '@testing-library/react';
import * as hooks from '@zextras/carbonio-shell-ui';
import {
	AccountSettings,
	ErrorSoapBodyResponse,
	QueryChip,
	SearchViewProps
} from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';

import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { generateSettings } from '../../../carbonio-ui-commons/test/mocks/settings/settings-generator';
import { buildSoapErrorResponseBody } from '../../../carbonio-ui-commons/test/mocks/utils/soap';
import {
	screen,
	makeListItemsVisible,
	setupTest,
	within
} from '../../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS } from '../../../constants';
import * as search from '../../../store/actions/search';
import {
	setSearchResultsByConversation,
	updateConversationStatus,
	setMessages
} from '../../../store/zustand/search/store';
import { TESTID_SELECTORS } from '../../../tests/constants';
import { generateConversation } from '../../../tests/generators/generateConversation';
import { generateMessage } from '../../../tests/generators/generateMessage';
import { generateStore } from '../../../tests/generators/store';
import {
	ConvActionRequest,
	ConvActionResponse,
	ExtraWindowsContextType,
	MsgActionRequest,
	MsgActionResponse,
	SearchRequest,
	SearchResponse,
	SoapConversation,
	SoapIncompleteMessage,
	SoapMailMessage
} from '../../../types';
import * as externalWindowManager from '../../app/extra-windows/global-extra-window-manager';
import SearchView from '../search-view';

jest.mock('', () => ({
	...jest.requireActual('react-router-dom'),
	useLocation: jest.fn()
}));

type SetupTest = {
	query: string;
	viewBy: 'message' | 'conversation';
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const setupSearchViewTest = ({ query, viewBy }: Partial<SetupTest>) => {
	const store = generateStore();
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
		store,
		settings,
		queryChip
	};
};

function getSoapConversationMessage(messageId: string, conversationId: string): SoapMailMessage {
	return {
		id: messageId,
		cid: conversationId,
		e: [],
		su: 'conversations Subject',
		s: 71116,
		l: '2',
		f: 'au',
		fr: 'fragment',
		mp: [],
		d: 1717752296000
	};
}

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
	initialData?: Partial<SoapIncompleteMessage>
): SoapMailMessage {
	return {
		id: messageId,
		cid: '1',
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

function getSoapConversation(id: string): SoapConversation {
	return {
		id,
		n: 1,
		u: 1,
		f: 'flag',
		tn: 'tag names',
		d: 123,
		m: [getSoapMessage('123')],
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
	describe('view by conversations', () => {
		let store: ReturnType<typeof generateStore>;
		let queryChip: QueryChip;
		beforeEach(() => {
			const searchSettings = setupSearchViewTest({ viewBy: 'conversation', query: 'hello' });
			store = searchSettings.store;
			queryChip = searchSettings.queryChip;
		});

		it('should display label "Results for" when soap API fulfilled', async () => {
			const searchInterceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [getSoapConversation('123')],
				more: false
			});
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: () => [[queryChip], noop],
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
			};

			setupTest(<SearchView {...searchViewProps} />, {
				store
			});
			await searchInterceptor;

			expect(await screen.findByText('label.results_for')).toBeInTheDocument();
		});

		it('should display conversation subject when soap API fulfilled and settings is "display by conversation"', async () => {
			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [getSoapConversation('123')],
				more: false
			});
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: () => [[queryChip], noop],
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
			};

			setupTest(<SearchView {...searchViewProps} />, {
				store
			});
			await waitAndMakeConversationVisible('123');
			const conversation = await screen.findByText('conversations Subject');
			expect(conversation).toBeInTheDocument();
		});

		it('should display the number of messages in a conversation when soap API fulfilled', async () => {
			const message1 = getSoapConversationMessage('100', '123');
			const message2 = getSoapConversationMessage('200', '123');
			const conversation = { ...getSoapConversation('123'), n: 2, m: [message1, message2] };
			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [conversation],
				more: false
			});
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: () => [[queryChip], noop],
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
			};

			setupTest(<SearchView {...searchViewProps} />, {
				store
			});
			await waitAndMakeConversationVisible('123');
			expect(await screen.findByText('conversations Subject')).toBeInTheDocument();
			const chevron = await screen.findByTestId(`ToggleExpand`);
			const badge = await screen.findByTestId(`conversation-messages-count-${conversation.id}`);
			expect(chevron).toBeInTheDocument();
			expect(badge).toBeInTheDocument();
			expect(badge).toHaveTextContent('2');
		});

		it('should change the route when clicking a conversation in the list', async () => {
			const defaultConversation = getSoapConversation('123');
			const message1 = getSoapConversationMessage('100', '123');
			const message2 = getSoapConversationMessage('200', '123');

			const conversation = { ...defaultConversation, n: 2, m: [message1, message2] };
			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [conversation],
				more: false
			});
			const spyPushHistory = jest.spyOn(hooks, 'pushHistory');

			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: () => [[queryChip], noop],
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
			};

			const { user } = setupTest(<SearchView {...searchViewProps} />, {
				store
			});
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
			expect(spyPushHistory).toBeCalledWith('conversation/123');
		});

		it('should display conversation as selected when user clicks on avatar', async () => {
			const message = generateMessage({ id: '1' });
			setSearchResultsByConversation(
				[generateConversation({ id: '123', messages: [message] })],
				false
			);
			setMessages([message]);
			updateConversationStatus('123', API_REQUEST_STATUS.fulfilled);
			const searchViewProps: SearchViewProps = {
				useQuery: () => [[], noop],
				useDisableSearch: () => [false, noop],
				ResultsHeader: (props: { label: string }): ReactElement => <>{props.label}</>
			};
			const { count, setCount } = fakeCounter();
			jest.spyOn(hooks, 'useAppContext').mockReturnValue({ count, setCount });

			const { user } = setupTest(<SearchView {...searchViewProps} />, {
				store
			});
			await waitAndMakeConversationVisible('123');
			const itemAvatar = await screen.findByTestId('conversation-list-item-avatar-123');
			const avatar = within(itemAvatar).getByTestId('avatar');
			await act(async () => {
				await user.click(avatar);
			});

			expect(await within(itemAvatar).findByTestId('icon: Checkmark')).toBeVisible();
		});

		it('should call ConvActionRequest with operation "trash" when moving conversation to trash in selection mode', async () => {
			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				c: [getSoapConversation('123')],
				more: false
			});
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: () => [[queryChip], noop],
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
			};
			jest.spyOn(hooks, 'useAppContext').mockReturnValue(fakeCounter());
			const { user } = setupTest(<SearchView {...searchViewProps} />, {
				store
			});
			await waitAndMakeConversationVisible('123');
			const itemAvatar = await screen.findByTestId('conversation-list-item-avatar-123');
			const avatar = within(itemAvatar).getByTestId('avatar');
			await act(async () => {
				await user.click(avatar);
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
			await act(async () => {
				await user.click(multipleSelectionTrashButton);
			});

			const receivedRequest = await apiInterceptor;
			expect(receivedRequest.action.id).toBe('123');
			expect(receivedRequest.action.op).toBe('trash');
		});
	});

	describe('view by messages', () => {
		let store: ReturnType<typeof generateStore>;
		let queryChip: QueryChip;
		beforeEach(() => {
			const searchSettings = setupSearchViewTest({ viewBy: 'message', query: 'hello' });
			store = searchSettings.store;
			queryChip = searchSettings.queryChip;
		});
		it('should display messages when soap API fulfilled and settings is "display by message"', async () => {
			const interceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				m: [
					getSoapMessage('10', { su: 'message 1 Subject' }),
					getSoapMessage('11', { su: 'message 2 Subject' })
				],
				more: false
			});
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: () => [[queryChip], noop],
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
			};

			setupTest(<SearchView {...searchViewProps} />, {
				store
			});

			await act(async () => {
				await interceptor;
			});

			expect(await screen.findByText('label.results_for')).toBeInTheDocument();

			await waitAndMakeMessageVisible('10');
			expect(await screen.findByTestId('MessageListItem-10')).toBeInTheDocument();
			expect(await screen.findByTestId('MessageListItem-11')).toBeInTheDocument();
		});

		it('should call MsgActionRequest with the correct parameters when user click on a message', async () => {
			const searchInterceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				m: [getSoapMessage('10', { su: 'message 1 Subject', f: 'u' })],
				more: false
			});
			const msgActionInterceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');

			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: () => [[queryChip], noop],
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
			};
			const { user } = setupTest(<SearchView {...searchViewProps} />, {
				store
			});
			await act(async () => {
				await searchInterceptor;
			});

			expect(await screen.findByText('label.results_for')).toBeInTheDocument();

			await waitAndMakeMessageVisible('10');
			const messageContainer = await screen.findByTestId(`MessageListItem-10`);
			await act(async () => {
				await user.hover(messageContainer);
			});
			const hoverContainer = await screen.findByTestId('hover-container-10');
			act(() => {
				user.click(hoverContainer);
			});
			const requestParameter = await msgActionInterceptor;

			expect(requestParameter.action).toEqual({ id: '10', op: 'read' });
		});

		it('should open message preview when double-clicking message in list', async () => {
			const interceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				m: [
					getSoapMessage('10', { su: 'message 1 Subject' }),
					getSoapMessage('11', { su: 'message 2 Subject' })
				],
				more: false
			});
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: () => [[queryChip], noop],
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
			};
			const spyUseGlobalExternalWindowManager = jest.spyOn(
				externalWindowManager,
				'useGlobalExtraWindowManager'
			);
			const mockCreateWindow = jest.fn();
			const context: ExtraWindowsContextType = {
				createWindow: mockCreateWindow
			};
			spyUseGlobalExternalWindowManager.mockReturnValue(context);
			const { user } = setupTest(<SearchView {...searchViewProps} />, {
				store
			});

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
			await act(async () => {
				await user.dblClick(clickableMessage);
			});
			expect(mockCreateWindow).toBeCalledTimes(1);
		});

		it('should call MsgActionRequest with operation "trash" when moving message to trash in selection mode', async () => {
			createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
				m: [getSoapMessage('10', { su: 'message 1 Subject' })],
				more: false
			});
			const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
			const searchViewProps: SearchViewProps = {
				useQuery: () => [[queryChip], noop],
				useDisableSearch: () => [false, noop],
				ResultsHeader: resultsHeader
			};
			jest.spyOn(hooks, 'useAppContext').mockReturnValue(fakeCounter());
			const { user } = setupTest(<SearchView {...searchViewProps} />, {
				store
			});
			await waitAndMakeMessageVisible('10');
			const itemAvatar = await screen.findByTestId('message-list-item-avatar-10');
			const avatar = within(itemAvatar).getByTestId('avatar');
			await act(async () => {
				await user.click(avatar);
			});
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
			await act(async () => {
				await user.click(multipleSelectionTrashButton);
			});

			const receivedRequest = await apiInterceptor;
			expect(receivedRequest.action.id).toBe('10');
			expect(receivedRequest.action.op).toBe('trash');
		});
	});

	it('should display a disabled Advanced Filters button when SearchDisabled is true', async () => {
		const store = generateStore();

		const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
		const searchViewProps: SearchViewProps = {
			useQuery: () => [[], noop],
			useDisableSearch: () => [true, noop],
			ResultsHeader: resultsHeader
		};

		setupTest(<SearchView {...searchViewProps} />, {
			store
		});
		const advancedFiltersButton = screen.getByRole('button', {
			name: /label\.single_advanced_filter/i
		});
		expect(advancedFiltersButton).toBeVisible();
		expect(advancedFiltersButton).toBeDisabled();
	});

	it('should not call search API if query empty', async () => {
		const store = generateStore();
		const spySearch = jest.spyOn(search, 'search');
		const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
		const searchViewProps: SearchViewProps = {
			useQuery: () => [[], noop],
			useDisableSearch: () => [false, noop],
			ResultsHeader: resultsHeader
		};

		setupTest(<SearchView {...searchViewProps} />, {
			store
		});

		const advancedFiltersButton = screen.getByRole('button', {
			name: /label\.single_advanced_filter/i
		});
		expect(advancedFiltersButton).toBeVisible();
		expect(advancedFiltersButton).toBeEnabled();
		expect(spySearch).not.toBeCalled();
	});

	it('should call setSearchDisabled button if Search API fails with mail.QUERY_PARSE_ERROR', async () => {
		const store = generateStore();
		const interceptor = createSoapAPIInterceptor<SearchRequest, ErrorSoapBodyResponse>(
			'Search',
			buildSoapErrorResponseBody({
				detailCode: 'mail.QUERY_PARSE_ERROR',
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

		setupTest(<SearchView {...searchViewProps} />, {
			store
		});
		await interceptor;
		await waitFor(() => expect(setSearchDisabled).toBeCalled());
	});

	it('should not call setSearchDisabled button if Search API fails with another error', async () => {
		const store = generateStore();
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

		setupTest(<SearchView {...searchViewProps} />, {
			store
		});

		await interceptor;
		act(() => {
			jest.advanceTimersByTime(10_000);
		});

		expect(setSearchDisabled).not.toBeCalled();
	});

	it('should route to message panel when clicking message in list', async () => {
		const store = generateStore();
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
		const settings = generateSettings(customSettings);
		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);

		const resultsHeader = (props: { label: string }): ReactElement => <>{props.label}</>;
		const searchViewProps: SearchViewProps = {
			useQuery: () => [[queryChip], noop],
			useDisableSearch: () => [false, noop],
			ResultsHeader: resultsHeader
		};
		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
		const spyReplaceHistory = jest.spyOn(hooks, 'replaceHistory');
		const { user } = setupTest(<SearchView {...searchViewProps} />, {
			store
		});

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
		await act(async () => {
			await user.click(clickableMessage);
		});
		expect(spyReplaceHistory).toBeCalledWith('/message/10');
	});
});
