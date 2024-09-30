/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from '@testing-library/react';
import { find, forEach } from 'lodash';

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { useTags } from '../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupHook } from '../../../carbonio-ui-commons/test/test-setup';
import { FOLDERS_DESCRIPTORS } from '../../../constants';
import { generateMessage } from '../../../tests/generators/generateMessage';
import { generateStore } from '../../../tests/generators/store';
import { ConvActionRequest } from '../../../types';
import { useMsgApplyTagDescriptor, useMsgApplyTagSubDescriptors } from '../use-msg-apply-tag';

describe('useMsgApplyTag', () => {
	const msg = generateMessage();
	const store = generateStore();

	describe('Descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgApplyTagDescriptor, {
				initialProps: [{ ids: [msg.id], folderId: FOLDERS.INBOX, messageTags: ['1'] }],
				store
			});

			expect(descriptor).toEqual({
				id: 'apply-tag',
				icon: 'TagsMoreOutline',
				label: 'Tag',
				items: expect.arrayContaining([
					expect.objectContaining({
						canExecute: expect.any(Function),
						execute: expect.any(Function),
						color: expect.any(Number),
						icon: expect.any(String),
						id: expect.any(String),
						label: expect.any(String)
					})
				])
			});
		});
	});

	describe('SubDescriptors', () => {
		it('Should return an object with specific icon if message does not contains the tag', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgApplyTagSubDescriptors, {
				initialProps: [{ ids: [msg.id], folderId: FOLDERS.INBOX, messageTags: [] }],
				store
			});
			expect(descriptor[0]).toEqual(
				expect.objectContaining({
					canExecute: expect.any(Function),
					execute: expect.any(Function),
					color: expect.any(Number),
					icon: 'Tag',
					id: expect.any(String),
					label: expect.any(String)
				})
			);
		});

		it('Should return an object with specific icon if conversation contains the tag', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgApplyTagSubDescriptors, {
				initialProps: [{ ids: [msg.id], folderId: FOLDERS.INBOX, messageTags: ['2291'] }],
				store
			});
			expect(descriptor[0]).toEqual({
				canExecute: expect.any(Function),
				execute: expect.any(Function),
				color: expect.any(Number),
				icon: 'TagOutline',
				id: expect.any(String),
				label: expect.any(String)
			});
		});
		it('Should return a descriptor for every existing tag', () => {
			const tags = {
				'1': {
					id: '1',
					name: 'tag 1'
				},
				'2': {
					id: '2',
					name: 'tag 2'
				},
				'3': {
					id: '3',
					name: 'tag 3'
				},
				'4': {
					id: '4',
					name: 'tag 4'
				},
				'5': {
					id: '5',
					name: 'tag 5'
				}
			};
			useTags.mockReturnValue(tags);
			const {
				result: { current: descriptor }
			} = setupHook(useMsgApplyTagDescriptor, {
				initialProps: [{ ids: [msg.id], folderId: FOLDERS.INBOX, messageTags: msg.tags }],
				store
			});

			expect(descriptor.items).toHaveLength(5);
			forEach(tags, (tag) => {
				const item = find(descriptor.items, (subDescriptor) => subDescriptor.id === tag.id);
				expect(item).toBeDefined();
			});
		});

		describe('canExecute', () => {
			it.each`
				folder                              | assertion
				${FOLDERS_DESCRIPTORS.INBOX}        | ${true}
				${FOLDERS_DESCRIPTORS.SENT}         | ${true}
				${FOLDERS_DESCRIPTORS.DRAFTS}       | ${true}
				${FOLDERS_DESCRIPTORS.TRASH}        | ${true}
				${FOLDERS_DESCRIPTORS.SPAM}         | ${false}
				${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${true}
			`(`should return $assertion if the folder is $folder.desc`, ({ folder, assertion }) => {
				const tags = {
					'1': {
						id: '1',
						name: 'tag 1'
					}
				};
				useTags.mockReturnValue(tags);

				const {
					result: { current: descriptor }
				} = setupHook(useMsgApplyTagSubDescriptors, {
					initialProps: [{ ids: [msg.id], folderId: folder.id, messageTags: ['1'] }],
					store
				});

				expect(descriptor[0].canExecute()).toEqual(assertion);
			});
		});

		describe('canExecute', () => {
			it('should call the API to remove the tag from the message', async () => {
				const tags = {
					'1': {
						id: '1',
						name: 'tag 1'
					}
				};
				useTags.mockReturnValue(tags);
				const interceptor = createSoapAPIInterceptor<ConvActionRequest>('MsgAction');
				const {
					result: { current: descriptor }
				} = setupHook(useMsgApplyTagSubDescriptors, {
					initialProps: [{ ids: [msg.id], folderId: FOLDERS.INBOX, messageTags: ['1'] }],
					store
				});

				await act(async () => {
					descriptor[0].execute();
				});
				const requestParameter = await interceptor;

				expect(requestParameter.action.id).toBe(msg.id);
				expect(requestParameter.action.op).toBe('!tag');
				expect(requestParameter.action.l).toBeUndefined();
			});

			it('should call the API to add the tag from the message', async () => {
				const tags = {
					'1': {
						id: '1',
						name: 'tag 1'
					}
				};
				useTags.mockReturnValue(tags);
				const interceptor = createSoapAPIInterceptor<ConvActionRequest>('MsgAction');
				const {
					result: { current: descriptor }
				} = setupHook(useMsgApplyTagSubDescriptors, {
					initialProps: [{ ids: [msg.id], folderId: FOLDERS.INBOX, messageTags: [] }],
					store
				});

				await act(async () => {
					descriptor[0].execute();
				});
				const requestParameter = await interceptor;

				expect(requestParameter.action.id).toBe(msg.id);
				expect(requestParameter.action.op).toBe('tag');
				expect(requestParameter.action.l).toBeUndefined();
			});
		});
	});
});
