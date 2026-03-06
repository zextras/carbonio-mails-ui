/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from 'react';

import { faker } from '@faker-js/faker';
import { FOLDER_VIEW, FOLDERS } from '@zextras/carbonio-ui-commons';
import { times } from 'lodash';

import { useConvArchiveDescriptor, useConvArchiveFn } from '../use-conv-archive';
import { setupHook } from '@test-setup';
import { generateFolder } from '@test-utils/folders/folders-generator';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateFoldersStore } from '@test-utils/store/folders';
import { TIMERS } from '__test__/constants';
import { FOLDERS_DESCRIPTORS } from 'constants/index';
import { ConvActionRequest, ConvActionResponse } from 'types/soap/conv-action';

describe('useConvArchive', () => {
	const conversationsId = times(faker.number.int({ max: 42 }), () =>
		faker.number.int({ max: 42000 }).toString()
	);

	describe('Conversation Archive Action not usable when system ARCHIVE folder is not available', () => {
		it('should not call the API if the action cannot be executed', async () => {
			const apiCallSpy = vi.fn();
			createSoapAPIInterceptor<ConvActionRequest>('ConvAction').then(apiCallSpy);

			const {
				result: { current: functions }
			} = setupHook(useConvArchiveFn, {
				initialProps: [{ conversationIds: conversationsId, folderId: FOLDERS.INBOX }]
			});

			act(() => functions.execute());

			expect(apiCallSpy).not.toHaveBeenCalled();
		});
	});

	describe('useConvArchive when system Archive folder is available', () => {
		populateFoldersStore({
			view: FOLDER_VIEW.conversation,
			customFolders: [generateFolder({ id: FOLDERS.ARCHIVE, name: 'Archive', deletable: false })]
		});

		describe('descriptor', () => {
			it('Should return an object with specific id, icon, label and 2 functions', () => {
				const {
					result: { current: descriptor }
				} = setupHook(useConvArchiveDescriptor, {
					initialProps: [{ conversationIds: conversationsId, folderId: FOLDERS.INBOX }]
				});

				expect(descriptor).toEqual({
					id: 'conversation-archive',
					icon: 'ArchiveOutline',
					label: 'Archive',
					execute: expect.any(Function),
					canExecute: expect.any(Function)
				});
			});
		});

		describe('functions', () => {
			it('Should return an object with execute and canExecute functions', () => {
				const {
					result: { current: functions }
				} = setupHook(useConvArchiveFn, {
					initialProps: [{ conversationIds: conversationsId, folderId: FOLDERS.INBOX }]
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
					${FOLDERS_DESCRIPTORS.TRASH}        | ${true}
					${FOLDERS_DESCRIPTORS.SPAM}         | ${true}
					${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${true}
					${FOLDERS_DESCRIPTORS.ARCHIVE}      | ${false}
				`(`should return $assertion if the folder is $folder.desc`, ({ folder, assertion }) => {
					const {
						result: { current: functions }
					} = setupHook(useConvArchiveFn, {
						initialProps: [{ conversationIds: conversationsId, folderId: folder.id }]
					});

					expect(functions.canExecute()).toEqual(assertion);
				});

				it('should return false when conversations are already in the Archive folder - archive action should not appear', () => {
					const {
						result: { current: functions }
					} = setupHook(useConvArchiveFn, {
						initialProps: [{ conversationIds: conversationsId, folderId: FOLDERS.ARCHIVE }]
					});

					expect(functions.canExecute()).toBe(false);
				});
			});

			describe('execute', () => {
				it('should call the API with the proper parameters', async () => {
					const apiResponse: ConvActionResponse = {
						action: {
							id: conversationsId.join(','),
							op: 'move'
						}
					};
					const apiInterceptor = createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>(
						'ConvAction',
						apiResponse
					);

					const {
						result: { current: functions }
					} = setupHook(useConvArchiveFn, {
						initialProps: [{ conversationIds: conversationsId, folderId: FOLDERS.INBOX }]
					});

					await act(async () => {
						functions.execute();
					});

					const requestParameter = await apiInterceptor;
					expect(requestParameter.action.id).toBe(conversationsId.join(','));
					expect(requestParameter.action.op).toBe('move');
					expect(requestParameter.action.l).toBe(FOLDERS.ARCHIVE);
					expect(requestParameter.action.tn).toBeUndefined();
				});

				it('should call onActionComplete when provided after successful archive', async () => {
					const onActionComplete = vi.fn();
					createSoapAPIInterceptor<ConvActionRequest>('ConvAction');

					const {
						result: { current: functions }
					} = setupHook(useConvArchiveFn, {
						initialProps: [
							{
								conversationIds: conversationsId,
								folderId: FOLDERS.INBOX,
								onActionComplete
							}
						]
					});

					await act(async () => {
						functions.execute();
					});

					act(() => {
						vi.advanceTimersByTime(TIMERS.modal_open_delay);
					});

					expect(onActionComplete).toHaveBeenCalledWith(conversationsId);
				});
			});
		});
	});
});
