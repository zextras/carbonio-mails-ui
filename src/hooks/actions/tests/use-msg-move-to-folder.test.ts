/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from 'react';

import { faker } from '@faker-js/faker';
import * as hooks from '@zextras/carbonio-shell-ui';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { times } from 'lodash';

import { setupHook, screen } from '@test-setup';
import { generateSettings } from '@test-utils/settings/settings-generator';
import { FOLDERS_DESCRIPTORS } from 'constants/index';
import {
	useMsgMoveToFolderDescriptor,
	useMsgMoveToFolderFn
} from 'hooks/actions/use-msg-move-to-folder';
import { TIMERS } from 'tests/constants';

const settings = generateSettings({
	prefs: {
		zimbraPrefGroupMailBy: 'message'
	}
});

describe('useMsgMoveToFolder', () => {
	const messagesId = times(faker.number.int({ max: 42 }), () =>
		faker.number.int({ max: 42000 }).toString()
	);

	describe('Descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
			const {
				result: { current: descriptor }
			} = setupHook(useMsgMoveToFolderDescriptor, {
				initialProps: [{ ids: messagesId, deselectAll: jest.fn(), folderId: FOLDERS.INBOX }]
			});

			expect(descriptor).toEqual({
				id: 'message-move',
				icon: 'MoveOutline',
				label: 'Move',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});
	describe('useMsgMoveToFolderFn', () => {
		it('Should return an object with execute and canExecute functions', () => {
			jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
			const {
				result: { current: functions }
			} = setupHook(useMsgMoveToFolderFn, {
				initialProps: [{ ids: messagesId, deselectAll: jest.fn(), folderId: FOLDERS.INBOX }]
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
				${FOLDERS_DESCRIPTORS.DRAFTS}       | ${true}
				${FOLDERS_DESCRIPTORS.TRASH}        | ${false}
				${FOLDERS_DESCRIPTORS.SPAM}         | ${true}
				${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${true}
			`(`should return $assertion if the folder is $folder.desc`, ({ folder, assertion }) => {
				jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
				const {
					result: { current: functions }
				} = setupHook(useMsgMoveToFolderFn, {
					initialProps: [{ ids: messagesId, deselectAll: jest.fn(), folderId: folder.id }]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			it('should open the move modal', async () => {
				jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
				const {
					result: { current: functions }
				} = setupHook(useMsgMoveToFolderFn, {
					initialProps: [{ ids: messagesId, deselectAll: jest.fn(), folderId: FOLDERS.INBOX }]
				});

				act(() => {
					functions.execute();
				});

				act(() => {
					jest.advanceTimersByTime(TIMERS.modal_open_delay);
				});

				expect(screen.getByText(`Move Message`)).toBeVisible();
			});

			it('should not open the move modal with if the action cannot be executed', async () => {
				jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
				const {
					result: { current: functions }
				} = setupHook(useMsgMoveToFolderFn, {
					initialProps: [{ ids: messagesId, deselectAll: jest.fn(), folderId: FOLDERS.TRASH }]
				});

				act(() => {
					functions.execute();
				});

				act(() => {
					jest.advanceTimersByTime(TIMERS.modal_open_delay);
				});

				expect(screen.queryByText(`Move Message`)).not.toBeInTheDocument();
			});
		});
	});
});
