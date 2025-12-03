/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from 'react';

import { faker } from '@faker-js/faker';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { times } from 'lodash';

import { setupHook, screen } from '@test-setup';
import { TIMERS } from '__test__/constants';
import { FOLDERS_DESCRIPTORS } from 'constants/index';
import {
	useMsgDeletePermanentlyDescriptor,
	useMsgDeletePermanentlyFn
} from 'hooks/actions/use-msg-delete-permanently';

describe('useMsgDeletePermanently', () => {
	const messagesId = times(faker.number.int({ max: 42 }), () =>
		faker.number.int({ max: 42000 }).toString()
	);

	describe('Descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgDeletePermanentlyDescriptor, {
				initialProps: [{ ids: messagesId, folderId: FOLDERS.INBOX }]
			});

			expect(descriptor).toEqual({
				id: 'message-delete-permanently',
				icon: 'DeletePermanentlyOutline',
				label: 'Delete Permanently',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});

	describe('Functions', () => {
		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: functions }
			} = setupHook(useMsgDeletePermanentlyFn, {
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
				${FOLDERS_DESCRIPTORS.INBOX}        | ${false}
				${FOLDERS_DESCRIPTORS.SENT}         | ${false}
				${FOLDERS_DESCRIPTORS.DRAFTS}       | ${false}
				${FOLDERS_DESCRIPTORS.TRASH}        | ${true}
				${FOLDERS_DESCRIPTORS.SPAM}         | ${true}
				${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${false}
			`(`should return $assertion if the folder is $folder.desc`, ({ folder, assertion }) => {
				const {
					result: { current: functions }
				} = setupHook(useMsgDeletePermanentlyFn, {
					initialProps: [{ ids: messagesId, folderId: folder.id }]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			it('should open the deletion modal', async () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgDeletePermanentlyFn, {
					initialProps: [{ ids: messagesId, folderId: FOLDERS.TRASH }]
				});

				act(() => {
					functions.execute();
				});

				act(() => {
					vi.advanceTimersByTime(TIMERS.modal_open_delay);
				});

				expect(
					screen.queryByText(`Are you sure to permanently delete this element?`)
				).toBeVisible();
			});

			it('should not open the deletion modal with if the action cannot be executed', async () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgDeletePermanentlyFn, {
					initialProps: [{ ids: messagesId, folderId: FOLDERS.INBOX }]
				});

				act(() => {
					functions.execute();
				});

				act(() => {
					vi.advanceTimersByTime(TIMERS.modal_open_delay);
				});

				expect(
					screen.queryByText(`Are you sure to permanently delete this element?`)
				).not.toBeInTheDocument();
			});
		});
	});
});
