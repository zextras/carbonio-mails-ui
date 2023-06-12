/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act, screen, within } from '@testing-library/react';
import { times } from 'lodash';
import React from 'react';
import { rest } from 'msw';
import { ParticipantRole } from '../../carbonio-ui-commons/constants/participants';
import { getFolder } from '../../carbonio-ui-commons/store/zustand/folder';
import { getSetupServer } from '../../carbonio-ui-commons/test/jest-setup';
import { createFakeIdentity } from '../../carbonio-ui-commons/test/mocks/accounts/fakeAccounts';
import { FOLDERS } from '../../carbonio-ui-commons/test/mocks/carbonio-shell-ui-constants';
import { populateFoldersStore } from '../../carbonio-ui-commons/test/mocks/store/folders';
import { setupTest } from '../../carbonio-ui-commons/test/test-setup';
import { TIMEOUTS } from '../../constants';
import { generateMessage } from '../../tests/generators/generateMessage';
import { generateStore } from '../../tests/generators/store';
import {
	MailMessage,
	MsgActionRequest,
	RedirectMessageActionRequest,
	SaveDraftRequest,
	SendMsgParameters
} from '../../types';
import DeleteConvConfirm from '../delete-conv-modal';
import {
	moveMsgToTrash,
	sendDraft,
	setMsgAsSpam,
	setMsgFlag,
	setMsgRead
} from '../message-actions';
import MoveConvMessage from '../move-conv-msg';
import RedirectMessageAction from '../redirect-message-action';

function createAPIInterceptor<T>(apiAction: string): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		// Register a handler for the REST call
		getSetupServer().use(
			rest.post(`/service/soap/${apiAction}Request`, async (req, res, ctx) => {
				if (!req) {
					reject(new Error('Empty request'));
				}

				const reqActionParamWrapper = `${apiAction}Request`;
				const params = (await req.json()).Body?.[reqActionParamWrapper];
				resolve(params);

				// Don't care about the actual response
				return res(
					ctx.json({
						Body: {
							[`${apiAction}Response`]: {}
						}
					})
				);
			})
		);
	});
}

describe('Messages actions calls', () => {
	describe('Add flag action', () => {
		test('Single id', async () => {
			populateFoldersStore();
			const msg = generateMessage({});
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: [msg],
					status: {}
				}
			});

			const action = setMsgFlag({
				ids: [msg.id],
				dispatch: store.dispatch,
				value: false
			});

			act(() => {
				action.onClick(undefined);
			});

			const requestParameter = await createAPIInterceptor<MsgActionRequest>('MsgAction');
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('flag');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore();
			const msgs: Array<MailMessage> = times(10, () => generateMessage({}));
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: msgs,
					status: {}
				}
			});

			const msgIds = msgs.map<string>((msg) => msg.id);

			const action = setMsgFlag({
				ids: msgIds,
				dispatch: store.dispatch,
				value: false
			});

			act(() => {
				action.onClick(undefined);
			});

			const requestParameter = await createAPIInterceptor<MsgActionRequest>('MsgAction');
			expect(requestParameter.action.id).toBe(msgIds.join(','));
			expect(requestParameter.action.op).toBe('flag');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});

	describe('Remove flag action', () => {
		test('Single id', async () => {
			populateFoldersStore();
			const msg = generateMessage({});
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: [msg],
					status: {}
				}
			});

			const action = setMsgFlag({
				ids: [msg.id],
				dispatch: store.dispatch,
				value: true
			});

			act(() => {
				action.onClick(undefined);
			});

			const requestParameter = await createAPIInterceptor<MsgActionRequest>('MsgAction');
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('!flag');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore();
			const msgs: Array<MailMessage> = times(10, () => generateMessage({}));
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: msgs,
					status: {}
				}
			});

			const msgIds = msgs.map<string>((msg) => msg.id);

			const action = setMsgFlag({
				ids: msgIds,
				dispatch: store.dispatch,
				value: false
			});

			act(() => {
				action.onClick(undefined);
			});

			const requestParameter = await createAPIInterceptor<MsgActionRequest>('MsgAction');
			expect(requestParameter.action.id).toBe(msgIds.join(','));
			expect(requestParameter.action.op).toBe('flag');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});

	describe('Mark as read action', () => {
		test('Single id', async () => {
			populateFoldersStore();
			const msg = generateMessage({});
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: [msg],
					status: {}
				}
			});

			const action = setMsgRead({
				ids: [msg.id],
				dispatch: store.dispatch,
				value: false,
				folderId: msg.parent
			});

			act(() => {
				action.onClick(undefined);
			});

			const requestParameter = await createAPIInterceptor<MsgActionRequest>('MsgAction');
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('read');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore();
			const msgs: Array<MailMessage> = times(10, () => generateMessage({}));
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: msgs,
					status: {}
				}
			});

			const msgIds = msgs.map<string>((msg) => msg.id);

			const action = setMsgRead({
				ids: msgIds,
				dispatch: store.dispatch,
				value: false
			});

			act(() => {
				action.onClick(undefined);
			});

			const requestParameter = await createAPIInterceptor<MsgActionRequest>('MsgAction');
			expect(requestParameter.action.id).toBe(msgIds.join(','));
			expect(requestParameter.action.op).toBe('read');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});

	describe('Mark as unread action', () => {
		test('Single id', async () => {
			populateFoldersStore();
			const msg = generateMessage({});
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: [msg],
					status: {}
				}
			});

			const action = setMsgRead({
				ids: [msg.id],
				dispatch: store.dispatch,
				value: true,
				folderId: msg.parent
			});

			act(() => {
				action.onClick(undefined);
			});

			const requestParameter = await createAPIInterceptor<MsgActionRequest>('MsgAction');
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('!read');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore();
			const msgs: Array<MailMessage> = times(10, () => generateMessage({}));
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: msgs,
					status: {}
				}
			});

			const msgIds = msgs.map<string>((msg) => msg.id);

			const action = setMsgRead({
				ids: msgIds,
				dispatch: store.dispatch,
				value: true,
				folderId: FOLDERS.INBOX
			});

			act(() => {
				action.onClick(undefined);
			});

			const requestParameter = await createAPIInterceptor<MsgActionRequest>('MsgAction');
			expect(requestParameter.action.id).toBe(msgIds.join(','));
			expect(requestParameter.action.op).toBe('!read');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});

	describe('Mark as spam action', () => {
		test('Single id', async () => {
			populateFoldersStore();
			const msg = generateMessage({});
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: [msg],
					status: {}
				}
			});

			const action = setMsgAsSpam({
				ids: [msg.id],
				dispatch: store.dispatch,
				value: true,
				folderId: msg.parent
			});

			act(() => {
				action.onClick(undefined);
				jest.advanceTimersByTime(TIMEOUTS.SET_AS_SPAM);
			});

			const requestParameter = await createAPIInterceptor<MsgActionRequest>('MsgAction');
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('!spam');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore();
			const msgs: Array<MailMessage> = times(10, () => generateMessage({}));
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: msgs,
					status: {}
				}
			});

			const msgIds = msgs.map<string>((msg) => msg.id);

			const action = setMsgAsSpam({
				ids: msgIds,
				dispatch: store.dispatch,
				value: true,
				folderId: FOLDERS.INBOX
			});

			act(() => {
				action.onClick(undefined);
				jest.advanceTimersByTime(TIMEOUTS.SET_AS_SPAM);
			});

			const requestParameter = await createAPIInterceptor<MsgActionRequest>('MsgAction');
			expect(requestParameter.action.id).toBe(msgIds.join(','));
			expect(requestParameter.action.op).toBe('!spam');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});

	describe('Mark as not spam action', () => {
		test('Single id', async () => {
			populateFoldersStore();
			const msg = generateMessage({});
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: [msg],
					status: {}
				}
			});

			const action = setMsgAsSpam({
				ids: [msg.id],
				dispatch: store.dispatch,
				value: false,
				folderId: msg.parent
			});

			act(() => {
				action.onClick(undefined);
				jest.advanceTimersByTime(TIMEOUTS.SET_AS_SPAM);
			});

			const requestParameter = await createAPIInterceptor<MsgActionRequest>('MsgAction');
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('spam');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore();
			const msgs: Array<MailMessage> = times(10, () => generateMessage({}));
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: msgs,
					status: {}
				}
			});

			const msgIds = msgs.map<string>((msg) => msg.id);

			const action = setMsgAsSpam({
				ids: msgIds,
				dispatch: store.dispatch,
				value: false,
				folderId: FOLDERS.INBOX
			});

			act(() => {
				action.onClick(undefined);
				jest.advanceTimersByTime(TIMEOUTS.SET_AS_SPAM);
			});

			const requestParameter = await createAPIInterceptor<MsgActionRequest>('MsgAction');
			expect(requestParameter.action.id).toBe(msgIds.join(','));
			expect(requestParameter.action.op).toBe('spam');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});

	test.todo('Print action');

	test.todo('Show source');

	describe('Move to trash action', () => {
		test('Single id', async () => {
			populateFoldersStore();
			const msg = generateMessage({});
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: [msg],
					status: {}
				}
			});

			const action = moveMsgToTrash({
				ids: [msg.id],
				dispatch: store.dispatch,
				folderId: msg.parent
			});

			act(() => {
				action.onClick(undefined);
			});

			const requestParameter = await createAPIInterceptor<MsgActionRequest>('MsgAction');
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('trash');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore();
			const msgs: Array<MailMessage> = times(10, () => generateMessage({}));
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: msgs,
					status: {}
				}
			});

			const msgIds = msgs.map<string>((msg) => msg.id);

			const action = moveMsgToTrash({
				ids: msgIds,
				dispatch: store.dispatch,
				folderId: FOLDERS.INBOX
			});

			act(() => {
				action.onClick(undefined);
			});

			const requestParameter = await createAPIInterceptor<MsgActionRequest>('MsgAction');
			expect(requestParameter.action.id).toBe(msgIds.join(','));
			expect(requestParameter.action.op).toBe('trash');
			expect(requestParameter.action.l).toBeUndefined();
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});

	describe('Delete permanently action', () => {
		test('Single id', async () => {
			populateFoldersStore();
			const msg = generateMessage({});
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: [msg],
					status: {}
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

			const interceptor = createAPIInterceptor<MsgActionRequest>('MsgAction');

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
			populateFoldersStore();
			const msgs: Array<MailMessage> = times(10, () => generateMessage({}));
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: msgs,
					status: {}
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

			const interceptor = createAPIInterceptor<MsgActionRequest>('MsgAction');

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
			populateFoldersStore('message');
			const { children: inboxChildren } = getFolder(FOLDERS.INBOX) ?? {};
			const sourceFolder = inboxChildren?.[0].id ?? '';
			const destinationFolder = FOLDERS.INBOX;

			const msg = generateMessage({ folderId: sourceFolder });
			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: [msg],
					status: {}
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

			const interceptor = createAPIInterceptor<MsgActionRequest>('MsgAction');

			const { user } = setupTest(component, { store });
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
			await user.click(button);

			const requestParameter = await interceptor;
			expect(requestParameter.action.id).toBe(msg.id);
			expect(requestParameter.action.op).toBe('move');
			expect(requestParameter.action.l).toBe(destinationFolder);
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		test('Multiple ids', async () => {
			populateFoldersStore();

			const { children: inboxChildren } = getFolder(FOLDERS.INBOX) ?? {};
			const sourceFolder = inboxChildren?.[0].id ?? '';
			const destinationFolder = FOLDERS.INBOX;

			const msgs: Array<MailMessage> = times(10, () => generateMessage({ folderId: sourceFolder }));
			const msgIds = msgs.map<string>((msg) => msg.id);

			const store = generateStore({
				messages: {
					searchedInFolder: {},
					messages: msgs,
					status: {}
				}
			});

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

			const interceptor = createAPIInterceptor<MsgActionRequest>('MsgAction');

			const { user } = setupTest(component, { store });
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
			await user.click(button);

			const requestParameter = await interceptor;
			expect(requestParameter.action.id).toBe(msgIds.join(','));
			expect(requestParameter.action.op).toBe('move');
			expect(requestParameter.action.l).toBe(destinationFolder);
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});

	test.todo('Reply action');

	test.todo('Reply all action');

	test.todo('Forward action');

	test.todo('Edit as new action');

	test.todo('Edit draft action');

	test('Send draft action', async () => {
		populateFoldersStore();
		const msg = generateMessage({ folderId: FOLDERS.DRAFTS });
		const store = generateStore({
			messages: {
				searchedInFolder: {},
				messages: [msg],
				status: {}
			}
		});

		const action = sendDraft({
			id: msg.id, // FIXME this should be an editor Id
			message: msg,
			dispatch: store.dispatch
		});

		act(() => {
			action.onClick(undefined);
		});

		const requestParameter = await createAPIInterceptor<SaveDraftRequest>('SendMsg');
		expect(requestParameter.m.id).toBe(msg.id);
		expect(requestParameter.m.su).not.toBeUndefined();
		expect(requestParameter.m.e).not.toBeUndefined();
		expect(requestParameter.m.mp).not.toBeUndefined();
	});

	test('Redirect action', async () => {
		populateFoldersStore('message');
		const msg = generateMessage({});
		const store = generateStore({
			messages: {
				searchedInFolder: {},
				messages: [msg],
				status: {}
			}
		});

		const component = <RedirectMessageAction id={msg.id} onClose={jest.fn()} />;

		const interceptor = createAPIInterceptor<RedirectMessageActionRequest>('BounceMsg');

		const { user } = setupTest(component, { store });

		const recipient = createFakeIdentity().email;
		const recipientsInputElement = within(
			screen.getByTestId('redirect-recipients-address')
		).getByRole('textbox');

		await user.click(recipientsInputElement);
		await user.clear(recipientsInputElement);
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

	describe('Tag action', () => {
		test.todo('Single message');

		test.todo('Multiple messages');
	});
});
