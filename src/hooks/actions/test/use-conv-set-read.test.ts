/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { times } from 'lodash';
import { act } from 'react';

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupHook } from '../../../carbonio-ui-commons/test/test-setup';
import { FOLDERS_DESCRIPTORS } from '../../../constants';
import { generateStore } from '../../../tests/generators/store';
import { ConvActionRequest } from '../../../types';
import { useConvSetReadDescriptor, useConvSetReadFn } from '../use-conv-set-read';

describe('useConvSetRead', () => {
	describe('Descriptor', () => {
		const store = generateStore();
		const ids = times(faker.number.int({ max: 42 }), () =>
			faker.number.int({ max: 42000 }).toString()
		);

		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useConvSetReadDescriptor, {
				store,
				initialProps: [
					{
						ids,
						folderId: FOLDERS.INBOX,
						isConversationRead: false
					}
				]
			});

			expect(descriptor).toEqual({
				id: 'read-conversation',
				icon: 'EmailReadOutline',
				label: 'Mark as read',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});
	describe('Functions', () => {
		const store = generateStore();
		const ids = times(faker.number.int({ max: 42 }), () =>
			faker.number.int({ max: 42000 }).toString()
		);

		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useConvSetReadFn, {
				store,
				initialProps: [
					{
						ids,
						folderId: FOLDERS.INBOX,
						isConversationRead: false
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
				} = setupHook(useConvSetReadFn, {
					store,
					initialProps: [
						{
							ids,
							folderId: folder.id,
							isConversationRead: false
						}
					]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});

			it('should return false if the message is already read', () => {
				const {
					result: { current: functions }
				} = setupHook(useConvSetReadFn, {
					store,
					initialProps: [
						{
							ids,
							folderId: FOLDERS.INBOX,
							isConversationRead: true
						}
					]
				});

				expect(functions.canExecute()).toBe(false);
			});

			it('should return true if the message is not read yet', () => {
				const {
					result: { current: functions }
				} = setupHook(useConvSetReadFn, {
					store,
					initialProps: [
						{
							ids,
							folderId: FOLDERS.INBOX,
							isConversationRead: false
						}
					]
				});

				expect(functions.canExecute()).toBe(true);
			});
		});

		describe('execute', () => {
			it('should not call the API if the action cannot be executed', async () => {
				const callFlag = jest.fn();
				createSoapAPIInterceptor('ConvAction').then(callFlag);

				const {
					result: { current: functions }
				} = setupHook(useConvSetReadFn, {
					store,
					initialProps: [
						{
							ids,
							folderId: FOLDERS.INBOX,
							isConversationRead: true
						}
					]
				});

				await act(async () => {
					functions.execute();
				});

				expect(callFlag).not.toHaveBeenCalled();
			});

			it('should call the API with the proper params if the action can be executed', async () => {
				const apiInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

				const {
					result: { current: functions }
				} = setupHook(useConvSetReadFn, {
					store,
					initialProps: [
						{
							ids,
							folderId: FOLDERS.INBOX,
							isConversationRead: false
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
				expect(requestParameter.action.tn).toBeUndefined();
			});
		});
	});
});
