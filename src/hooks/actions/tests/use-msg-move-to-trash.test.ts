/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from 'react';

import { faker } from '@faker-js/faker';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { times } from 'lodash';
import type { Mock } from 'vitest';

import { screen, setupHook } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateFoldersStore } from '@test-utils/store/folders';
import { FOLDERS_DESCRIPTORS, MAILS_ROUTE, SEARCH_ROUTE } from 'constants/index';
import {
	useMsgMoveToTrashDescriptor,
	useMsgMoveToTrashFn
} from 'hooks/actions/use-msg-move-to-trash';
import { MsgActionRequest, MsgActionResponse } from 'types/soap/msg-action';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => ({
	...(await vi.importActual('react-router-dom')),
	useNavigate: (): Mock => mockNavigate
}));

describe('useMsgMoveToTrash', () => {
	populateFoldersStore();
	const messagesId = times(faker.number.int({ max: 42 }), () =>
		faker.number.int({ max: 42000 }).toString()
	);

	describe('Descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgMoveToTrashDescriptor, {
				initialProps: [{ ids: messagesId, messageFolderId: FOLDERS.INBOX }]
			});

			expect(descriptor).toEqual({
				id: 'message-trash',
				icon: 'Trash2Outline',
				label: 'Delete',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});

	describe('Functions', () => {
		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: functions }
			} = setupHook(useMsgMoveToTrashFn, {
				initialProps: [{ ids: messagesId, messageFolderId: FOLDERS.INBOX }]
			});

			expect(functions).toEqual({
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});

		describe('canExecute', () => {
			it.each`
				folder                              | assertion
				${FOLDERS_DESCRIPTORS.INBOX}        | ${true}
				${FOLDERS_DESCRIPTORS.SENT}         | ${true}
				${FOLDERS_DESCRIPTORS.DRAFTS}       | ${true}
				${FOLDERS_DESCRIPTORS.TRASH}        | ${false}
				${FOLDERS_DESCRIPTORS.SPAM}         | ${true}
				${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${true}
			`(`should return $assertion if the folder is $folder.desc`, ({ folder, assertion }) => {
				const {
					result: { current: functions }
				} = setupHook(useMsgMoveToTrashFn, {
					initialProps: [{ ids: messagesId, messageFolderId: folder.id }]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			it('should call the API with the proper parameters', async () => {
				const apiResponse: MsgActionResponse = {
					action: {
						id: messagesId.join(','),
						op: 'trash'
					}
				};
				const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
					'MsgAction',
					apiResponse
				);

				const {
					result: { current: functions }
				} = setupHook(useMsgMoveToTrashFn, {
					initialProps: [{ ids: messagesId, messageFolderId: FOLDERS.INBOX }]
				});

				await act(async () => {
					functions.execute();
				});

				const requestParameter = await apiInterceptor;
				expect(requestParameter.action.id).toBe(messagesId.join(','));
				expect(requestParameter.action.op).toBe('trash');
				expect(requestParameter.action.l).toBeUndefined();
				expect(requestParameter.action.f).toBeUndefined();
				expect(requestParameter.action.tn).toBeUndefined();
			});

			it('should not call the API if the action cannot be executed', async () => {
				const apiCallSpy = vi.fn();
				createSoapAPIInterceptor<MsgActionRequest>('MsgAction').then(apiCallSpy);

				const {
					result: { current: functions }
				} = setupHook(useMsgMoveToTrashFn, {
					initialProps: [{ ids: messagesId, messageFolderId: FOLDERS.TRASH }]
				});

				await act(async () => {
					functions.execute();
				});

				expect(apiCallSpy).not.toHaveBeenCalled();
			});

			it('should call onActionComplete when provided after moving messages to trash', async () => {
				const onActionComplete = vi.fn();
				createSoapAPIInterceptor('MsgAction');

				const {
					result: { current: functions }
				} = setupHook(useMsgMoveToTrashFn, {
					initialProps: [
						{
							ids: messagesId,
							messageFolderId: FOLDERS.INBOX,
							onActionComplete
						}
					]
				});

				await act(async () => {
					functions.execute();
				});

				expect(onActionComplete).toHaveBeenCalledWith(messagesId);
			});
		});
	});

	describe('Undo', () => {
		beforeEach(() => {
			mockNavigate.mockClear();
		});

		it('should reopen the restored message when not in the search module', async () => {
			createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>('MsgAction', {
				action: { id: '1', op: 'trash' }
			});
			const { result, user } = setupHook(useMsgMoveToTrashFn, {
				initialEntries: [`/${MAILS_ROUTE}/folder/${FOLDERS.INBOX}/message/1`],
				initialProps: [
					{
						ids: ['1'],
						messageFolderId: FOLDERS.INBOX,
						routeFolderId: FOLDERS.INBOX,
						shouldReplaceHistory: true
					}
				]
			});

			await act(async () => {
				result.current.execute();
			});
			mockNavigate.mockClear();
			await user.click(screen.getByRole('button', { name: /undo/i }));

			await vi.waitFor(() =>
				expect(mockNavigate).toHaveBeenCalledWith(
					`/${MAILS_ROUTE}/folder/${FOLDERS.INBOX}/message/1`,
					{ replace: true }
				)
			);
		});

		it('should not navigate when in the search module', async () => {
			createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>('MsgAction', {
				action: { id: '1', op: 'trash' }
			});
			const { result, user } = setupHook(useMsgMoveToTrashFn, {
				initialEntries: [`/${SEARCH_ROUTE}/message/1`],
				initialProps: [
					{
						ids: ['1'],
						messageFolderId: FOLDERS.INBOX,
						routeFolderId: FOLDERS.INBOX,
						shouldReplaceHistory: true
					}
				]
			});

			await act(async () => {
				result.current.execute();
			});
			await user.click(screen.getByRole('button', { name: /undo/i }));

			expect(await screen.findByText('E-mail restored in destination folder')).toBeVisible();
			expect(mockNavigate).not.toHaveBeenCalled();
		});
	});
});
