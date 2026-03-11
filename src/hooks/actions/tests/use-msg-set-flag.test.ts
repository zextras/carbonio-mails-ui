/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from 'react';

import { faker } from '@faker-js/faker';
import { times } from 'lodash';

import { setupHook } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { useMsgSetFlagDescriptor, useMsgSetFlagFn } from 'hooks/actions/use-msg-set-flag';
import { MsgActionRequest, MsgActionResponse } from 'types/soap/msg-action';

describe('useMsgSetFlag', () => {
	describe('Descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgSetFlagDescriptor, { initialProps: [[], false] });

			expect(descriptor).toEqual({
				id: 'message-flag',
				icon: 'FlagOutline',
				label: 'Add flag',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});

	describe('Functions', () => {
		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgSetFlagFn, { initialProps: [[], false] });

			expect(descriptor).toEqual({
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});

		describe('canExecute', () => {
			it('should return false if the message is already flagged', () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgSetFlagFn, {
					initialProps: [['1'], true]
				});

				expect(functions.canExecute()).toEqual(false);
			});

			it('should return true if the message is not flagged', () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgSetFlagFn, {
					initialProps: [['1'], false]
				});

				expect(functions.canExecute()).toEqual(true);
			});
		});

		describe('execute', () => {
			it('should not call the API if the action cannot be executed', async () => {
				const callFlag = vi.fn();
				createSoapAPIInterceptor('MsgAction').then(callFlag);

				const {
					result: { current: functions }
				} = setupHook(useMsgSetFlagFn, { initialProps: [['1'], true] });

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
				} = setupHook(useMsgSetFlagFn, {
					initialProps: [ids, false]
				});

				functions.execute();

				const requestParameter = await apiInterceptor;
				expect(requestParameter.action.id).toBe(ids.join(','));
				expect(requestParameter.action.op).toBe('flag');
				expect(requestParameter.action.l).toBeUndefined();
				expect(requestParameter.action.f).toBeUndefined();
				expect(requestParameter.action.tn).toBeUndefined();
			});
		});
	});
});
