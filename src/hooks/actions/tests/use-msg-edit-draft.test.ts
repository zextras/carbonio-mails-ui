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
		it('should return descriptor object with edit_as_draft id, Edit2Outline icon, Edit label, and action functions', () => {
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
		it('should return an ActionFn object containing execute and canExecute methods', () => {
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
			`(`should return $assertion when folder is $folder.desc`, ({ folder, assertion }) => {
				const {
					result: { current: functions }
				} = setupHook(useMsgEditDraftFn, {
					initialProps: [msg.id, false, folder.id]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			it('should call addBoard with editAsDraft action for non-scheduled draft message', async () => {
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

			it('should not call addBoard when canExecute returns false', async () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgEditDraftFn, {
					initialProps: [msg.id, false, FOLDERS.INBOX]
				});

				functions.execute();

				expect(addBoard).not.toHaveBeenCalled();
			});

			it('should call createModal with warning configuration when message is scheduled', async () => {
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

			it('should call closeModal and addBoard when modal onConfirm callback is invoked', async () => {
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

			it('should call closeModal without calling addBoard when modal onClose callback is invoked', async () => {
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
