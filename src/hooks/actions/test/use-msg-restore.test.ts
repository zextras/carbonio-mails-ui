/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { act } from 'react';

import { FOLDER_VIEW } from '../../../carbonio-ui-commons/constants';
import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { populateFoldersStore } from '../../../carbonio-ui-commons/test/mocks/store/folders';
import { setupHook, screen } from '../../../carbonio-ui-commons/test/test-setup';
import { FOLDERS_DESCRIPTORS } from '../../../constants';
import { TIMERS } from '../../../tests/constants';
import { generateStore } from '../../../tests/generators/store';
import { useMsgRestoreDescriptor, useMsgRestoreFn } from '../use-msg-restore';

describe('useMsgRestore', () => {
	populateFoldersStore({ view: FOLDER_VIEW.message });
	const messageId = faker.number.int({ max: 42000 }).toString();
	const store = generateStore();

	describe('Descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgRestoreDescriptor, {
				store,
				initialProps: [{ messageId, deselectAll: jest.fn(), folderId: FOLDERS.INBOX }]
			});

			expect(descriptor).toEqual({
				id: 'message-restore',
				icon: 'RestoreOutline',
				label: 'Restore',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});

	describe('Functions', () => {
		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: functions }
			} = setupHook(useMsgRestoreFn, {
				store,
				initialProps: [{ messageId, deselectAll: jest.fn(), folderId: FOLDERS.INBOX }]
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
				${FOLDERS_DESCRIPTORS.DRAFTS}       | ${false}
				${FOLDERS_DESCRIPTORS.TRASH}        | ${true}
				${FOLDERS_DESCRIPTORS.SPAM}         | ${false}
				${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${false}
			`(`should return $assertion if the folder is $folder.desc`, ({ folder, assertion }) => {
				const {
					result: { current: functions }
				} = setupHook(useMsgRestoreFn, {
					store,
					initialProps: [{ messageId, deselectAll: jest.fn(), folderId: folder.id }]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			it('should open the restore modal', async () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgRestoreFn, {
					store,
					initialProps: [{ messageId, deselectAll: jest.fn(), folderId: FOLDERS.TRASH }]
				});

				act(() => {
					functions.execute();
				});

				act(() => {
					jest.advanceTimersByTime(TIMERS.modal_open_delay);
				});

				expect(screen.getByText(`Restore`)).toBeVisible();
			});

			it('should not open the restore modal with if the action cannot be executed', async () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgRestoreFn, {
					store,
					initialProps: [{ messageId, deselectAll: jest.fn(), folderId: FOLDERS.INBOX }]
				});

				act(() => {
					functions.execute();
				});

				act(() => {
					jest.advanceTimersByTime(TIMERS.modal_open_delay);
				});

				expect(screen.queryByText(`Restore`)).not.toBeInTheDocument();
			});
		});
	});
});
