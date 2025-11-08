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
import { useConvSetUnreadDescriptor, useConvSetUnreadFn } from 'hooks/actions/use-conv-set-unread';
import { ConvActionRequest, ConvActionResponse } from 'types/index.d';
import * as uiActionsUtils from 'ui-actions/utils';

const mockNavigate = jest.fn();
const mockUseInSearchModule = jest.fn();

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useNavigate: (): jest.Mock => mockNavigate
}));

jest.spyOn(uiActionsUtils, 'useInSearchModule').mockImplementation(() => mockUseInSearchModule());

describe('useConvSetUnread', () => {
	describe('Descriptor', () => {
		const ids = times(faker.number.int({ max: 42 }), () =>
			faker.number.int({ max: 42000 }).toString()
		);

		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useConvSetUnreadDescriptor, {
				initialProps: [
					{
						ids,
						folderId: FOLDERS.INBOX,
						isConversationRead: true
					}
				]
			});

			expect(descriptor).toEqual({
				id: 'unread-conversation',
				icon: 'EmailOutline',
				label: 'Mark as unread',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});
	describe('Functions', () => {
		const ids = times(faker.number.int({ max: 42 }), () =>
			faker.number.int({ max: 42000 }).toString()
		);

		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useConvSetUnreadFn, {
				initialProps: [
					{
						ids,
						folderId: FOLDERS.INBOX,
						isConversationRead: true
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
				} = setupHook(useConvSetUnreadFn, {
					initialProps: [
						{
							ids,
							folderId: folder.id,
							isConversationRead: true
						}
					]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});

			it('should return false if the message is not read yet', () => {
				const {
					result: { current: functions }
				} = setupHook(useConvSetUnreadFn, {
					initialProps: [
						{
							ids,
							folderId: FOLDERS.INBOX,
							isConversationRead: false
						}
					]
				});

				expect(functions.canExecute()).toBe(false);
			});

			it('should return true if the message is read', () => {
				const {
					result: { current: functions }
				} = setupHook(useConvSetUnreadFn, {
					initialProps: [
						{
							ids,
							folderId: FOLDERS.INBOX,
							isConversationRead: true
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
				} = setupHook(useConvSetUnreadFn, {
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

				expect(callFlag).not.toHaveBeenCalled();
			});

			it('should call the API with the proper params if the action can be executed', async () => {
				const apiInterceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

				const {
					result: { current: functions }
				} = setupHook(useConvSetUnreadFn, {
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

				const requestParameter = await apiInterceptor;
				expect(requestParameter.action.id).toBe(ids.join(','));
				expect(requestParameter.action.op).toBe('!read');
				expect(requestParameter.action.l).toBeUndefined();
				expect(requestParameter.action.tn).toBeUndefined();
			});

			describe('Navigation after execution', () => {
				beforeEach(() => {
					mockNavigate.mockClear();
					mockUseInSearchModule.mockClear();
				});

				it('should navigate to search route when in search context and shouldReplaceHistory is true', async () => {
					mockUseInSearchModule.mockReturnValue(true);

					const response: ConvActionResponse = {
						action: {
							id: '123',
							op: '!read'
						}
					};
					createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>('ConvAction', response);

					const testIds = ['1', '2'];
					const { result } = setupHook(useConvSetUnreadFn, {
						initialProps: [
							{
								ids: testIds,
								folderId: FOLDERS.INBOX,
								isConversationRead: true,
								shouldReplaceHistory: true
							}
						]
					});

					await act(async () => {
						result.current.execute();
					});

					expect(mockNavigate).toHaveBeenCalledWith('/search', { replace: true });
				});

				it('should navigate to folder route when not in search context and shouldReplaceHistory is true', async () => {
					mockUseInSearchModule.mockReturnValue(false);

					const response: ConvActionResponse = {
						action: {
							id: '123',
							op: '!read'
						}
					};
					createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>('ConvAction', response);

					const testIds = ['1', '2'];
					const { result } = setupHook(useConvSetUnreadFn, {
						initialProps: [
							{
								ids: testIds,
								folderId: FOLDERS.INBOX,
								isConversationRead: true,
								shouldReplaceHistory: true
							}
						]
					});

					await act(async () => {
						result.current.execute();
					});

					expect(mockNavigate).toHaveBeenCalledWith('/mails/folder/2', { replace: true });
				});

				it('should not navigate when shouldReplaceHistory is false in search context', async () => {
					mockUseInSearchModule.mockReturnValue(true);

					const response: ConvActionResponse = {
						action: {
							id: '123',
							op: '!read'
						}
					};
					createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>('ConvAction', response);

					const testIds = ['1', '2'];
					const { result } = setupHook(useConvSetUnreadFn, {
						initialProps: [
							{
								ids: testIds,
								folderId: FOLDERS.INBOX,
								isConversationRead: true,
								shouldReplaceHistory: false
							}
						]
					});

					await act(async () => {
						result.current.execute();
					});

					expect(mockNavigate).not.toHaveBeenCalled();
				});

				it('should not navigate when shouldReplaceHistory is false in folder context', async () => {
					mockUseInSearchModule.mockReturnValue(false);

					const response: ConvActionResponse = {
						action: {
							id: '123',
							op: '!read'
						}
					};
					createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>('ConvAction', response);

					const testIds = ['1', '2'];
					const { result } = setupHook(useConvSetUnreadFn, {
						initialProps: [
							{
								ids: testIds,
								folderId: FOLDERS.INBOX,
								isConversationRead: true,
								shouldReplaceHistory: false
							}
						]
					});

					await act(async () => {
						result.current.execute();
					});

					expect(mockNavigate).not.toHaveBeenCalled();
				});

				it('should not navigate when API returns a fault', async () => {
					mockUseInSearchModule.mockReturnValue(true);

					const response = {
						Fault: {
							Code: { Value: 'soap:Sender' },
							Reason: { Text: 'Error' }
						}
					};
					createSoapAPIInterceptor<ConvActionRequest, typeof response>('ConvAction', response);

					const testIds = ['1', '2'];
					const { result } = setupHook(useConvSetUnreadFn, {
						initialProps: [
							{
								ids: testIds,
								folderId: FOLDERS.INBOX,
								isConversationRead: true,
								shouldReplaceHistory: true
							}
						]
					});

					await act(async () => {
						result.current.execute();
					});

					expect(mockNavigate).not.toHaveBeenCalled();
				});
			});
		});
	});
});
