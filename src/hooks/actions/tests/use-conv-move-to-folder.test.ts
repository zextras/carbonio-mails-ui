/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from 'react';

import { faker } from '@faker-js/faker';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { times } from 'lodash';

import { createSoapAPIInterceptor } from '../../../__test__/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../../__test__/mocks/store/folders';
import { setupHook, screen } from '@test-setup';
import { TIMERS } from '__test__/constants';
import { FOLDERS_DESCRIPTORS } from 'constants/index';
import {
	useConvMoveToFolderDescriptor,
	useConvMoveToFolderFn
} from 'hooks/actions/use-conv-move-to-folder';

describe('useConvMoveToFolder', () => {
	const conversationsId = times(faker.number.int({ max: 42 }), () =>
		faker.number.int({ max: 42000 }).toString()
	);

	describe('descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useConvMoveToFolderDescriptor, {
				initialProps: [{ ids: conversationsId, folderId: FOLDERS.INBOX }]
			});

			expect(descriptor).toEqual({
				id: 'conversation-move',
				icon: 'MoveOutline',
				label: 'Move',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});

	describe('functions', () => {
		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: functions }
			} = setupHook(useConvMoveToFolderFn, {
				initialProps: [{ ids: conversationsId, folderId: FOLDERS.INBOX }]
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
				const {
					result: { current: functions }
				} = setupHook(useConvMoveToFolderFn, {
					initialProps: [{ ids: conversationsId, folderId: folder.id }]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			it('should open the move modal', async () => {
				const {
					result: { current: functions }
				} = setupHook(useConvMoveToFolderFn, {
					initialProps: [{ ids: conversationsId, folderId: FOLDERS.INBOX }]
				});

				act(() => {
					functions.execute();
				});

				act(() => {
					vi.advanceTimersByTime(TIMERS.modal_open_delay);
				});

				expect(screen.getByText(`Move`)).toBeVisible();
			});

			it('should not open the move modal with if the action cannot be executed', async () => {
				const {
					result: { current: functions }
				} = setupHook(useConvMoveToFolderFn, {
					initialProps: [{ ids: conversationsId, folderId: FOLDERS.TRASH }]
				});

				act(() => {
					functions.execute();
				});

				act(() => {
					vi.advanceTimersByTime(TIMERS.modal_open_delay);
				});

				expect(screen.queryByText(`Move Conversation`)).not.toBeInTheDocument();
			});

			it('should call onActionComplete when provided after successful move', async () => {
				const onActionComplete = vi.fn();
				populateFoldersStore({ view: 'message' });
				createSoapAPIInterceptor('ConvAction');

				const {
					user,
					result: { current: functions }
				} = setupHook(useConvMoveToFolderFn, {
					initialProps: [{ ids: conversationsId, folderId: FOLDERS.INBOX, onActionComplete }]
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

				expect(onActionComplete).toHaveBeenCalledWith(conversationsId);
			});
		});
	});
});
