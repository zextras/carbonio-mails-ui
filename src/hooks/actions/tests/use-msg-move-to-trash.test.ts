/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from 'react';

import { faker } from '@faker-js/faker';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { times } from 'lodash';

import { setupHook } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateFoldersStore } from '@test-utils/store/folders';
import { FOLDERS_DESCRIPTORS } from 'constants/index';
import {
	useMsgMoveToTrashDescriptor,
	useMsgMoveToTrashFn
} from 'hooks/actions/use-msg-move-to-trash';
import { MsgActionRequest, MsgActionResponse } from 'types/soap/msg-action';

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
});
