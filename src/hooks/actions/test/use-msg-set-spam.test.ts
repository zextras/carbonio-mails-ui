/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { act } from '@testing-library/react';
import { times } from 'lodash';

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupHook } from '../../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS, FOLDERS_DESCRIPTORS, TIMEOUTS } from '../../../constants';
import { generateStore } from '../../../tests/generators/store';
import { MsgActionRequest, MsgActionResponse } from '../../../types';
import { useMsgSetSpamDescriptor, useMsgSetSpamFn } from '../use-msg-set-spam';

describe('useMsgSetSpam', () => {
	describe('Descriptor', () => {
		const ids = times(faker.number.int({ max: 42 }), () =>
			faker.number.int({ max: 42000 }).toString()
		);
		const store = generateStore({
			messages: {
				searchedInFolder: {},
				messages: {},
				searchRequestStatus: API_REQUEST_STATUS.fulfilled
			}
		});

		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgSetSpamDescriptor, {
				store,
				initialProps: [{ ids, shouldReplaceHistory: false, folderId: FOLDERS.SPAM }]
			});

			expect(descriptor).toEqual({
				id: 'message-mark_as_spam',
				icon: 'AlertCircle',
				label: 'Mark as spam',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});
	describe('Functions', () => {
		const ids = times(faker.number.int({ max: 42 }), () =>
			faker.number.int({ max: 42000 }).toString()
		);
		const store = generateStore();

		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: functions }
			} = setupHook(useMsgSetSpamFn, {
				store,
				initialProps: [{ ids, shouldReplaceHistory: false, folderId: FOLDERS.SPAM }]
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
				} = setupHook(useMsgSetSpamFn, {
					store,
					initialProps: [{ ids, shouldReplaceHistory: false, folderId: folder.id }]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			it('should not call the API if the action cannot be executed', async () => {
				const callFlag = jest.fn();
				createSoapAPIInterceptor('MsgAction').then(callFlag);

				const {
					result: { current: functions }
				} = setupHook(useMsgSetSpamFn, {
					store,
					initialProps: [{ ids, shouldReplaceHistory: false, folderId: FOLDERS.SPAM }]
				});

				await act(async () => {
					functions.execute();
				});

				expect(callFlag).not.toHaveBeenCalled();
			});

			it('should call the API with the proper params if the action can be executed', async () => {
				const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
					'MsgAction',
					{
						action: {
							id: ids.join(','),
							op: 'spam'
						}
					}
				);

				const {
					result: { current: functions }
				} = setupHook(useMsgSetSpamFn, {
					store,
					initialProps: [{ ids, shouldReplaceHistory: false, folderId: FOLDERS.INBOX }]
				});

				act(() => {
					functions.execute();
					jest.advanceTimersByTime(TIMEOUTS.SET_AS_SPAM);
				});

				const requestParameter = await apiInterceptor;
				expect(requestParameter.action.id).toBe(ids.join(','));
				expect(requestParameter.action.op).toBe('spam');
				expect(requestParameter.action.l).toBeUndefined();
				expect(requestParameter.action.f).toBeUndefined();
				expect(requestParameter.action.tn).toBeUndefined();
			});
		});
	});
});
