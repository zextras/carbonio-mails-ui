/* eslint-disable testing-library/prefer-user-event */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from 'react';

import { faker } from '@faker-js/faker';
import { fireEvent } from '@testing-library/react';
import { times } from 'lodash';

import { createSoapAPIInterceptor, FOLDERS, screen, setupHook } from '@zextras/carbonio-ui-commons';
import { FOLDERS_DESCRIPTORS } from '../../../constants';
import { TIMERS } from '../../../tests/constants';
import { ConvActionRequest } from '../../../types/soap/conv-action';
import {
	useConvDeletePermanentlyDescriptor,
	useConvDeletePermanentlyFn
} from '../use-conv-delete-permanently';

describe('useConvDeletePermanently', () => {
	describe('Descriptor', () => {
		const ids = times(faker.number.int({ max: 42 }), () =>
			faker.number.int({ max: 42000 }).toString()
		);

		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useConvDeletePermanentlyDescriptor, {
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

		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: functions }
			} = setupHook(useConvDeletePermanentlyFn, {
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

			it('should call MsgActionRequest when user confirms the deletion of the message', async () => {
				const interceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
				const {
					result: { current: functions }
				} = setupHook(useConvDeletePermanentlyFn, {
					initialProps: [{ ids, deselectAll: jest.fn(), folderId: FOLDERS.TRASH }]
				});

				act(() => {
					functions.execute();
				});

				act(() => {
					jest.advanceTimersByTime(TIMERS.modal_open_delay);
				});

				const confirmButton = screen.getByRole('button', { name: 'Delete permanently' });
				expect(confirmButton).toBeVisible();

				fireEvent.click(confirmButton);

				const request = await act(async () => interceptor);

				expect(request.action.op).toEqual('delete');
			});
		});
	});
});
