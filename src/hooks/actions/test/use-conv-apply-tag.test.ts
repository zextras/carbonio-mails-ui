/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { find, forEach } from 'lodash';

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { useTags } from '../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { setupHook } from '../../../carbonio-ui-commons/test/test-setup';
import { FOLDERS_DESCRIPTORS } from '../../../constants';
import { generateConversation } from '../../../tests/generators/generateConversation';
import { generateStore } from '../../../tests/generators/store';
import { useConvApplyTagDescriptor, useConvApplyTagSubDescriptors } from '../use-conv-apply-tag';

describe('useConvApplyTag', () => {
	const conv = generateConversation();
	const store = generateStore();
	describe('Descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useConvApplyTagDescriptor, {
				initialProps: [{ ids: [conv.id], folderId: FOLDERS.INBOX, conversationTags: ['1'] }],
				store
			});

			expect(descriptor).toEqual({
				id: 'conversation-apply-tag',
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
			} = setupHook(useConvApplyTagDescriptor, {
				initialProps: [{ ids: [conv.id], folderId: FOLDERS.INBOX, conversationTags: conv.tags }],
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
				} = setupHook(useConvApplyTagSubDescriptors, {
					initialProps: [{ ids: [conv.id], folderId: folder.id, conversationTags: ['1'] }],
					store
				});

				expect(descriptor[0].canExecute()).toEqual(assertion);
			});
		});
	});
});
