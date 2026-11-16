/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from 'react';

import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { setupHook } from '@test-setup';
import { addBoard } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { generateMessage } from '__test__/generators/generateMessage';
import { FOLDERS_DESCRIPTORS } from 'constants/index';
import {
	useMsgForwardAsAttachmentDescriptor,
	useMsgForwardAsAttachmentFn
} from 'hooks/actions/use-msg-forward-as-attachment';
import { updateMessages } from 'store/emails/store';
import { MailMessage } from 'types/messages';

const expectComposedAttachments = (attachments: Array<unknown>): void => {
	expect(addBoard).toHaveBeenCalledWith(
		expect.objectContaining({
			context: expect.objectContaining({ compositionData: { attachments } })
		})
	);
};

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
				const storedMsg: MailMessage = {
					...generateMessage({ subject: 'Quarterly report' }),
					size: 4096
				};
				act(() => {
					updateMessages([storedMsg]);
				});
				const {
					result: { current: functions }
				} = setupHook(useMsgForwardAsAttachmentFn, {
					initialProps: [[storedMsg.id], FOLDERS.INBOX]
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
										filename: 'Quarterly report.eml',
										isInline: false,
										mid: storedMsg.id,
										size: 4096
									}
								]
							},
							originActionTargetId: storedMsg.id
						})
					})
				);
			});

			it('should create an attachment with its own name and size for each message', async () => {
				const storedMsgs: Array<MailMessage> = [
					{ ...generateMessage({ id: '1', subject: 'First' }), size: 100 },
					{ ...generateMessage({ id: '2', subject: 'Second' }), size: 200 }
				];
				act(() => {
					updateMessages(storedMsgs);
				});
				const {
					result: { current: functions }
				} = setupHook(useMsgForwardAsAttachmentFn, {
					initialProps: [['1', '2'], FOLDERS.INBOX]
				});

				functions.execute();

				expectComposedAttachments([
					expect.objectContaining({ mid: '1', filename: 'First.eml', size: 100 }),
					expect.objectContaining({ mid: '2', filename: 'Second.eml', size: 200 })
				]);
			});

			it('should sanitize the subject used as filename', async () => {
				const storedMsg = generateMessage({ subject: 'Re: Q1/Q2\u202Etxt.exe' });
				act(() => {
					updateMessages([storedMsg]);
				});
				const {
					result: { current: functions }
				} = setupHook(useMsgForwardAsAttachmentFn, {
					initialProps: [[storedMsg.id], FOLDERS.INBOX]
				});

				functions.execute();

				expectComposedAttachments([expect.objectContaining({ filename: 'Re_ Q1_Q2txt.exe.eml' })]);
			});

			it('should use the message id as filename if the message has no subject', async () => {
				const storedMsg: MailMessage = { ...generateMessage({ subject: '' }), size: 4096 };
				act(() => {
					updateMessages([storedMsg]);
				});
				const {
					result: { current: functions }
				} = setupHook(useMsgForwardAsAttachmentFn, {
					initialProps: [[storedMsg.id], FOLDERS.INBOX]
				});

				functions.execute();

				expectComposedAttachments([
					expect.objectContaining({ filename: `${storedMsg.id}.eml`, size: 4096 })
				]);
			});

			it('should use the message id as filename and 0 as size if the message is not in the store', async () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgForwardAsAttachmentFn, {
					initialProps: [[msg.id], FOLDERS.INBOX]
				});

				functions.execute();

				expectComposedAttachments([
					{
						contentType: 'message/rfc822',
						filename: `${msg.id}.eml`,
						isInline: false,
						mid: msg.id,
						size: 0
					}
				]);
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
