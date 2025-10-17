/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { addBoard } from '@zextras/carbonio-shell-ui';
import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { setupHook } from '@test-setup';
import { FOLDERS_DESCRIPTORS } from 'constants/index';
import {
	useConvForwardAsAttachmentDescriptor,
	useConvForwardAsAttachmentFn
} from 'hooks/actions/use-conv-forward-as-attachment';
import { generateMessage } from '__test__/generators/generateMessage';

describe('useConvForwardAsAttachment', () => {
	const msg = generateMessage();

	describe('Descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useConvForwardAsAttachmentDescriptor, {
				initialProps: [{ firstMessageId: msg.id, folderId: FOLDERS.INBOX, messagesLength: 1 }]
			});

			expect(descriptor).toEqual({
				id: 'conversation-forward_as_attachment',
				icon: 'Attach',
				label: 'Forward as attachment',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});

	describe('useConvForwardAsAttachmentFn', () => {
		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: functions }
			} = setupHook(useConvForwardAsAttachmentFn, {
				initialProps: [{ firstMessageId: msg.id, folderId: FOLDERS.INBOX, messagesLength: 1 }]
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
				} = setupHook(useConvForwardAsAttachmentFn, {
					initialProps: [{ firstMessageId: msg.id, folderId: folder.id, messagesLength: 1 }]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			it('should create a board with specific parameters', async () => {
				const {
					result: { current: functions }
				} = setupHook(useConvForwardAsAttachmentFn, {
					initialProps: [{ firstMessageId: msg.id, folderId: FOLDERS.INBOX, messagesLength: 1 }]
				});

				functions.execute();

				expect(addBoard).toHaveBeenCalledWith(
					expect.objectContaining({
						boardViewId: 'mails_editor_board_view',
						context: expect.objectContaining({
							originAction: 'forwardAsAttachment',
							compositionData: {
								attachments: [
									{
										contentType: 'message/rfc822',
										filename: `${msg.id}.eml`,
										isInline: false,
										mid: msg.id,
										size: 0
									}
								]
							},
							originActionTargetId: msg.id
						})
					})
				);
			});

			it('should not create a board if the action cannot be executed in the folder', async () => {
				const {
					result: { current: functions }
				} = setupHook(useConvForwardAsAttachmentFn, {
					initialProps: [{ firstMessageId: msg.id, folderId: FOLDERS.DRAFTS, messagesLength: 1 }]
				});

				functions.execute();

				expect(addBoard).not.toHaveBeenCalled();
			});

			it('should not create a board if the action cannot be executed on more than one message', async () => {
				const {
					result: { current: functions }
				} = setupHook(useConvForwardAsAttachmentFn, {
					initialProps: [{ firstMessageId: msg.id, folderId: FOLDERS.INBOX, messagesLength: 2 }]
				});

				functions.execute();

				expect(addBoard).not.toHaveBeenCalled();
			});
		});
	});
});
