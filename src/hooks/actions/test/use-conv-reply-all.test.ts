/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { addBoard } from '../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { setupHook } from '../../../carbonio-ui-commons/test/test-setup';
import { FOLDERS_DESCRIPTORS } from '../../../constants';
import { generateConversation } from '../../../tests/generators/generateConversation';
import { useConvReplyAllDescriptor, useConvReplyAllFn } from '../use-conv-reply-all';

describe('useConvReplyAll', () => {
	describe('Descriptor', () => {
		const conv = generateConversation();

		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useConvReplyAllDescriptor, {
				initialProps: [
					{
						firstMessageId: conv.messages[0].id,
						folderId: FOLDERS.INBOX,
						messagesLength: conv.messages.length
					}
				]
			});

			expect(descriptor).toEqual({
				id: 'conversation-reply_all',
				icon: 'ReplyAll',
				label: 'Reply all',
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
			} = setupHook(useConvReplyAllFn, {
				initialProps: [
					{
						firstMessageId: conv.messages[0].id,
						folderId: FOLDERS.INBOX,
						messagesLength: conv.messages.length
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
				} = setupHook(useConvReplyAllFn, {
					initialProps: [
						{
							firstMessageId: conv.messages[0].id,
							folderId: folder.id,
							messagesLength: conv.messages.length
						}
					]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			it('should create a board with specific parameters', async () => {
				const {
					result: { current: functions }
				} = setupHook(useConvReplyAllFn, {
					initialProps: [
						{
							firstMessageId: conv.messages[0].id,
							folderId: FOLDERS.INBOX,
							messagesLength: conv.messages.length
						}
					]
				});

				functions.execute();

				expect(addBoard).toHaveBeenCalledWith(
					expect.objectContaining({
						boardViewId: 'mails_editor_board_view',
						context: expect.objectContaining({
							originAction: 'replyAll',
							originActionTargetId: conv.messages[0].id
						})
					})
				);
			});

			it('should not create a board if the action cannot be executed', async () => {
				const {
					result: { current: functions }
				} = setupHook(useConvReplyAllFn, {
					initialProps: [
						{
							firstMessageId: conv.messages[0].id,
							folderId: FOLDERS.DRAFTS,
							messagesLength: conv.messages.length
						}
					]
				});

				functions.execute();

				expect(addBoard).not.toHaveBeenCalled();
			});
		});
	});
});
