/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from 'react';

import { faker } from '@faker-js/faker';
import { waitFor } from '@testing-library/react';

import { FOLDER_VIEW } from '../../../carbonio-ui-commons/constants';
import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../../carbonio-ui-commons/test/mocks/store/folders';
import { setupHook, screen } from '../../../carbonio-ui-commons/test/test-setup';
import { FOLDERS_DESCRIPTORS } from '../../../constants';
import { TIMERS } from '../../../tests/constants';
import { makeAllItemsVisible } from '../../../views/settings/filters/tests/test-utils';
import { useConvRestoreDescriptor, useConvRestoreFn } from '../use-conv-restore';

describe('useConvRestore', () => {
	const conversationId = faker.number.int({ max: 42000 }).toString();

	describe('descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useConvRestoreDescriptor, {
				initialProps: [{ conversationId, deselectAll: jest.fn(), folderId: FOLDERS.INBOX }]
			});

			expect(descriptor).toEqual({
				id: 'conversation-restore',
				icon: 'RestoreOutline',
				label: 'Restore',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});

	describe('functions', () => {
		populateFoldersStore({ view: FOLDER_VIEW.message });

		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: functions }
			} = setupHook(useConvRestoreFn, {
				initialProps: [{ conversationId, deselectAll: jest.fn(), folderId: FOLDERS.INBOX }]
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
				} = setupHook(useConvRestoreFn, {
					initialProps: [{ conversationId, deselectAll: jest.fn(), folderId: folder.id }]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			it('should call the ConvAction API when in conversation view', async () => {
				populateFoldersStore({ noSharedAccounts: true });

				const interceptor = createSoapAPIInterceptor('ConvAction');

				const {
					result: { current: functions },
					user
				} = setupHook(useConvRestoreFn, {
					initialProps: [{ conversationId, deselectAll: jest.fn(), folderId: FOLDERS.TRASH }]
				});

				await act(async () => {
					functions.execute();
				});

				makeAllItemsVisible(); // make folder list items visible in the modal

				expect(screen.getByText(`Restore`)).toBeVisible();

				const inboxFolder = screen.getAllByText(/folders\.inbox/i)[1];

				await user.click(inboxFolder);

				const moveButton = await screen.findByRole('button', { name: /move/i });

				await waitFor(async () => {
					expect(moveButton).toBeEnabled();
				});

				await user.click(moveButton);
				const request = await interceptor;

				await waitFor(async () => {
					expect(request).toEqual(
						expect.objectContaining({ action: expect.objectContaining({ op: 'move' }) })
					);
				});
			});

			it('should open the restore modal', async () => {
				const {
					result: { current: functions }
				} = setupHook(useConvRestoreFn, {
					initialProps: [{ conversationId, deselectAll: jest.fn(), folderId: FOLDERS.TRASH }]
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
				} = setupHook(useConvRestoreFn, {
					initialProps: [{ conversationId, deselectAll: jest.fn(), folderId: FOLDERS.INBOX }]
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
