/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { faker } from '@faker-js/faker';
import { act, screen, waitFor } from '@testing-library/react';
import * as hooks from '@zextras/carbonio-shell-ui';
import { noop, times } from 'lodash';
import { useLocation } from 'react-router-dom';

import { FOLDER_VIEW } from '../../carbonio-ui-commons/constants';
import { FOLDERS } from '../../carbonio-ui-commons/constants/folders';
import { getFolder } from '../../carbonio-ui-commons/store/zustand/folder';
import { getTag, getTags } from '../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { createSoapAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../carbonio-ui-commons/test/mocks/store/folders';
import {
	makeListItemsVisible,
	setupHook,
	setupTest
} from '../../carbonio-ui-commons/test/test-setup';
import { TIMEOUTS, API_REQUEST_STATUS } from '../../constants';
import { useUiUtilities } from '../../hooks/use-ui-utilities';
import * as getMsgsForPrint from '../../store/actions/get-msg-for-print';
import { setSearchResultsByConversation } from '../../store/zustand/message-store/store';
import { generateConversation } from '../../tests/generators/generateConversation';
import { generateStore } from '../../tests/generators/store';
import {
	ConvActionRequest,
	ConvActionResponse,
	Conversation,
	SearchRequestStatus
} from '../../types';
import {
	printConversation,
	setConversationsFlag,
	setConversationsRead,
	useMoveConversationToTrash,
	useSetConversationAsSpam
} from '../conversation-actions';
import DeleteConvConfirm from '../delete-conv-modal';
import MoveConvMessage from '../move-conv-msg';
import { TagsDropdownItem } from '../tag-actions';

jest.mock<typeof import('../../hooks/use-ui-utilities')>('../../hooks/use-ui-utilities', () => ({
	useUiUtilities: (): ReturnType<typeof useUiUtilities> => ({
		createSnackbar: jest.fn(),
		createModal: jest.fn()
	})
}));

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useLocation: jest.fn()
}));

describe('Conversation actions calls', () => {
	describe('Add flag action', () => {
		test('Single id', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const conv = generateConversation({});
			const store = generateStore({
				conversations: {
					currentFolder: FOLDERS.INBOX,
					expandedStatus: {
						[conv.id]: API_REQUEST_STATUS.fulfilled
					},
					searchedInFolder: {},
					conversations: {
						[conv.id]: conv
					},
					searchRequestStatus: null
				}
			});

			const action = setConversationsFlag({
				ids: [conv.id],
				dispatch: store.dispatch,
				value: false
			});

			const apiInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

			act(() => {
				action.onClick();
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(conv.id);
			expect(requestParameter.action.op).toBe('flag');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const conversations: Array<Conversation> = times(10, () => generateConversation({}));
			const store = generateStore({
				conversations: {
					currentFolder: FOLDERS.INBOX,
					expandedStatus: conversations.reduce<Record<string, SearchRequestStatus>>(
						(result, conversation): Record<string, SearchRequestStatus> => ({
							...result,
							[conversation.id]: API_REQUEST_STATUS.fulfilled
						}),
						{}
					),
					searchedInFolder: {},
					conversations: {
						...conversations.reduce(
							(result, conversation) => ({ ...result, [conversation.id]: conversation }),
							{}
						)
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const convIds = conversations.map<string>((conv) => conv.id);

			const action = setConversationsFlag({
				ids: convIds,
				dispatch: store.dispatch,
				value: false
			});

			const apiInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

			act(() => {
				action.onClick();
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(convIds.join(','));
			expect(requestParameter.action.op).toBe('flag');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});

	describe('Remove flag action', () => {
		test('Single id', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const conv = generateConversation({});
			const store = generateStore({
				conversations: {
					currentFolder: FOLDERS.INBOX,
					expandedStatus: {
						[conv.id]: API_REQUEST_STATUS.fulfilled
					},
					searchedInFolder: {},
					conversations: {
						[conv.id]: conv
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const action = setConversationsFlag({
				ids: [conv.id],
				dispatch: store.dispatch,
				value: true
			});

			const apiInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

			act(() => {
				action.onClick();
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(conv.id);
			expect(requestParameter.action.op).toBe('!flag');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const conversations: Array<Conversation> = times(10, () => generateConversation({}));
			const store = generateStore({
				conversations: {
					currentFolder: FOLDERS.INBOX,
					expandedStatus: conversations.reduce<Record<string, SearchRequestStatus>>(
						(result, conversation): Record<string, SearchRequestStatus> => ({
							...result,
							[conversation.id]: API_REQUEST_STATUS.fulfilled
						}),
						{}
					),
					searchedInFolder: {},
					conversations: {
						...conversations.reduce(
							(result, conversation) => ({ ...result, [conversation.id]: conversation }),
							{}
						)
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const convIds = conversations.map<string>((conv) => conv.id);

			const action = setConversationsFlag({
				ids: convIds,
				dispatch: store.dispatch,
				value: true
			});

			const apiInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

			act(() => {
				action.onClick();
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(convIds.join(','));
			expect(requestParameter.action.op).toBe('!flag');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});

	describe('Mark as read action', () => {
		test('Single id', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const conv = generateConversation({});
			const store = generateStore({
				conversations: {
					currentFolder: FOLDERS.INBOX,
					expandedStatus: {
						[conv.id]: API_REQUEST_STATUS.fulfilled
					},
					searchedInFolder: {},
					conversations: {
						[conv.id]: conv
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const action = setConversationsRead({
				ids: [conv.id],
				dispatch: store.dispatch,
				value: false,
				// folderId is used only for routing
				folderId: '1',
				shouldReplaceHistory: false,
				deselectAll: noop
			});

			const apiInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

			act(() => {
				action.onClick();
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(conv.id);
			expect(requestParameter.action.op).toBe('read');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const conversations: Array<Conversation> = times(10, () => generateConversation({}));
			const store = generateStore({
				conversations: {
					currentFolder: FOLDERS.INBOX,
					expandedStatus: conversations.reduce<Record<string, SearchRequestStatus>>(
						(result, conversation): Record<string, SearchRequestStatus> => ({
							...result,
							[conversation.id]: API_REQUEST_STATUS.fulfilled
						}),
						{}
					),
					searchedInFolder: {},
					conversations: {
						...conversations.reduce(
							(result, conversation) => ({ ...result, [conversation.id]: conversation }),
							{}
						)
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const convIds = conversations.map<string>((conv) => conv.id);

			const action = setConversationsRead({
				ids: convIds,
				dispatch: store.dispatch,
				value: false,
				folderId: FOLDERS.INBOX,
				shouldReplaceHistory: false,
				deselectAll: noop
			});

			const apiInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

			act(() => {
				action.onClick();
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(convIds.join(','));
			expect(requestParameter.action.op).toBe('read');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});

	describe('Mark as unread action', () => {
		test('Single id', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const conv = generateConversation({});
			const store = generateStore({
				conversations: {
					currentFolder: FOLDERS.INBOX,
					expandedStatus: {
						[conv.id]: API_REQUEST_STATUS.fulfilled
					},
					searchedInFolder: {},
					conversations: {
						[conv.id]: conv
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const action = setConversationsRead({
				ids: [conv.id],
				dispatch: store.dispatch,
				value: true,
				folderId: '1',
				shouldReplaceHistory: false,
				deselectAll: noop
			});

			const apiInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

			act(() => {
				action.onClick();
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(conv.id);
			expect(requestParameter.action.op).toBe('!read');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const conversations: Array<Conversation> = times(10, () => generateConversation({}));
			const store = generateStore({
				conversations: {
					currentFolder: FOLDERS.INBOX,
					expandedStatus: conversations.reduce<Record<string, SearchRequestStatus>>(
						(result, conversation): Record<string, SearchRequestStatus> => ({
							...result,
							[conversation.id]: API_REQUEST_STATUS.fulfilled
						}),
						{}
					),
					searchedInFolder: {},
					conversations: {
						...conversations.reduce(
							(result, conversation) => ({ ...result, [conversation.id]: conversation }),
							{}
						)
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const convIds = conversations.map<string>((conv) => conv.id);
			const action = setConversationsRead({
				ids: convIds,
				dispatch: store.dispatch,
				value: true,
				folderId: FOLDERS.INBOX,
				shouldReplaceHistory: false,
				deselectAll: noop
			});

			const apiInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

			act(() => {
				action.onClick();
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(convIds.join(','));
			expect(requestParameter.action.op).toBe('!read');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});

	describe('Mark as spam action', () => {
		test('Single id', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const conv = generateConversation({});
			const store = generateStore({
				conversations: {
					currentFolder: FOLDERS.INBOX,
					expandedStatus: {
						[conv.id]: API_REQUEST_STATUS.fulfilled
					},
					searchedInFolder: {},
					conversations: {
						[conv.id]: conv
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const {
				result: { current: setConversationAsSpam }
			} = setupHook(useSetConversationAsSpam);
			const action = setConversationAsSpam({
				ids: [conv.id],
				dispatch: store.dispatch,
				value: false,
				deselectAll: noop
			});

			const apiInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

			act(() => {
				action.onClick();
				jest.advanceTimersByTime(TIMEOUTS.SET_AS_SPAM);
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(conv.id);
			expect(requestParameter.action.op).toBe('spam');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const conversations: Array<Conversation> = times(10, () => generateConversation({}));
			const store = generateStore({
				conversations: {
					currentFolder: FOLDERS.INBOX,
					expandedStatus: conversations.reduce<Record<string, SearchRequestStatus>>(
						(result, conversation): Record<string, SearchRequestStatus> => ({
							...result,
							[conversation.id]: API_REQUEST_STATUS.fulfilled
						}),
						{}
					),
					searchedInFolder: {},
					conversations: {
						...conversations.reduce(
							(result, conversation) => ({ ...result, [conversation.id]: conversation }),
							{}
						)
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const convIds = conversations.map<string>((conv) => conv.id);

			const {
				result: { current: setConversationAsSpam }
			} = setupHook(useSetConversationAsSpam);
			const action = setConversationAsSpam({
				ids: convIds,
				dispatch: store.dispatch,
				value: false,
				deselectAll: noop
			});

			const apiInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

			act(() => {
				action.onClick();
				jest.advanceTimersByTime(TIMEOUTS.SET_AS_SPAM);
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(convIds.join(','));
			expect(requestParameter.action.op).toBe('spam');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});

	describe('Mark as not spam action', () => {
		test('Single id', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const conv = generateConversation({});
			const store = generateStore({
				conversations: {
					currentFolder: FOLDERS.INBOX,
					expandedStatus: {
						[conv.id]: API_REQUEST_STATUS.fulfilled
					},
					searchedInFolder: {},
					conversations: {
						[conv.id]: conv
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const {
				result: { current: setConversationAsSpam }
			} = setupHook(useSetConversationAsSpam);
			const action = setConversationAsSpam({
				ids: [conv.id],
				dispatch: store.dispatch,
				value: true,
				deselectAll: noop
			});

			const apiInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

			act(() => {
				action.onClick();
				jest.advanceTimersByTime(TIMEOUTS.SET_AS_SPAM);
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(conv.id);
			expect(requestParameter.action.op).toBe('!spam');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const conversations: Array<Conversation> = times(10, () => generateConversation({}));
			const store = generateStore({
				conversations: {
					currentFolder: FOLDERS.INBOX,
					expandedStatus: conversations.reduce<Record<string, SearchRequestStatus>>(
						(result, conversation): Record<string, SearchRequestStatus> => ({
							...result,
							[conversation.id]: API_REQUEST_STATUS.fulfilled
						}),
						{}
					),
					searchedInFolder: {},
					conversations: {
						...conversations.reduce(
							(result, conversation) => ({ ...result, [conversation.id]: conversation }),
							{}
						)
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const convIds = conversations.map<string>((conv) => conv.id);
			const {
				result: { current: setConversationAsSpam }
			} = setupHook(useSetConversationAsSpam);
			const action = setConversationAsSpam({
				ids: convIds,
				dispatch: store.dispatch,
				value: true,
				deselectAll: noop
			});

			const apiInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

			act(() => {
				action.onClick();
				jest.advanceTimersByTime(TIMEOUTS.SET_AS_SPAM);
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(convIds.join(','));
			expect(requestParameter.action.op).toBe('!spam');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});

	test('Print action', () => {
		populateFoldersStore();
		const conv = generateConversation({});

		window.open = jest.fn();
		const printGeneratorMock = jest.spyOn(getMsgsForPrint, 'getMsgsForPrint');
		const action = printConversation({
			conversation: conv
		});

		act(() => {
			action.onClick();
		});
		const msgIds = conv.messages.map<string>((msg) => msg.id);
		// Check that the getMsgsForPrint and the window.oepn functions are called
		expect(printGeneratorMock).toHaveBeenCalledWith(expect.objectContaining({ ids: msgIds }));
		expect(window.open).toBeCalled();
	});

	describe('Move to trash action', () => {
		test('Single id', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const conv = generateConversation({});
			(useLocation as jest.Mock).mockReturnValue({ pathname: '/search/test' });
			const store = generateStore({
				conversations: {
					currentFolder: FOLDERS.INBOX,
					expandedStatus: {
						[conv.id]: API_REQUEST_STATUS.fulfilled
					},
					searchedInFolder: {},
					conversations: {
						[conv.id]: conv
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const {
				result: { current: moveConversationToTrash }
			} = setupHook(useMoveConversationToTrash);
			const action = moveConversationToTrash({
				ids: [conv.id],
				dispatch: store.dispatch,
				folderId: '1',
				deselectAll: noop
			});

			const apiInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

			act(() => {
				action.onClick();
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(conv.id);
			expect(requestParameter.action.op).toBe('trash');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const conversations: Array<Conversation> = times(10, () => generateConversation({}));
			(useLocation as jest.Mock).mockReturnValue({ pathname: '/search/test' });
			const store = generateStore({
				conversations: {
					currentFolder: FOLDERS.INBOX,
					expandedStatus: conversations.reduce<Record<string, SearchRequestStatus>>(
						(result, conversation): Record<string, SearchRequestStatus> => ({
							...result,
							[conversation.id]: API_REQUEST_STATUS.fulfilled
						}),
						{}
					),
					searchedInFolder: {},
					conversations: {
						...conversations.reduce(
							(result, conversation) => ({ ...result, [conversation.id]: conversation }),
							{}
						)
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const convIds = conversations.map<string>((conv) => conv.id);
			const {
				result: { current: moveConversationToTrash }
			} = setupHook(useMoveConversationToTrash);
			const action = moveConversationToTrash({
				ids: convIds,
				dispatch: store.dispatch,
				folderId: FOLDERS.INBOX,
				deselectAll: noop
			});

			const apiInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

			act(() => {
				action.onClick();
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(convIds.join(','));
			expect(requestParameter.action.op).toBe('trash');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('do not replace history if in /search', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			setSearchResultsByConversation([generateConversation({ id: '1' })], false);
			const store = generateStore();
			const spyReplaceHistory = jest.spyOn(hooks, 'replaceHistory');
			(useLocation as jest.Mock).mockReturnValue({ pathname: '/search/test' });
			const {
				result: { current: moveConversationToTrash }
			} = setupHook(useMoveConversationToTrash);
			const action = moveConversationToTrash({
				ids: ['1'],
				dispatch: store.dispatch,
				folderId: FOLDERS.INBOX,
				deselectAll: noop
			});
			const apiInterceptor = createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>(
				'ConvAction',
				{
					action: {
						id: 'test',
						op: 'trash'
					}
				}
			);
			act(() => {
				action.onClick();
			});

			await apiInterceptor;
			await waitFor(() => {
				expect(spyReplaceHistory).not.toBeCalled();
			});
		});

		test('replace history if location does not start with /search', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			setSearchResultsByConversation([generateConversation({ id: '1' })], false);
			const store = generateStore();
			(useLocation as jest.Mock).mockReturnValue({ pathname: '/mails/test' });
			const spyReplaceHistory = jest.spyOn(hooks, 'replaceHistory');
			const {
				result: { current: moveConversationToTrash }
			} = setupHook(useMoveConversationToTrash);
			const action = moveConversationToTrash({
				ids: ['1'],
				dispatch: store.dispatch,
				folderId: FOLDERS.TRASH,
				deselectAll: noop
			});
			const apiInterceptor = createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>(
				'ConvAction',
				{
					action: {
						id: 'test',
						op: 'trash'
					}
				}
			);
			act(() => {
				action.onClick();
			});

			await apiInterceptor;
			await waitFor(() => {
				expect(spyReplaceHistory).toBeCalledWith(`/folder/${FOLDERS.TRASH}/`);
			});
		});
	});

	describe('Delete permanently action', () => {
		test('Single id', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const conv = generateConversation({});
			const store = generateStore({
				conversations: {
					currentFolder: FOLDERS.INBOX,
					expandedStatus: {
						[conv.id]: API_REQUEST_STATUS.fulfilled
					},
					searchedInFolder: {},
					conversations: {
						[conv.id]: conv
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const component = (
				<DeleteConvConfirm
					selectedIDs={[conv.id]}
					isMessageView={false}
					onClose={jest.fn()}
					deselectAll={jest.fn()}
				/>
			);

			const interceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
			const { user } = setupTest(component, { store });
			const button = await screen.findByText(/label\.delete_permanently/i);
			await user.click(button);

			const requestParameter = await interceptor;
			expect(requestParameter.action.id).toBe(conv.id);
			expect(requestParameter.action.op).toBe('delete');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const conversations: Array<Conversation> = times(10, () => generateConversation({}));
			const store = generateStore({
				conversations: {
					currentFolder: FOLDERS.INBOX,
					expandedStatus: conversations.reduce<Record<string, SearchRequestStatus>>(
						(result, conversation): Record<string, SearchRequestStatus> => ({
							...result,
							[conversation.id]: API_REQUEST_STATUS.fulfilled
						}),
						{}
					),
					searchedInFolder: {},
					conversations: {
						...conversations.reduce(
							(result, conversation) => ({ ...result, [conversation.id]: conversation }),
							{}
						)
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const convIds = conversations.map<string>((conv) => conv.id);
			const component = (
				<DeleteConvConfirm
					selectedIDs={convIds}
					isMessageView={false}
					onClose={jest.fn()}
					deselectAll={jest.fn()}
				/>
			);

			const interceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
			const { user } = setupTest(component, { store });
			const button = await screen.findByText(/label\.delete_permanently/i);
			await user.click(button);

			const requestParameter = await interceptor;
			expect(requestParameter.action.id).toBe(convIds.join(','));
			expect(requestParameter.action.op).toBe('delete');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});

	describe('Move action', () => {
		test('Single id', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const { children: inboxChildren } = getFolder(FOLDERS.INBOX) ?? {};
			const sourceFolder = inboxChildren?.[0].id ?? '';
			const destinationFolder = FOLDERS.INBOX;

			const conv = generateConversation({});
			const store = generateStore({
				conversations: {
					currentFolder: FOLDERS.INBOX,
					expandedStatus: {
						[conv.id]: API_REQUEST_STATUS.fulfilled
					},
					searchedInFolder: {},
					conversations: {
						[conv.id]: conv
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const component = (
				<MoveConvMessage
					folderId={sourceFolder}
					selectedIDs={[conv.id]}
					onClose={jest.fn()}
					isMessageView={false}
					isRestore={false}
					deselectAll={jest.fn()}
					dispatch={store.dispatch}
				/>
			);

			const interceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

			const { user } = setupTest(component, { store });
			makeListItemsVisible();
			const inboxFolderListItem = await screen.findByTestId(
				`folder-accordion-item-${destinationFolder}`
			);

			act(() => {
				jest.advanceTimersByTime(1000);
			});

			await user.click(inboxFolderListItem);

			const button = screen.getByRole('button', {
				name: /label\.move/i
			});
			expect(button).toBeEnabled();
			await act(async () => {
				await user.click(button);
			});

			const requestParameter = await interceptor;

			expect(requestParameter.action.id).toBe(conv.id);
			expect(requestParameter.action.op).toBe('move');
			expect(requestParameter.action.l).toBe(destinationFolder);
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const { children: inboxChildren } = getFolder(FOLDERS.INBOX) ?? {};
			const sourceFolder = inboxChildren?.[0].id ?? '';
			const destinationFolder = FOLDERS.INBOX;
			const conversations: Array<Conversation> = times(10, () => generateConversation({}));
			const store = generateStore({
				conversations: {
					currentFolder: FOLDERS.INBOX,
					expandedStatus: conversations.reduce<Record<string, SearchRequestStatus>>(
						(result, conversation): Record<string, SearchRequestStatus> => ({
							...result,
							[conversation.id]: API_REQUEST_STATUS.fulfilled
						}),
						{}
					),
					searchedInFolder: {},
					conversations: {
						...conversations.reduce(
							(result, conversation) => ({ ...result, [conversation.id]: conversation }),
							{}
						)
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const convIds = conversations.map<string>((conv) => conv.id);

			const component = (
				<MoveConvMessage
					folderId={sourceFolder}
					selectedIDs={convIds}
					onClose={jest.fn()}
					isMessageView={false}
					isRestore={false}
					deselectAll={jest.fn()}
					dispatch={store.dispatch}
				/>
			);

			const interceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

			const { user } = setupTest(component, { store });
			makeListItemsVisible();
			const inboxFolderListItem = await screen.findByTestId(
				`folder-accordion-item-${destinationFolder}`
			);

			act(() => {
				jest.advanceTimersByTime(10000);
			});

			await user.click(inboxFolderListItem);

			const button = screen.getByRole('button', {
				name: /label\.move/i
			});
			expect(button).toBeEnabled();
			await user.click(button);

			const requestParameter = await interceptor;
			expect(requestParameter.action.id).toBe(convIds.join(','));
			expect(requestParameter.action.op).toBe('move');
			expect(requestParameter.action.l).toBe(destinationFolder);
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});

	describe('Tag action', () => {
		test('Add a tag to a conversation', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const conv = generateConversation({});
			const store = generateStore({
				conversations: {
					currentFolder: FOLDERS.INBOX,
					expandedStatus: {
						[conv.id]: API_REQUEST_STATUS.fulfilled
					},
					searchedInFolder: {},
					conversations: {
						[conv.id]: conv
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const tagKey = faker.helpers.arrayElement(Object.keys(getTags()));
			const tag = getTag(tagKey);

			const component = <TagsDropdownItem tag={tag} conversation={conv} isMessage={false} />;

			const interceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
			const { user } = setupTest(component, { store });

			const tagElement = screen.getByTestId(`tag-item-${tag.id}`);
			await user.click(tagElement);

			const requestParameter = await interceptor;
			expect(requestParameter.action.id).toBe(conv.id);
			expect(requestParameter.action.op).toBe('tag');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.tn).toBe(tag.name);
		});

		test('Remove a tag from a conversation', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const tagKey = faker.helpers.arrayElement(Object.keys(getTags()));
			const tag = getTag(tagKey);
			const conv = generateConversation({ tags: [tag.id] });
			const store = generateStore({
				conversations: {
					currentFolder: FOLDERS.INBOX,
					expandedStatus: {
						[conv.id]: API_REQUEST_STATUS.fulfilled
					},
					searchedInFolder: {},
					conversations: {
						[conv.id]: conv
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const component = <TagsDropdownItem tag={tag} conversation={conv} isMessage={false} />;

			const interceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
			const { user } = setupTest(component, { store });

			const tagElement = screen.getByTestId(`tag-item-${tag.id}`);
			await user.click(tagElement);

			const requestParameter = await interceptor;
			expect(requestParameter.action.id).toBe(conv.id);
			expect(requestParameter.action.op).toBe('!tag');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.tn).toBe(tag.name);
		});
	});
});
