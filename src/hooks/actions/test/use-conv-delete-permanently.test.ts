/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { times } from 'lodash';
import { act } from 'react';

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { setupHook, screen } from '../../../carbonio-ui-commons/test/test-setup';
import { FOLDERS_DESCRIPTORS } from '../../../constants';
import { TIMERS } from '../../../tests/constants';
import { generateStore } from '../../../tests/generators/store';
import {
	useConvDeletePermanentlyDescriptor,
	useConvDeletePermanentlyFn
} from '../use-conv-delete-permanently';

describe('useConvDeletePermanently', () => {
	describe('Descriptor', () => {
		const ids = times(faker.number.int({ max: 42 }), () =>
			faker.number.int({ max: 42000 }).toString()
		);
		const store = generateStore();

		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useConvDeletePermanentlyDescriptor, {
				store,
				initialProps: [{ ids, deselectAll: jest.fn(), folderId: FOLDERS.INBOX }]
			});

			expect(descriptor).toEqual({
				id: 'delete-permanently',
				icon: 'DeletePermanentlyOutline',
				label: 'Delete Permanently',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});
	describe('Functions', () => {
		const ids = times(faker.number.int({ max: 42 }), () =>
			faker.number.int({ max: 42000 }).toString()
		);
		const store = generateStore();

		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: functions }
			} = setupHook(useConvDeletePermanentlyFn, {
				store,
				initialProps: [{ ids, deselectAll: jest.fn(), folderId: FOLDERS.INBOX }]
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
				} = setupHook(useConvDeletePermanentlyFn, {
					store,
					initialProps: [{ ids, deselectAll: jest.fn(), folderId: folder.id }]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			it('should open the deletion modal', async () => {
				const {
					result: { current: functions }
				} = setupHook(useConvDeletePermanentlyFn, {
					store,
					initialProps: [{ ids, deselectAll: jest.fn(), folderId: FOLDERS.TRASH }]
				});

				act(() => {
					functions.execute();
				});

				act(() => {
					jest.advanceTimersByTime(TIMERS.modal_open_delay);
				});

				expect(
					screen.queryByText(`Are you sure to permanently delete this element?`)
				).toBeVisible();
			});

			it('should not open the deletion modal with if the action cannot be executed', async () => {
				const {
					result: { current: functions }
				} = setupHook(useConvDeletePermanentlyFn, {
					store,
					initialProps: [{ ids, deselectAll: jest.fn(), folderId: FOLDERS.INBOX }]
				});

				act(() => {
					functions.execute();
				});

				act(() => {
					jest.advanceTimersByTime(TIMERS.modal_open_delay);
				});

				expect(
					screen.queryByText(`Are you sure to permanently delete this element?`)
				).not.toBeInTheDocument();
			});
		});
	});
});
