/* eslint-disable no-param-reassign */
import React from 'react';

import { faker } from '@faker-js/faker';
import { act, screen, waitFor, within } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { addBoard } from '@zextras/carbonio-shell-ui';
import { times } from 'lodash';
/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FOLDER_VIEW } from '../../carbonio-ui-commons/constants';
import { ParticipantRole } from '../../carbonio-ui-commons/constants/participants';
import { getFolder } from '../../carbonio-ui-commons/store/zustand/folder';
import { createFakeIdentity } from '../../carbonio-ui-commons/test/mocks/accounts/fakeAccounts';
import { getTags } from '../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { FOLDERS } from '../../carbonio-ui-commons/test/mocks/carbonio-shell-ui-constants';
import { createSoapAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../carbonio-ui-commons/test/mocks/store/folders';
import {
	makeListItemsVisible,
	setupHook,
	setupTest
} from '../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS, TIMEOUTS } from '../../constants';
import { useUiUtilities } from '../../hooks/use-ui-utilities';
import * as getMsgsForPrint from '../../store/actions/get-msg-for-print';
import {
	updateConversations,
	updateMessages,
	useMessageById
} from '../../store/zustand/message-store/store';
import { generateConversation } from '../../tests/generators/generateConversation';
import { generateMessage } from '../../tests/generators/generateMessage';
import { generateStore } from '../../tests/generators/store';
import {
	type ConvActionRequest,
	ConvActionResponse,
	MailMessage,
	MsgActionRequest,
	MsgActionResponse,
	RedirectMessageActionRequest,
	SaveDraftRequest
} from '../../types';
import DeleteConvConfirm from '../delete-conv-modal';
import {
	editAsNewMsg,
	forwardMsg,
	printMsg,
	replyAllMsg,
	replyMsg,
	sendDraft,
	setMsgFlag,
	setMsgRead,
	showOriginalMsg,
	useEditDraft,
	useMoveMsgToTrash,
	useSetMsgAsSpam
} from '../message-actions';
import MoveConvMessage from '../move-conv-msg';
import RedirectMessageAction from '../redirect-message-action';
import { TagsDropdownItem } from '../tag-actions';

jest.mock<typeof import('../../hooks/use-ui-utilities')>('../../hooks/use-ui-utilities', () => ({
	useUiUtilities: (): ReturnType<typeof useUiUtilities> => ({
		createSnackbar: jest.fn(),
		createModal: jest.fn()
	})
}));

describe('Messages actions calls', () => {
	beforeAll(() => {
		createSoapAPIInterceptor('MsgAction', {});
		createSoapAPIInterceptor('Batch', {});
		createSoapAPIInterceptor('SendMsg', {});
	});
	describe('Add flag action', () => {
		test('Single id', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const msg = generateMessage({});
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: { [msg.id]: msg },
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');

			const action = setMsgFlag({
				ids: [msg.id],
				dispatch: store.dispatch,
				value: false
			});

			act(() => {
				action.onClick();
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('flag');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const msgs: Array<MailMessage> = times(10, () => generateMessage({}));
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: { ...msgs.reduce((result, msg) => ({ ...result, [msg.id]: msg }), {}) },
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const msgIds = msgs.map<string>((msg) => msg.id);

			const action = setMsgFlag({
				ids: msgIds,
				dispatch: store.dispatch,
				value: false
			});

			const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');

			act(() => {
				action.onClick();
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(msgIds.join(','));
			expect(requestParameter.action.op).toBe('flag');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple messages in search', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			updateMessages(
				[
					generateMessage({ id: '1', isFlagged: false }),
					generateMessage({ id: '2', isFlagged: false })
				],
				0
			);
			const store = generateStore();
			const action = setMsgFlag({
				ids: ['1', '2'],
				dispatch: store.dispatch,
				value: false
			});
			const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
				'MsgAction',
				{
					action: {
						id: 'someId',
						op: 'flag'
					}
				}
			);

			act(() => {
				action.onClick();
			});

			await apiInterceptor;

			const msg1Result = renderHook(() => useMessageById('1')).result;
			const msg2Result = renderHook(() => useMessageById('2')).result;
			await waitFor(() => {
				expect(msg1Result.current.flagged).toBe(true);
			});
			await waitFor(() => {
				expect(msg2Result.current.flagged).toBe(true);
			});
		});
	});

	describe('Remove flag action', () => {
		test('Single id', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const msg = generateMessage({});
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: { [msg.id]: msg },
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const action = setMsgFlag({
				ids: [msg.id],
				dispatch: store.dispatch,
				value: true
			});
			const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');

			act(() => {
				action.onClick();
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('!flag');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const msgs: Array<MailMessage> = times(10, () => generateMessage({}));
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: {
						...msgs.reduce((result, msg) => ({ ...result, [msg.id]: msg }), {})
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const msgIds = msgs.map<string>((msg) => msg.id);

			const action = setMsgFlag({
				ids: msgIds,
				dispatch: store.dispatch,
				value: false
			});

			const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');

			act(() => {
				action.onClick();
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(msgIds.join(','));
			expect(requestParameter.action.op).toBe('flag');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});

	describe('Mark as read action', () => {
		test('Single id', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const msg = generateMessage({});
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: { [msg.id]: msg },
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const action = setMsgRead({
				ids: [msg.id],
				dispatch: store.dispatch,
				value: false,
				folderId: msg.parent
			});

			const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');

			act(() => {
				action.onClick();
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('read');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('multiple messages are mark as read in search zustand store', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			updateMessages(
				[generateMessage({ id: '1', isRead: false }), generateMessage({ id: '2', isRead: false })],
				0
			);
			const store = generateStore();
			const action = setMsgRead({
				ids: ['1', '2'],
				dispatch: store.dispatch,
				value: false
			});

			const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
				'MsgAction',
				{
					action: {
						id: 'readOperationId',
						op: 'read'
					}
				}
			);

			act(() => {
				action.onClick();
			});

			await apiInterceptor;
			const msg1Result = renderHook(() => useMessageById('1')).result;
			const msg2Result = renderHook(() => useMessageById('2')).result;
			await waitFor(() => {
				expect(msg1Result.current.read).toBe(true);
			});
			await waitFor(() => {
				expect(msg2Result.current.read).toBe(true);
			});
		});

		test('Multiple ids', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const msgs: Array<MailMessage> = times(10, () => generateMessage({}));
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: {
						...msgs.reduce((result, msg) => ({ ...result, [msg.id]: msg }), {})
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const msgIds = msgs.map<string>((msg) => msg.id);

			const action = setMsgRead({
				ids: msgIds,
				dispatch: store.dispatch,
				value: false
			});

			const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');

			act(() => {
				action.onClick();
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(msgIds.join(','));
			expect(requestParameter.action.op).toBe('read');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});

	describe('Mark as unread action', () => {
		test('Single id', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const msg = generateMessage({});
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: { [msg.id]: msg },
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const action = setMsgRead({
				ids: [msg.id],
				dispatch: store.dispatch,
				value: true,
				folderId: msg.parent
			});

			const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');

			act(() => {
				action.onClick();
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('!read');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const msgs: Array<MailMessage> = times(10, () => generateMessage({}));
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: {
						...msgs.reduce((result, msg) => ({ ...result, [msg.id]: msg }), {})
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const msgIds = msgs.map<string>((msg) => msg.id);

			const action = setMsgRead({
				ids: msgIds,
				dispatch: store.dispatch,
				value: true,
				folderId: FOLDERS.INBOX
			});

			const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');

			act(() => {
				action.onClick();
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(msgIds.join(','));
			expect(requestParameter.action.op).toBe('!read');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});

	describe('Mark as spam action', () => {
		test('Single id', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const msg = generateMessage({});
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: { [msg.id]: msg },
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});
			const {
				result: { current: setMsgAsSpam }
			} = setupHook(useSetMsgAsSpam);
			const action = setMsgAsSpam({
				ids: [msg.id],
				dispatch: store.dispatch,
				value: true,
				folderId: msg.parent
			});

			const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');

			act(() => {
				action.onClick();
				jest.advanceTimersByTime(TIMEOUTS.SET_AS_SPAM);
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('!spam');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const msgs: Array<MailMessage> = times(10, () => generateMessage({}));
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: {
						...msgs.reduce((result, msg) => ({ ...result, [msg.id]: msg }), {})
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const msgIds = msgs.map<string>((msg) => msg.id);

			const {
				result: { current: setMsgAsSpam }
			} = setupHook(useSetMsgAsSpam);

			const action = setMsgAsSpam({
				ids: msgIds,
				dispatch: store.dispatch,
				value: true,
				folderId: FOLDERS.INBOX
			});

			const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');

			act(() => {
				action.onClick();
				jest.advanceTimersByTime(TIMEOUTS.SET_AS_SPAM);
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(msgIds.join(','));
			expect(requestParameter.action.op).toBe('!spam');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('multiple messages in zustand search store', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			updateMessages(
				[
					generateMessage({ id: '1', folderId: FOLDERS.INBOX }),
					generateMessage({ id: '2', folderId: FOLDERS.INBOX })
				],
				0
			);
			const store = generateStore();
			const {
				result: { current: setMsgAsSpam }
			} = setupHook(useSetMsgAsSpam);
			const action = setMsgAsSpam({
				ids: ['1', '2'],
				dispatch: store.dispatch,
				value: true,
				folderId: FOLDERS.INBOX
			});
			const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
				'MsgAction',
				{
					action: {
						id: 'whatever',
						op: 'spam'
					}
				}
			);

			act(() => {
				action.onClick();
				jest.advanceTimersByTime(TIMEOUTS.SET_AS_SPAM);
			});

			await apiInterceptor;

			const msg1Result = renderHook(() => useMessageById('1')).result;
			const msg2Result = renderHook(() => useMessageById('2')).result;
			await waitFor(() => {
				expect(msg1Result.current.parent).toBe(FOLDERS.SPAM);
			});
			await waitFor(() => {
				expect(msg2Result.current.parent).toBe(FOLDERS.SPAM);
			});
		});
	});

	describe('Mark as not spam action', () => {
		test('Single id', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const msg = generateMessage({});
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: { [msg.id]: msg },
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const {
				result: { current: setMsgAsSpam }
			} = setupHook(useSetMsgAsSpam);

			const action = setMsgAsSpam({
				ids: [msg.id],
				dispatch: store.dispatch,
				value: false,
				folderId: msg.parent
			});

			const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');

			act(() => {
				action.onClick();
				jest.advanceTimersByTime(TIMEOUTS.SET_AS_SPAM);
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('spam');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const msgs: Array<MailMessage> = times(10, () => generateMessage({}));
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: {
						...msgs.reduce((result, msg) => ({ ...result, [msg.id]: msg }), {})
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const msgIds = msgs.map<string>((msg) => msg.id);

			const {
				result: { current: setMsgAsSpam }
			} = setupHook(useSetMsgAsSpam);
			const action = setMsgAsSpam({
				ids: msgIds,
				dispatch: store.dispatch,
				value: false,
				folderId: FOLDERS.INBOX
			});

			const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');

			act(() => {
				action.onClick();
				jest.advanceTimersByTime(TIMEOUTS.SET_AS_SPAM);
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(msgIds.join(','));
			expect(requestParameter.action.op).toBe('spam');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});

	test('Print action', () => {
		populateFoldersStore({ view: FOLDER_VIEW.message });
		const msg = generateMessage({});
		const store = generateStore({
			messages: {
				searchedInFolder: {},
				messages: { [msg.id]: msg },
				searchRequestStatus: API_REQUEST_STATUS.fulfilled
			}
		});

		window.open = jest.fn();

		const printGeneratorMock = jest.spyOn(getMsgsForPrint, 'getMsgsForPrint');
		const action = printMsg({
			message: msg
		});

		act(() => {
			action.onClick();
		});

		// Check that the getMsgsForPrint and the window.oepn functions are called
		expect(printGeneratorMock).toHaveBeenCalledWith(expect.objectContaining({ ids: [msg.id] }));
		expect(window.open).toBeCalled();
	});

	test('Show source', () => {
		populateFoldersStore({ view: FOLDER_VIEW.message });
		const msg = generateMessage({});
		const store = generateStore({
			messages: {
				searchedInFolder: {},
				messages: { [msg.id]: msg },
				searchRequestStatus: API_REQUEST_STATUS.fulfilled
			}
		});

		window.open = jest.fn();

		const action = showOriginalMsg({
			id: msg.id
		});

		act(() => {
			action.onClick();
		});

		// Check that the getMsgsForPrint and the window.oepn functions are called
		expect(window.open).toBeCalledWith(`/service/home/~/?auth=co&view=text&id=${msg.id}`, '_blank');
	});

	describe('Move to trash action', () => {
		test('Single id', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const msg = generateMessage({});
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: { [msg.id]: msg },
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const {
				result: { current: moveMsgToTrash }
			} = setupHook(useMoveMsgToTrash);
			const action = moveMsgToTrash({
				ids: [msg.id],
				dispatch: store.dispatch,
				folderId: msg.parent
			});

			const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');

			act(() => {
				action.onClick();
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('trash');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const msgs: Array<MailMessage> = times(10, () => generateMessage({}));
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: {
						...msgs.reduce((result, msg) => ({ ...result, [msg.id]: msg }), {})
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const msgIds = msgs.map<string>((msg) => msg.id);

			const {
				result: { current: moveMsgToTrash }
			} = setupHook(useMoveMsgToTrash);
			const action = moveMsgToTrash({
				ids: msgIds,
				dispatch: store.dispatch,
				folderId: FOLDERS.INBOX
			});

			const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');

			act(() => {
				action.onClick();
			});

			const requestParameter = await apiInterceptor;
			expect(requestParameter.action.id).toBe(msgIds.join(','));
			expect(requestParameter.action.op).toBe('trash');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		it('moveMsgToTrash action should update message parent parent to TRASH', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const store = generateStore({});
			const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
				'MsgAction',
				{
					action: { id: '1', op: 'trash' }
				}
			);
			updateMessages([generateMessage({ id: '1' })], 0);
			const moveMsgToTrash = renderHook(useMoveMsgToTrash).result.current;
			const action = moveMsgToTrash({
				ids: ['1'],
				dispatch: store.dispatch,
				folderId: FOLDERS.INBOX
			});

			act(() => {
				action.onClick();
			});

			await apiInterceptor;
			const { result, waitFor } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(result.current.parent).toBe(FOLDERS.TRASH);
			});
		});
	});

	describe('Delete permanently action', () => {
		test('Single id', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const msg = generateMessage({});
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: { [msg.id]: msg },
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const component = (
				<DeleteConvConfirm
					selectedIDs={[msg.id]}
					isMessageView
					onClose={jest.fn()}
					deselectAll={jest.fn()}
				/>
			);

			const interceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');

			const { user } = setupTest(component, { store });
			const button = await screen.findByText(/label\.delete_permanently/i);
			await user.click(button);

			const requestParameter = await interceptor;
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('delete');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const msgs: Array<MailMessage> = times(10, () => generateMessage({}));
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: {
						...msgs.reduce((result, msg) => ({ ...result, [msg.id]: msg }), {})
					},
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const msgIds = msgs.map<string>((msg) => msg.id);

			const component = (
				<DeleteConvConfirm
					selectedIDs={msgIds}
					isMessageView
					onClose={jest.fn()}
					deselectAll={jest.fn()}
				/>
			);

			const interceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');

			const { user } = setupTest(component, { store });
			const button = await screen.findByText(/label\.delete_permanently/i);
			await user.click(button);

			const requestParameter = await interceptor;
			expect(requestParameter.action.id).toBe(msgIds.join(','));
			expect(requestParameter.action.op).toBe('delete');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});

	describe('Move action', () => {
		test('Single id', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const { children: inboxChildren } = getFolder(FOLDERS.INBOX) ?? {};
			const sourceFolder = inboxChildren?.[0].id ?? '';
			const destinationFolder = FOLDERS.INBOX;

			const msg = generateMessage({ folderId: sourceFolder });
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: { [msg.id]: msg },
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const component = (
				<MoveConvMessage
					folderId={sourceFolder}
					selectedIDs={[msg.id]}
					onClose={jest.fn()}
					isMessageView
					isRestore={false}
					deselectAll={jest.fn()}
					dispatch={store.dispatch}
				/>
			);

			const interceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');

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
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('move');
			expect(requestParameter.action.l).toBe(destinationFolder);
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		it('should update messages parent to destination folder when moving conversation', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			updateConversations([generateConversation({ id: '123' })], 0);
			updateMessages(
				[
					generateMessage({ id: '1', folderId: FOLDERS.INBOX }),
					generateMessage({ id: '2', folderId: FOLDERS.INBOX })
				],
				0
			);
			const destinationFolder = FOLDERS.INBOX;
			const store = generateStore();
			const interceptor = createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>(
				'ConvAction',
				{
					action: {
						id: 'actionId',
						op: 'move'
					}
				}
			);
			const { user } = setupTest(
				<MoveConvMessage
					folderId={FOLDERS.SPAM}
					selectedIDs={['1', '2']}
					onClose={jest.fn()}
					isMessageView={false}
					isRestore={false}
					deselectAll={jest.fn()}
					dispatch={store.dispatch}
				/>,
				{ store }
			);
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
			await interceptor;

			const msg1 = renderHook(() => useMessageById('1')).result.current;
			const msg2 = renderHook(() => useMessageById('1')).result.current;

			expect(msg1.parent).toBe(FOLDERS.SPAM);
			expect(msg2.parent).toBe(FOLDERS.SPAM);
		});

		test('Multiple ids', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });

			const { children: inboxChildren } = getFolder(FOLDERS.INBOX) ?? {};
			const sourceFolder = inboxChildren?.[0].id ?? '';
			const destinationFolder = FOLDERS.INBOX;

			const msgs: Array<MailMessage> = times(10, () => generateMessage({ folderId: sourceFolder }));
			const msgIds = msgs.map<string>((msg) => msg.id);

			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: msgs,
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const interceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
				'MsgAction',
				{
					action: {
						id: msgIds.join(','),
						op: 'move'
					}
				}
			);

			const component = (
				<MoveConvMessage
					folderId={sourceFolder}
					selectedIDs={msgIds}
					onClose={jest.fn()}
					isMessageView
					isRestore={false}
					deselectAll={jest.fn()}
					dispatch={store.dispatch}
				/>
			);

			const { user } = setupTest(component, { store });
			makeListItemsVisible();

			const inboxFolderListItem = await screen.findByTestId(
				`folder-accordion-item-${destinationFolder}`,
				{},
				{ timeout: 10000 }
			);

			act(() => {
				jest.advanceTimersByTime(1000);
			});

			await act(async () => {
				await user.click(inboxFolderListItem);
			});

			const button = screen.getByRole('button', {
				name: /label\.move/i
			});
			expect(button).toBeEnabled();

			await act(async () => {
				await user.click(button);
			});

			const requestParameter = await interceptor;
			expect(requestParameter.action.id).toBe(msgIds.join(','));
			expect(requestParameter.action.op).toBe('move');
			expect(requestParameter.action.l).toBe(destinationFolder);
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});

	test('Reply action', () => {
		populateFoldersStore({ view: FOLDER_VIEW.message });

		const msg: MailMessage = generateMessage({});

		generateStore({
			messages: {
				searchedInFolder: {},
				messages: { [msg.id]: msg },
				searchRequestStatus: API_REQUEST_STATUS.fulfilled
			}
		});

		const action = replyMsg({
			id: msg.id
		});

		act(() => {
			action.onClick();
		});

		expect(addBoard).toBeCalledWith(
			expect.objectContaining({
				boardViewId: 'mails_editor_board_view',
				context: {
					originAction: 'reply',
					originActionTargetId: msg.id
				},
				title: ''
			})
		);
	});

	test('Reply all action', () => {
		populateFoldersStore({ view: FOLDER_VIEW.message });

		const msg: MailMessage = generateMessage({});

		generateStore({
			messages: {
				searchedInFolder: {},
				messages: { [msg.id]: msg },
				searchRequestStatus: API_REQUEST_STATUS.fulfilled
			}
		});

		const action = replyAllMsg({
			id: msg.id
		});

		act(() => {
			action.onClick();
		});

		expect(addBoard).toBeCalledWith(
			expect.objectContaining({
				boardViewId: 'mails_editor_board_view',
				context: {
					originAction: 'replyAll',
					originActionTargetId: msg.id
				},
				title: ''
			})
		);
	});

	test('Forward action', () => {
		populateFoldersStore({ view: FOLDER_VIEW.message });
		const msg: MailMessage = generateMessage({});
		generateStore({
			messages: {
				searchedInFolder: {},
				messages: { [msg.id]: msg },
				searchRequestStatus: API_REQUEST_STATUS.fulfilled
			}
		});

		const action = forwardMsg({
			id: msg.id
		});

		act(() => {
			action.onClick();
		});

		expect(addBoard).toBeCalledWith(
			expect.objectContaining({
				boardViewId: 'mails_editor_board_view',
				context: {
					originAction: 'forward',
					originActionTargetId: msg.id
				},
				title: ''
			})
		);
	});

	test('Edit draft action', () => {
		populateFoldersStore({ view: FOLDER_VIEW.message });
		const msg: MailMessage = generateMessage({});
		generateStore({
			messages: {
				searchedInFolder: {},
				messages: { [msg.id]: msg },
				searchRequestStatus: API_REQUEST_STATUS.fulfilled
			}
		});

		const {
			result: { current: editDraft }
		} = setupHook(useEditDraft);
		const action = editDraft({
			id: msg.id
		});

		act(() => {
			action.onClick();
		});

		expect(addBoard).toBeCalledWith(
			expect.objectContaining({
				boardViewId: 'mails_editor_board_view',
				context: {
					originAction: 'editAsDraft',
					originActionTargetId: msg.id
				},
				title: ''
			})
		);
	});

	test('Edit as new action', () => {
		populateFoldersStore({ view: FOLDER_VIEW.message });
		const msg: MailMessage = generateMessage({});
		generateStore({
			messages: {
				searchedInFolder: {},
				messages: { [msg.id]: msg },
				searchRequestStatus: API_REQUEST_STATUS.fulfilled
			}
		});

		const action = editAsNewMsg({
			id: msg.id
		});

		act(() => {
			action.onClick();
		});

		expect(addBoard).toBeCalledWith(
			expect.objectContaining({
				boardViewId: 'mails_editor_board_view',
				context: {
					originAction: 'editAsNew',
					originActionTargetId: msg.id
				},
				title: ''
			})
		);
	});

	test('Send draft action', async () => {
		populateFoldersStore({ view: FOLDER_VIEW.message });
		const msg = generateMessage({ folderId: FOLDERS.DRAFTS });
		const store = generateStore({
			messages: {
				searchedInFolder: {},
				messages: { [msg.id]: msg },
				searchRequestStatus: API_REQUEST_STATUS.fulfilled
			}
		});

		const apiInterceptor = createSoapAPIInterceptor<SaveDraftRequest>('SendMsg');

		const action = sendDraft({
			message: msg,
			dispatch: store.dispatch
		});

		act(() => {
			action.onClick();
		});

		const requestParameter = await apiInterceptor;
		expect(requestParameter.m.id).toBe(msg.id);
		expect(requestParameter.m.su).not.toBeUndefined();
		expect(requestParameter.m.e).not.toBeUndefined();
		expect(requestParameter.m.mp).not.toBeUndefined();
	});

	describe('Redirect action', () => {
		test('Redirect button is disabled when no recipients address is set', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const msg = generateMessage({});
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: { [msg.id]: msg },
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const component = <RedirectMessageAction id={msg.id} onClose={jest.fn()} />;
			setupTest(component, { store });

			const button = screen.getByRole('button', {
				name: /action\.redirect/i
			});

			expect(button).toBeDisabled();
		});

		test('Redirect button is enabled when at least one recipient address is set', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const msg = generateMessage({});
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: { [msg.id]: msg },
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const component = <RedirectMessageAction id={msg.id} onClose={jest.fn()} />;
			const { user } = setupTest(component, { store });

			const recipient = createFakeIdentity().email;
			const title = screen.getByText(/header\.redirect_email/i);

			const recipientsInputElement = within(
				screen.getByTestId('redirect-recipients-address')
			).getByRole('textbox');
			await user.click(recipientsInputElement);
			await user.clear(recipientsInputElement);
			await user.type(recipientsInputElement, recipient);
			await user.click(title);

			const button = screen.getByRole('button', {
				name: /action\.redirect/i
			});

			expect(button).toBeEnabled();
		});

		test('API call for one recipients', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const msg = generateMessage({});
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: { [msg.id]: msg },
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const component = <RedirectMessageAction id={msg.id} onClose={jest.fn()} />;

			const interceptor = createSoapAPIInterceptor<RedirectMessageActionRequest>('BounceMsg');

			const { user } = setupTest(component, { store });

			const recipient = createFakeIdentity().email;
			const recipientsInputElement = within(
				screen.getByTestId('redirect-recipients-address')
			).getByRole('textbox');

			await user.type(recipientsInputElement, recipient);

			const button = screen.getByRole('button', {
				name: /action\.redirect/i
			});
			await user.click(button);

			const requestParameter = await interceptor;
			expect(requestParameter.m.id).toBe(msg.id);
			expect(requestParameter.m.e).toHaveLength(1);
			expect(requestParameter.m.e[0].t).toBe(ParticipantRole.TO);
			expect(requestParameter.m.e[0].a).toBe(recipient);
		});

		test('API call for 5 recipients', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const msg = generateMessage({});
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: { [msg.id]: msg },
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const component = <RedirectMessageAction id={msg.id} onClose={jest.fn()} />;

			const interceptor = createSoapAPIInterceptor<RedirectMessageActionRequest>('BounceMsg');

			const { user } = setupTest(component, { store });

			const recipients = times(5, () => createFakeIdentity().email);
			const recipientsInputElement = within(
				screen.getByTestId('redirect-recipients-address')
			).getByRole('textbox');
			const title = screen.getByText(/header\.redirect_email/i);

			await user.type(recipientsInputElement, recipients[0]);
			await user.click(title);
			await user.type(recipientsInputElement, recipients[1]);
			await user.click(title);
			await user.type(recipientsInputElement, recipients[2]);
			await user.click(title);
			await user.type(recipientsInputElement, recipients[3]);
			await user.click(title);
			await user.type(recipientsInputElement, recipients[4]);
			await user.click(title);

			const button = screen.getByRole('button', {
				name: /action\.redirect/i
			});
			expect(button).toBeEnabled();
			await user.click(button);

			const requestParameter = await interceptor;
			expect(requestParameter.m.id).toBe(msg.id);
			expect(requestParameter.m.e).toHaveLength(recipients.length);
			requestParameter.m.e.forEach((participant) => {
				expect(participant.t).toBe(ParticipantRole.TO);
				expect(recipients).toContain(participant.a);
			});
		});
	});

	describe('Tag action', () => {
		test('Add a tag to a message', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const msg = generateMessage({});
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: { [msg.id]: msg },
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const tag = faker.helpers.arrayElement(Object.values(getTags()));

			const component = <TagsDropdownItem tag={tag} conversation={msg} isMessage />;

			const interceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
			const { user } = setupTest(component, { store });

			const tagElement = screen.getByTestId(`tag-item-${tag.id}`);
			await user.click(tagElement);

			const requestParameter = await interceptor;
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('tag');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBe(tag.name);
		});

		test('Remove a tag from a message', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });
			const tag = faker.helpers.arrayElement(Object.values(getTags()));
			const msg = generateMessage({ tags: [tag.id] });
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: { [msg.id]: msg },
					searchRequestStatus: API_REQUEST_STATUS.fulfilled
				}
			});

			const component = <TagsDropdownItem tag={tag} conversation={msg} isMessage />;

			const interceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
			const { user } = setupTest(component, { store });

			const tagElement = screen.getByTestId(`tag-item-${tag.id}`);
			await user.click(tagElement);

			const requestParameter = await interceptor;
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('!tag');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBe(tag.name);
		});
	});
});
