/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, screen } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { setupHook, within } from '@test-setup';
import { addBoard } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { generateMessage } from '__test__/generators/generateMessage';
import { FOLDERS_DESCRIPTORS } from 'constants/index';
import { useMsgEditDraftDescriptor, useMsgEditDraftFn } from 'hooks/actions/use-msg-edit-draft';

async function getWarningModal(): Promise<HTMLElement> {
	return screen.findByTestId('modal');
}

function getWarningModalCloseButton(modal: HTMLElement): HTMLElement {
	return within(modal).getByTestId('icon: Close');
}

function getWarningModalEditAnywayButton(modal: HTMLElement): HTMLElement {
	return within(modal).getByRole('button', {
		name: 'action.edit_anyway'
	});
}

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

			it('it should open warning modal with title warning, warning message, edit anyway confirm label, and close icon', async () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgEditDraftFn, {
					initialProps: [msg.id, true, FOLDERS.DRAFTS]
				});

				await act(async () => {
					functions.execute();
				});

				const modal = await getWarningModal();

				expect(within(modal).getByText('label.warning')).toBeInTheDocument();

				expect(getWarningModalCloseButton(modal)).toBeInTheDocument();

				expect(within(modal).getByText('messages.edit_schedule_warning')).toBeInTheDocument();
				const editAnywayButton = getWarningModalEditAnywayButton(modal);
				expect(editAnywayButton).toBeInTheDocument();
			});

			it('should close the warning modal and call addBoard when modal is confirmed', async () => {
				const {
					result: { current: functions },
					user
				} = setupHook(useMsgEditDraftFn, {
					initialProps: [msg.id, true, FOLDERS.DRAFTS]
				});

				await act(async () => {
					functions.execute();
				});

				const modal = await getWarningModal();

				const editAnywayButton = getWarningModalEditAnywayButton(modal);

				await user.click(editAnywayButton);

				expect(modal).not.toBeInTheDocument();

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

			it('should close the warning modal without calling addBoard when modal is closed with close icon button', async () => {
				const {
					result: { current: functions },
					user
				} = setupHook(useMsgEditDraftFn, {
					initialProps: [msg.id, true, FOLDERS.DRAFTS]
				});

				await act(async () => {
					functions.execute();
				});

				const modal = await getWarningModal();

				const closeWarningModalButton = getWarningModalCloseButton(modal);

				await user.click(closeWarningModalButton);

				expect(modal).not.toBeInTheDocument();

				expect(addBoard).not.toHaveBeenCalled();
			});
		});
	});
});
