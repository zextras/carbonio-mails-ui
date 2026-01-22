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

import { createSoapAPIInterceptor } from '../../../__test__/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../../__test__/mocks/store/folders';
import { setupHook, screen } from '@test-setup';
import { generateSettings } from '@test-utils/settings/settings-generator';
import { TIMERS } from '__test__/constants';
import { FOLDERS_DESCRIPTORS } from 'constants/index';
import {
	useMsgMoveToFolderDescriptor,
	useMsgMoveToFolderFn
} from 'hooks/actions/use-msg-move-to-folder';

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
			vi.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
			const {
				result: { current: descriptor }
			} = setupHook(useMsgMoveToFolderDescriptor, {
				initialProps: [{ ids: messagesId, folderId: FOLDERS.INBOX }]
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
			vi.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
			const {
				result: { current: functions }
			} = setupHook(useMsgMoveToFolderFn, {
				initialProps: [{ ids: messagesId, folderId: FOLDERS.INBOX }]
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
				vi.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
				const {
					result: { current: functions }
				} = setupHook(useMsgMoveToFolderFn, {
					initialProps: [{ ids: messagesId, folderId: folder.id }]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			it('should open the move modal', async () => {
				vi.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
				const {
					result: { current: functions }
				} = setupHook(useMsgMoveToFolderFn, {
					initialProps: [{ ids: messagesId, folderId: FOLDERS.INBOX }]
				});

				act(() => {
					functions.execute();
				});

				act(() => {
					vi.advanceTimersByTime(TIMERS.modal_open_delay);
				});

				expect(screen.getByText(`Move Message`)).toBeVisible();
			});

			it('should not open the move modal with if the action cannot be executed', async () => {
				vi.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
				const {
					result: { current: functions }
				} = setupHook(useMsgMoveToFolderFn, {
					initialProps: [{ ids: messagesId, folderId: FOLDERS.TRASH }]
				});

				act(() => {
					functions.execute();
				});

				act(() => {
					vi.advanceTimersByTime(TIMERS.modal_open_delay);
				});

				expect(screen.queryByText(`Move Message`)).not.toBeInTheDocument();
			});

			it('should call onActionComplete when provided after moving messages', async () => {
				populateFoldersStore({ view: 'message' });
				createSoapAPIInterceptor('MsgAction');
				const onActionComplete = vi.fn();
				const {
					user,
					result: { current: functions }
				} = setupHook(useMsgMoveToFolderFn, {
					initialProps: [{ ids: messagesId, folderId: FOLDERS.INBOX, onActionComplete }]
				});

				act(() => {
					functions.execute();
				});

				act(() => {
					vi.advanceTimersByTime(TIMERS.modal_open_delay);
				});

				// Select the destination folder in the modal
				const folderOption = screen.getByText('folders.sent');
				await act(async () => user.click(folderOption));

				// Click the move button in the modal
				const moveButton = screen.getByText('Move');
				await act(async () => user.click(moveButton));

				expect(onActionComplete).toHaveBeenCalledWith(messagesId);
			});
		});
	});
});
