/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from '@testing-library/react';
import { FOLDERS, useTagStore } from '@zextras/carbonio-ui-commons';
import { find, forEach } from 'lodash';

import { setupHook } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateConversation } from '__test__/generators/generateConversation';
import { FOLDERS_DESCRIPTORS } from 'constants/index';
import {
	useConvApplyTagDescriptor,
	useConvApplyTagSubDescriptors
} from 'hooks/actions/use-conv-apply-tag';
import { ConvActionRequest } from 'types/soap/conv-action';

const tagA = { id: '1', name: 'a', label: 'a', color: 3 };
const tagB = { id: '2', name: 'b', label: 'b', color: 3 };
const tagC = { id: '3', name: 'c', label: 'c', color: 3 };

describe('useConvApplyTag', () => {
	const conv = generateConversation();
	describe('Descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			useTagStore.setState({ tags: { [tagA.id]: tagA } });

			const { result } = setupHook(useConvApplyTagDescriptor, {
				initialProps: [{ ids: [conv.id], folderId: FOLDERS.INBOX, conversationTags: ['1'] }]
			});

			expect(result.current).toEqual({
				id: 'conversation-apply-tag',
				icon: 'TagsMoreOutline',
				label: 'Tag',
				items: [
					expect.objectContaining({
						execute: expect.any(Function),
						canExecute: expect.any(Function),
						color: 3,
						icon: expect.any(String),
						id: '1',
						label: 'a'
					})
				]
			});
		});
	});

	describe('SubDescriptors', () => {
		it('Should return an object with specific icon if conversation does not contains the tag', () => {
			useTagStore.setState({ tags: { [tagA.id]: tagA } });
			const {
				result: { current: descriptor }
			} = setupHook(useConvApplyTagSubDescriptors, {
				initialProps: [{ ids: [conv.id], folderId: FOLDERS.INBOX, conversationTags: [] }]
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
			useTagStore.setState({ tags: { [tagA.id]: tagA } });
			const {
				result: { current: descriptor }
			} = setupHook(useConvApplyTagSubDescriptors, {
				initialProps: [{ ids: [conv.id], folderId: FOLDERS.INBOX, conversationTags: ['1'] }]
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
			const tags = { [tagA.id]: tagA, [tagB.id]: tagB, [tagC.id]: tagC };
			useTagStore.setState({ tags });
			const {
				result: { current: descriptor }
			} = setupHook(useConvApplyTagDescriptor, {
				initialProps: [
					{ ids: [conv.id], folderId: FOLDERS.INBOX, conversationTags: ['1', '2', '3'] }
				]
			});

			expect(descriptor.items).toHaveLength(3);
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

				useTagStore.setState({ tags });
				const {
					result: { current: descriptor }
				} = setupHook(useConvApplyTagSubDescriptors, {
					initialProps: [{ ids: [conv.id], folderId: folder.id, conversationTags: ['1'] }]
				});

				expect(descriptor[0].canExecute()).toEqual(assertion);
			});
		});
		describe('canExecute', () => {
			it('should call the API to remove the tag from the conversation', async () => {
				const tags = {
					'1': {
						id: '1',
						name: 'tag 1'
					}
				};

				useTagStore.setState({ tags });
				const interceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
				const {
					result: { current: descriptor }
				} = setupHook(useConvApplyTagSubDescriptors, {
					initialProps: [{ ids: [conv.id], folderId: FOLDERS.INBOX, conversationTags: ['1'] }]
				});

				await act(async () => {
					descriptor[0].execute();
				});
				const requestParameter = await interceptor;
				expect(requestParameter.action.id).toBe(conv.id);
				expect(requestParameter.action.op).toBe('!tag');
				expect(requestParameter.action.l).toBeUndefined();
			});
			it('should call the API to add the tag from the conversation', async () => {
				const tags = {
					'1': {
						id: '1',
						name: 'tag 1'
					}
				};
				useTagStore.setState({ tags });
				const interceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
				const {
					result: { current: descriptor }
				} = setupHook(useConvApplyTagSubDescriptors, {
					initialProps: [{ ids: [conv.id], folderId: FOLDERS.INBOX, conversationTags: [] }]
				});

				await act(async () => {
					descriptor[0].execute();
				});
				const requestParameter = await interceptor;
				expect(requestParameter.action.id).toBe(conv.id);
				expect(requestParameter.action.op).toBe('tag');
				expect(requestParameter.action.l).toBeUndefined();
			});
		});
	});
});
