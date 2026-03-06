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
import { FOLDERS_DESCRIPTORS } from 'constants/index';
import { useMsgSetReadDescriptor, useMsgSetReadFn } from 'hooks/actions/use-msg-set-read';
import { MsgActionRequest, MsgActionResponse } from 'types/soap/msg-action';

describe('useMsgSetRead', () => {
	const ids = times(faker.number.int({ max: 42 }), () =>
		faker.number.int({ max: 42000 }).toString()
	);

	describe('Descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgSetReadDescriptor, {
				initialProps: [
					{
						ids,
						folderId: FOLDERS.INBOX,
						isMessageRead: false
					}
				]
			});

			expect(descriptor).toEqual({
				id: 'message-mark_as_read',
				icon: 'EmailReadOutline',
				label: 'Mark as read',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});

	describe('Functions', () => {
		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgSetReadFn, {
				initialProps: [
					{
						ids,
						folderId: FOLDERS.INBOX,
						isMessageRead: false
					}
				]
			});

			expect(descriptor).toEqual({
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});

		describe('canExecute', () => {
			it.each`
				folder                              | assertion
				${FOLDERS_DESCRIPTORS.INBOX}        | ${true}
				${FOLDERS_DESCRIPTORS.SENT}         | ${true}
				${FOLDERS_DESCRIPTORS.DRAFTS}       | ${false}
				${FOLDERS_DESCRIPTORS.TRASH}        | ${true}
				${FOLDERS_DESCRIPTORS.SPAM}         | ${true}
				${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${true}
			`(`should return $assertion if the folder is $folder.desc`, ({ folder, assertion }) => {
				const {
					result: { current: functions }
				} = setupHook(useMsgSetReadFn, {
					initialProps: [
						{
							ids,
							folderId: folder.id,
							isMessageRead: false
						}
					]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});

			it('should return false if the message is already read', () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgSetReadFn, {
					initialProps: [
						{
							ids,
							folderId: FOLDERS.INBOX,
							isMessageRead: true
						}
					]
				});

				expect(functions.canExecute()).toBe(false);
			});

			it('should return true if the message is not read yet', () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgSetReadFn, {
					initialProps: [
						{
							ids,
							folderId: FOLDERS.INBOX,
							isMessageRead: false
						}
					]
				});

				expect(functions.canExecute()).toBe(true);
			});
		});

		describe('execute', () => {
			it('should not call the API if the action cannot be executed', async () => {
				const callFlag = vi.fn();
				createSoapAPIInterceptor('MsgAction').then(callFlag);

				const {
					result: { current: functions }
				} = setupHook(useMsgSetReadFn, {
					initialProps: [
						{
							ids,
							folderId: FOLDERS.INBOX,
							isMessageRead: true
						}
					]
				});

				await act(async () => {
					functions.execute();
				});

				expect(callFlag).not.toHaveBeenCalled();
			});

			it('should call the API with the proper params if the action can be executed', async () => {
				const response: MsgActionResponse = {
					action: {
						id: '',
						op: 'trash'
					}
				};
				const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
					'MsgAction',
					response
				);
				const ids = times(faker.number.int({ max: 20 }), () => faker.number.int().toString());

				const {
					result: { current: functions }
				} = setupHook(useMsgSetReadFn, {
					initialProps: [
						{
							ids,
							folderId: FOLDERS.INBOX,
							isMessageRead: false
						}
					]
				});

				await act(async () => {
					functions.execute();
				});

				const requestParameter = await apiInterceptor;
				expect(requestParameter.action.id).toBe(ids.join(','));
				expect(requestParameter.action.op).toBe('read');
				expect(requestParameter.action.l).toBeUndefined();
				expect(requestParameter.action.f).toBeUndefined();
				expect(requestParameter.action.tn).toBeUndefined();
			});
		});
	});
});
