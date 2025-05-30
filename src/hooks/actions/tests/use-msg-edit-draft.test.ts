/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { setupHook } from '@test-setup';
import { addBoard } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { FOLDERS_DESCRIPTORS } from 'constants/index';
import { useMsgEditDraftDescriptor, useMsgEditDraftFn } from 'hooks/actions/use-msg-edit-draft';
import { generateMessage } from 'tests/generators/generateMessage';

describe('useMsgEditDraft', () => {
	const msg = generateMessage();

	describe('Descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgEditDraftDescriptor, {
				initialProps: [msg.id, false, FOLDERS.DRAFTS]
			});

			expect(descriptor).toEqual({
				id: 'message-edit_as_draft',
				icon: 'Edit2Outline',
				label: 'Edit',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});

	describe('Functions', () => {
		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: functions }
			} = setupHook(useMsgEditDraftFn, {
				initialProps: [msg.id, false, FOLDERS.DRAFTS]
			});

			expect(functions).toEqual({
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});

		describe('canExecute', () => {
			it.each`
				folder                              | assertion
				${FOLDERS_DESCRIPTORS.INBOX}        | ${false}
				${FOLDERS_DESCRIPTORS.SENT}         | ${false}
				${FOLDERS_DESCRIPTORS.DRAFTS}       | ${true}
				${FOLDERS_DESCRIPTORS.TRASH}        | ${false}
				${FOLDERS_DESCRIPTORS.SPAM}         | ${false}
				${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${false}
			`(`should return $assertion if the folder is $folder.desc`, ({ folder, assertion }) => {
				const {
					result: { current: functions }
				} = setupHook(useMsgEditDraftFn, {
					initialProps: [msg.id, false, folder.id]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			it('should create a board with specific parameters', async () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgEditDraftFn, {
					initialProps: [msg.id, false, FOLDERS.DRAFTS]
				});

				functions.execute();

				expect(addBoard).toHaveBeenCalledWith(
					expect.objectContaining({
						boardViewId: 'mails_editor_board_view',
						context: expect.objectContaining({
							originAction: 'editAsDraft',
							originActionTargetId: msg.id
						})
					})
				);
			});

			it('should not create a board if the action cannot be executed', async () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgEditDraftFn, {
					initialProps: [msg.id, false, FOLDERS.INBOX]
				});

				functions.execute();

				expect(addBoard).not.toHaveBeenCalled();
			});
		});
	});
});
