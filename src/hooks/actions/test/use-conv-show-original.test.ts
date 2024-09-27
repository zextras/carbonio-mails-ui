/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from '@testing-library/react';

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { setupHook } from '../../../carbonio-ui-commons/test/test-setup';
import { FOLDERS_DESCRIPTORS } from '../../../constants';
import { generateConversation } from '../../../tests/generators/generateConversation';
import { useConvShowOriginalDescriptor, useConvShowOriginalFn } from '../use-conv-show-original';

describe('useMsgShowOriginal', () => {
	const conv = generateConversation({ messageGenerationCount: 3 });

	describe('descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useConvShowOriginalDescriptor, {
				initialProps: [conv.messages[0].id, FOLDERS.INBOX]
			});

			expect(descriptor).toEqual({
				id: 'conversation-show_original',
				icon: 'CodeOutline',
				label: 'Show original',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});

	describe('functions', () => {
		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: functions }
			} = setupHook(useConvShowOriginalFn, {
				initialProps: [conv.messages[0].id, FOLDERS.INBOX]
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
				${FOLDERS_DESCRIPTORS.TRASH}        | ${false}
				${FOLDERS_DESCRIPTORS.SPAM}         | ${true}
				${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${true}
			`(`should return $assertion if the folder is $folder.desc`, ({ folder, assertion }) => {
				const {
					result: { current: functions }
				} = setupHook(useConvShowOriginalFn, {
					initialProps: [conv.messages[0].id, folder.id]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

			it('should open a new window on a specific URL', async () => {
				const {
					result: { current: functions }
				} = setupHook(useConvShowOriginalFn, {
					initialProps: [conv.messages[0].id, FOLDERS.INBOX]
				});

				await act(async () => {
					functions.execute();
				});

				expect(windowOpenSpy).toHaveBeenCalledWith(
					`/service/home/~/?auth=co&view=text&id=${conv.messages[0].id}`,
					'_blank'
				);
			});

			it('should not open a new window', async () => {
				const {
					result: { current: functions }
				} = setupHook(useConvShowOriginalFn, {
					initialProps: [conv.messages[0].id, FOLDERS.TRASH]
				});

				await act(async () => {
					functions.execute();
				});

				expect(windowOpenSpy).not.toHaveBeenCalled();
			});
		});
	});
});
