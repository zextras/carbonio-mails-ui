/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { times } from 'lodash';
import { act } from 'react-dom/test-utils';

import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupHook } from '../../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS } from '../../../constants';
import { generateStore } from '../../../tests/generators/store';
import { MsgActionRequest } from '../../../types';
import { useMsgSetUnflagDescriptor, useMsgSetUnflagFn } from '../use-msg-set-unflag';

describe('useMsgSetUnflag', () => {
	describe('Descriptor', () => {
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
			} = setupHook(useMsgSetUnflagDescriptor, { store, initialProps: [[], true] });

			expect(descriptor).toEqual({
				id: 'message-unflag',
				icon: 'Flag',
				label: 'Remove flag',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});
	describe('Functions', () => {
		const store = generateStore({
			messages: {
				searchedInFolder: {},
				messages: {},
				searchRequestStatus: API_REQUEST_STATUS.fulfilled
			}
		});

		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgSetUnflagFn, { store, initialProps: [[], true] });

			expect(descriptor).toEqual({
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});

		describe('canExecute', () => {
			it('should return false if the message is not flagged', () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgSetUnflagFn, {
					store,
					initialProps: [['1'], false]
				});

				expect(functions.canExecute()).toEqual(false);
			});

			it('should return true if the message is flagged', () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgSetUnflagFn, {
					store,
					initialProps: [['1'], true]
				});

				expect(functions.canExecute()).toEqual(true);
			});
		});

		describe('execute', () => {
			it('should not call the API if the action cannot be executed', async () => {
				const callFlag = jest.fn();
				createSoapAPIInterceptor('MsgAction').then(callFlag);

				const {
					result: { current: functions }
				} = setupHook(useMsgSetUnflagFn, { store, initialProps: [['1'], false] });

				await act(async () => {
					functions.execute();
				});

				expect(callFlag).not.toHaveBeenCalled();
			});

			it('should call the API with the proper params if the action can be executed', async () => {
				const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
				const ids = times(faker.number.int({ max: 20 }), () => faker.number.int().toString());

				const {
					result: { current: functions }
				} = setupHook(useMsgSetUnflagFn, {
					store,
					initialProps: [ids, true]
				});

				functions.execute();

				const requestParameter = await apiInterceptor;
				expect(requestParameter.action.id).toBe(ids.join(','));
				expect(requestParameter.action.op).toBe('!flag');
				expect(requestParameter.action.l).toBeUndefined();
				expect(requestParameter.action.f).toBeUndefined();
				expect(requestParameter.action.tn).toBeUndefined();
			});
		});
	});
});
