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
import { FOLDERS_DESCRIPTORS, TIMEOUTS } from 'constants/index';
import { useMsgSetNotSpamDescriptor, useMsgSetNotSpamFn } from 'hooks/actions/use-msg-set-not-spam';
import { MsgActionRequest, MsgActionResponse } from 'types/soap/msg-action';

describe('useMsgSetNotSpam', () => {
	const ids = times(faker.number.int({ max: 42 }), () =>
		faker.number.int({ max: 42000 }).toString()
	);

	describe('Descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgSetNotSpamDescriptor, {
				initialProps: [{ ids, shouldReplaceHistory: false, folderId: FOLDERS.SPAM }]
			});

			expect(descriptor).toEqual({
				id: 'message-mark_as_not_spam',
				icon: 'AlertCircleOutline',
				label: 'Not spam',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});

	describe('Functions', () => {
		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: functions }
			} = setupHook(useMsgSetNotSpamFn, {
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
				${FOLDERS_DESCRIPTORS.INBOX}        | ${false}
				${FOLDERS_DESCRIPTORS.SENT}         | ${false}
				${FOLDERS_DESCRIPTORS.DRAFTS}       | ${false}
				${FOLDERS_DESCRIPTORS.TRASH}        | ${false}
				${FOLDERS_DESCRIPTORS.SPAM}         | ${true}
				${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${false}
			`(`should return $assertion if the folder is $folder.desc`, ({ folder, assertion }) => {
				const {
					result: { current: functions }
				} = setupHook(useMsgSetNotSpamFn, {
					initialProps: [{ ids, shouldReplaceHistory: false, folderId: folder.id }]
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
				} = setupHook(useMsgSetNotSpamFn, {
					initialProps: [{ ids, shouldReplaceHistory: false, folderId: FOLDERS.INBOX }]
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
							op: '!spam'
						}
					}
				);

				const {
					result: { current: functions }
				} = setupHook(useMsgSetNotSpamFn, {
					initialProps: [{ ids, shouldReplaceHistory: false, folderId: FOLDERS.SPAM }]
				});

				act(() => {
					functions.execute();
					vi.advanceTimersByTime(TIMEOUTS.SET_AS_SPAM);
				});

				const requestParameter = await apiInterceptor;
				expect(requestParameter.action.id).toBe(ids.join(','));
				expect(requestParameter.action.op).toBe('!spam');
				expect(requestParameter.action.l).toBeUndefined();
				expect(requestParameter.action.f).toBeUndefined();
				expect(requestParameter.action.tn).toBeUndefined();
			});

			it('should call onActionComplete when provided after setting messages as not spam', async () => {
				const onActionComplete = vi.fn();
				createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>('MsgAction', {
					action: {
						id: ids.join(','),
						op: '!spam'
					}
				});
				const {
					result: { current: functions }
				} = setupHook(useMsgSetNotSpamFn, {
					initialProps: [
						{ ids, shouldReplaceHistory: false, folderId: FOLDERS.SPAM, onActionComplete }
					]
				});

				await act(async () => {
					functions.execute();
					vi.advanceTimersByTime(TIMEOUTS.SET_AS_SPAM);
				});

				expect(onActionComplete).toHaveBeenCalledWith(ids);
			});
		});
	});
});
