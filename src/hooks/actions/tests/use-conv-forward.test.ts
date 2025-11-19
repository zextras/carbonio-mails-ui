/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { setupHook } from '@test-setup';
import { addBoard } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { FOLDERS_DESCRIPTORS } from 'constants/index';
import { useConvForwardDescriptor, useConvForwardFn } from 'hooks/actions/use-conv-forward';
import { generateConversation } from '__test__/generators/generateConversation';

describe('useConvForward', () => {
	describe('Descriptor', () => {
		const conv = generateConversation();

		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useConvForwardDescriptor, {
				initialProps: [
					{
						firstMessageId: conv.id,
						folderId: FOLDERS.INBOX,
						messagesLength: conv.messageIds.length
					}
				]
			});

			expect(descriptor).toEqual({
				id: 'conversation-forward',
				icon: 'Forward',
				label: 'Forward',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});
	describe('Functions', () => {
		const conv = generateConversation();

		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: functions }
			} = setupHook(useConvForwardFn, {
				initialProps: [
					{
						firstMessageId: conv.id,
						folderId: FOLDERS.INBOX,
						messagesLength: conv.messageIds.length
					}
				]
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
				${FOLDERS_DESCRIPTORS.TRASH}        | ${true}
				${FOLDERS_DESCRIPTORS.SPAM}         | ${false}
				${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${true}
			`(`should return $assertion if the folder is $folder.desc`, ({ folder, assertion }) => {
				const {
					result: { current: functions }
				} = setupHook(useConvForwardFn, {
					initialProps: [
						{ firstMessageId: conv.id, folderId: folder.id, messagesLength: conv.messageIds.length }
					]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			it('should create a board with specific parameters', async () => {
				const {
					result: { current: functions }
				} = setupHook(useConvForwardFn, {
					initialProps: [
						{
							firstMessageId: conv.id,
							folderId: FOLDERS.INBOX,
							messagesLength: conv.messageIds.length
						}
					]
				});

				functions.execute();

				expect(addBoard).toHaveBeenCalledWith(
					expect.objectContaining({
						boardViewId: 'mails_editor_board_view',
						context: expect.objectContaining({
							originAction: 'forward',
							originActionTargetId: conv.id
						})
					})
				);
			});

			it('should not create a board if the action cannot be executed', async () => {
				const {
					result: { current: functions }
				} = setupHook(useConvForwardFn, {
					initialProps: [
						{
							firstMessageId: conv.id,
							folderId: FOLDERS.DRAFTS,
							messagesLength: conv.messageIds.length
						}
					]
				});

				functions.execute();

				expect(addBoard).not.toHaveBeenCalled();
			});
		});
	});
});
