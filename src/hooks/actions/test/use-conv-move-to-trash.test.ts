/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { times } from 'lodash';
import { act } from 'react';

import { FOLDER_VIEW } from '../../../carbonio-ui-commons/constants';
import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../../carbonio-ui-commons/test/mocks/store/folders';
import { setupHook } from '../../../carbonio-ui-commons/test/test-setup';
import { FOLDERS_DESCRIPTORS } from '../../../constants';
import { generateStore } from '../../../tests/generators/store';
import { MsgActionRequest, MsgActionResponse } from '../../../types';
import { useConvMoveToTrashDescriptor, useConvMoveToTrashFn } from '../use-conv-move-to-trash';

describe('useConMoveToTrash', () => {
	populateFoldersStore({ view: FOLDER_VIEW.message });
	const conversationsId = times(faker.number.int({ max: 42 }), () =>
		faker.number.int({ max: 42000 }).toString()
	);
	const store = generateStore();

	describe('descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useConvMoveToTrashDescriptor, {
				store,
				initialProps: [{ ids: conversationsId, deselectAll: jest.fn(), folderId: FOLDERS.INBOX }]
			});

			expect(descriptor).toEqual({
				id: 'conversation-trash',
				icon: 'Trash2Outline',
				label: 'Delete',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});

	describe('functions', () => {
		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: functions }
			} = setupHook(useConvMoveToTrashFn, {
				store,
				initialProps: [{ ids: conversationsId, deselectAll: jest.fn(), folderId: FOLDERS.INBOX }]
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
				} = setupHook(useConvMoveToTrashFn, {
					store,
					initialProps: [{ ids: conversationsId, deselectAll: jest.fn(), folderId: folder.id }]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			it('should call the API with the proper parameters', async () => {
				const apiResponse: MsgActionResponse = {
					action: {
						id: conversationsId.join(','),
						op: 'trash'
					}
				};
				const apiInterceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
					'ConvAction',
					apiResponse
				);

				const {
					result: { current: functions }
				} = setupHook(useConvMoveToTrashFn, {
					store,
					initialProps: [{ ids: conversationsId, deselectAll: jest.fn(), folderId: FOLDERS.INBOX }]
				});

				await act(async () => {
					functions.execute();
				});

				const requestParameter = await apiInterceptor;
				expect(requestParameter.action.id).toBe(conversationsId.join(','));
				expect(requestParameter.action.op).toBe('trash');
				expect(requestParameter.action.l).toBeUndefined();
				expect(requestParameter.action.f).toBeUndefined();
				expect(requestParameter.action.tn).toBeUndefined();
			});

			it('should not call the API if the action cannot be executed', async () => {
				const apiCallSpy = jest.fn();
				createSoapAPIInterceptor<MsgActionRequest>('ConvAction').then(apiCallSpy);

				const {
					result: { current: functions }
				} = setupHook(useConvMoveToTrashFn, {
					store,
					initialProps: [{ ids: conversationsId, deselectAll: jest.fn(), folderId: FOLDERS.TRASH }]
				});

				await act(async () => {
					functions.execute();
				});

				expect(apiCallSpy).not.toHaveBeenCalled();
			});
		});
	});
});
