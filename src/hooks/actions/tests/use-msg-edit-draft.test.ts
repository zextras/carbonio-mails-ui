/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { setupHook } from '@test-setup';
import { addBoard } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { generateMessage } from '__test__/generators/generateMessage';
import { FOLDERS_DESCRIPTORS } from 'constants/index';
import { useMsgEditDraftDescriptor, useMsgEditDraftFn } from 'hooks/actions/use-msg-edit-draft';

const createModal = vi.fn();
const closeModal = vi.fn();

vi.mock('hooks/use-ui-utilities', () => ({
	useUiUtilities: (): { createModal: typeof createModal; closeModal: typeof closeModal } => ({
		createModal,
		closeModal
	})
}));

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

			it('should open a warning modal if the message is scheduled', async () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgEditDraftFn, {
					initialProps: [msg.id, true, FOLDERS.DRAFTS]
				});

				await act(async () => {
					functions.execute();
				});

				expect(createModal).toHaveBeenCalledWith(
					expect.objectContaining({
						title: 'label.warning',
						confirmLabel: 'action.edit_anyway',
						onConfirm: expect.any(Function),
						onClose: expect.any(Function),
						showCloseIcon: true,
						children: expect.anything()
					})
				);
			});

			it('should create a board when confirming the warning modal', async () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgEditDraftFn, {
					initialProps: [msg.id, true, FOLDERS.DRAFTS]
				});

				await act(async () => {
					functions.execute();
				});

				const modalCall = createModal.mock.calls[0][0];
				modalCall.onConfirm();

				expect(closeModal).toHaveBeenCalledWith(modalCall.id);
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

			it('should close the modal when closing the warning modal', async () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgEditDraftFn, {
					initialProps: [msg.id, true, FOLDERS.DRAFTS]
				});

				await act(async () => {
					functions.execute();
				});

				const modalCall = createModal.mock.calls[0][0];
				modalCall.onClose();

				expect(closeModal).toHaveBeenCalledWith(modalCall.id);
				expect(addBoard).not.toHaveBeenCalled();
			});
		});
	});
});
