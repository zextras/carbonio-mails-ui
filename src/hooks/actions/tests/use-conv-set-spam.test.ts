/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { act } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { times } from 'lodash';

import { setupHook } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { FOLDERS_DESCRIPTORS } from 'constants/index';
import { useConvSetSpamDescriptor, useConvSetSpamFn } from 'hooks/actions/use-conv-set-spam';
import { ConvActionRequest, ConvActionResponse } from 'types/soap/conv-action';

describe('useConvSetSpam', () => {
	describe('descriptor', () => {
		const ids = times(faker.number.int({ max: 42 }), () =>
			faker.number.int({ max: 42000 }).toString()
		);

		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useConvSetSpamDescriptor, {
				initialProps: [{ ids, folderId: FOLDERS.SPAM }]
			});

			expect(descriptor).toEqual({
				id: 'conversation-mark_as_spam',
				icon: 'AlertCircle',
				label: 'Mark as spam',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});
	describe('useConvMarkAsSpamFn', () => {
		const ids = times(faker.number.int({ max: 42 }), () =>
			faker.number.int({ max: 42000 }).toString()
		);

		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: functions }
			} = setupHook(useConvSetSpamFn, {
				initialProps: [{ ids, folderId: FOLDERS.SPAM }]
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
				${FOLDERS_DESCRIPTORS.DRAFTS}       | ${false}
				${FOLDERS_DESCRIPTORS.TRASH}        | ${true}
				${FOLDERS_DESCRIPTORS.SPAM}         | ${false}
				${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${true}
			`(`should return $assertion if the folder is $folder.desc`, ({ folder, assertion }) => {
				const {
					result: { current: functions }
				} = setupHook(useConvSetSpamFn, {
					initialProps: [{ ids, folderId: folder.id }]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			it('should not call the API if the action cannot be executed', async () => {
				const callFlag = vi.fn();
				createSoapAPIInterceptor('MsgAction').then(callFlag);

				const {
					result: { current: functions }
				} = setupHook(useConvSetSpamFn, {
					initialProps: [{ ids, folderId: FOLDERS.SPAM }]
				});

				await act(async () => {
					functions.execute();
				});

				expect(callFlag).not.toHaveBeenCalled();
			});

			it('should call the API with the proper params if the action can be executed', async () => {
				const apiInterceptor = createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>(
					'ConvAction',
					{
						action: {
							id: ids.join(','),
							op: 'spam'
						}
					}
				);

				const {
					result: { current: functions }
				} = setupHook(useConvSetSpamFn, {
					initialProps: [{ ids, folderId: FOLDERS.INBOX }]
				});

				await act(async () => {
					functions.execute();
				});

				const requestParameter = await apiInterceptor;
				expect(requestParameter.action.id).toBe(ids.join(','));
				expect(requestParameter.action.op).toBe('spam');
				expect(requestParameter.action.l).toBeUndefined();
				expect(requestParameter.action.tn).toBeUndefined();
			});

			it('should call onActionComplete when provided after the conversation is marked as spam', async () => {
				const onActionComplete = vi.fn();
				createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>('ConvAction');

				const {
					result: { current: functions }
				} = setupHook(useConvSetSpamFn, {
					initialProps: [{ ids, folderId: FOLDERS.INBOX, onActionComplete }]
				});
				await act(async () => {
					functions.execute();
				});

				expect(onActionComplete).toHaveBeenCalledWith(ids);
			});
		});
	});
});
