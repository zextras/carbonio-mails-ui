/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { setupHook } from '@test-setup';
import { FOLDERS_DESCRIPTORS } from 'constants/index';
import {
	useConvShowOriginalDescriptor,
	useConvShowOriginalFn
} from 'hooks/actions/use-conv-show-original';
import { generateConversation } from '__test__/generators/generateConversation';

describe('useConvShowOriginal', () => {
	const conv = generateConversation({ messageGenerationCount: 3 });

	describe('descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useConvShowOriginalDescriptor, {
				initialProps: [conv.messageIds[0], FOLDERS.INBOX]
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
				initialProps: [conv.messageIds[0], FOLDERS.INBOX]
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
					initialProps: [conv.messageIds[0], folder.id]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

			it('should open a new window on a specific URL', async () => {
				const {
					result: { current: functions }
				} = setupHook(useConvShowOriginalFn, {
					initialProps: [conv.messageIds[0], FOLDERS.INBOX]
				});

				await act(async () => {
					functions.execute();
				});

				expect(windowOpenSpy).toHaveBeenCalledWith(
					`/service/home/~/?auth=co&view=text&id=${conv.messageIds[0]}`,
					'_blank'
				);
			});

			it('should not open a new window', async () => {
				const {
					result: { current: functions }
				} = setupHook(useConvShowOriginalFn, {
					initialProps: [conv.messageIds[0], FOLDERS.TRASH]
				});

				await act(async () => {
					functions.execute();
				});

				expect(windowOpenSpy).not.toHaveBeenCalled();
			});
		});
	});
});
