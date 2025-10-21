/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { setupHook } from '@test-setup';
import { addBoard } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { FOLDERS_DESCRIPTORS } from 'constants/index';
import {
	useMsgForwardAsAttachmentDescriptor,
	useMsgForwardAsAttachmentFn
} from 'hooks/actions/use-msg-forward-as-attachment';
import { generateMessage } from '__test__/generators/generateMessage';

describe('useMsgForwardAsAttachment', () => {
	const msg = generateMessage();

	describe('Descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgForwardAsAttachmentDescriptor, {
				initialProps: [[msg.id], FOLDERS.INBOX]
			});

			expect(descriptor).toEqual({
				id: 'message-forward_as_attachment',
				icon: 'Attach',
				label: 'Forward as attachment',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});

	describe('useMsgForwardAsAttachmentFn', () => {
		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: functions }
			} = setupHook(useMsgForwardAsAttachmentFn, {
				initialProps: [[msg.id], FOLDERS.INBOX]
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
				} = setupHook(useMsgForwardAsAttachmentFn, {
					initialProps: [[msg.id], folder.id]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			it('should create a board with specific parameters', async () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgForwardAsAttachmentFn, {
					initialProps: [[msg.id], FOLDERS.INBOX]
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

			it('should not create a board if the action cannot be executed', async () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgForwardAsAttachmentFn, {
					initialProps: [[msg.id], FOLDERS.DRAFTS]
				});

				functions.execute();

				expect(addBoard).not.toHaveBeenCalled();
			});
		});
	});
});
