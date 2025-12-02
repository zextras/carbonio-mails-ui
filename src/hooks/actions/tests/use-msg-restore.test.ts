/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from 'react';

import { faker } from '@faker-js/faker';
import { FOLDER_VIEW, FOLDERS } from '@zextras/carbonio-ui-commons';

import { setupHook, screen } from '@test-setup';
import { populateFoldersStore } from '@test-utils/store/folders';
import { TIMERS } from '__test__/constants';
import { FOLDERS_DESCRIPTORS } from 'constants/index';
import { useMsgRestoreDescriptor, useMsgRestoreFn } from 'hooks/actions/use-msg-restore';

describe('useMsgRestore', () => {
	populateFoldersStore({ view: FOLDER_VIEW.message });
	const messageId = faker.number.int({ max: 42000 }).toString();

	describe('Descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgRestoreDescriptor, {
				initialProps: [{ messageId, folderId: FOLDERS.INBOX }]
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
				initialProps: [{ messageId, folderId: FOLDERS.INBOX }]
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
					initialProps: [{ messageId, folderId: folder.id }]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			it('should open the restore modal', async () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgRestoreFn, {
					initialProps: [{ messageId, folderId: FOLDERS.TRASH }]
				});

				act(() => {
					functions.execute();
				});

				act(() => {
					vi.advanceTimersByTime(TIMERS.modal_open_delay);
				});

				expect(screen.getByText(`Restore`)).toBeVisible();
			});

			it('should not open the restore modal with if the action cannot be executed', async () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgRestoreFn, {
					initialProps: [{ messageId, folderId: FOLDERS.INBOX }]
				});

				act(() => {
					functions.execute();
				});

				act(() => {
					vi.advanceTimersByTime(TIMERS.modal_open_delay);
				});

				expect(screen.queryByText(`Restore`)).not.toBeInTheDocument();
			});
		});
	});
});
