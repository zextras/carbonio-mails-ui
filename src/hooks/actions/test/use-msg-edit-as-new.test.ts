/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { addBoard } from '../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { setupHook } from '../../../carbonio-ui-commons/test/test-setup';
import { FOLDERS_DESCRIPTORS } from '../../../constants';
import { generateMessage } from '../../../tests/generators/generateMessage';
import { useMsgEditAsNewDescriptor, useMsgEditAsNewFn } from '../use-msg-edit-as-new';

describe('useMsgEditAsNewDescriptor', () => {
	const msg = generateMessage();

	it('Should return an object with specific id, icon, label and 2 functions', () => {
		const {
			result: { current: descriptor }
		} = setupHook(useMsgEditAsNewDescriptor, {
			initialProps: [msg.id, FOLDERS.INBOX]
		});

		expect(descriptor).toEqual({
			id: 'message-edit_as_new',
			icon: 'Edit2Outline',
			label: 'Edit as new',
			execute: expect.any(Function),
			canExecute: expect.any(Function)
		});
	});
});

describe('useMsgEditAsNewFn', () => {
	const msg = generateMessage();

	it('Should return an object with execute and canExecute functions', () => {
		const {
			result: { current: functions }
		} = setupHook(useMsgEditAsNewFn, {
			initialProps: [msg.id, FOLDERS.INBOX]
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
			} = setupHook(useMsgEditAsNewFn, {
				initialProps: [msg.id, folder.id]
			});

			expect(functions.canExecute()).toEqual(assertion);
		});
	});

	describe('execute', () => {
		it('should create a board with specific parameters', async () => {
			const {
				result: { current: functions }
			} = setupHook(useMsgEditAsNewFn, {
				initialProps: [msg.id, FOLDERS.INBOX]
			});

			functions.execute();

			expect(addBoard).toHaveBeenCalledWith(
				expect.objectContaining({
					boardViewId: 'mails_editor_board_view',
					context: expect.objectContaining({
						originAction: 'editAsNew',
						originActionTargetId: msg.id
					})
				})
			);
		});

		it('should not create a board if the action cannot be executed', async () => {
			const {
				result: { current: functions }
			} = setupHook(useMsgEditAsNewFn, {
				initialProps: [msg.id, FOLDERS.DRAFTS]
			});

			functions.execute();

			expect(addBoard).not.toHaveBeenCalled();
		});
	});
});
