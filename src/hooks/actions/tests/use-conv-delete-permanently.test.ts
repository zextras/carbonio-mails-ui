/* eslint-disable testing-library/prefer-user-event */

/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from 'react';

import { faker } from '@faker-js/faker';
import { fireEvent } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { times } from 'lodash';

import { setupHook, screen } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { TIMERS } from '__test__/constants';
import { FOLDERS_DESCRIPTORS } from 'constants/index';
import {
	useConvDeletePermanentlyDescriptor,
	useConvDeletePermanentlyFn
} from 'hooks/actions/use-conv-delete-permanently';
import { ConvActionRequest } from 'types/soap/conv-action';

describe('useConvDeletePermanently', () => {
	describe('Descriptor', () => {
		const ids = times(faker.number.int({ max: 42 }), () =>
			faker.number.int({ max: 42000 }).toString()
		);

		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useConvDeletePermanentlyDescriptor, {
				initialProps: [{ ids, folderId: FOLDERS.INBOX }]
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
				initialProps: [{ ids, folderId: FOLDERS.INBOX }]
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
					initialProps: [{ ids, folderId: folder.id }]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			it('should open the deletion modal', async () => {
				const {
					result: { current: functions }
				} = setupHook(useConvDeletePermanentlyFn, {
					initialProps: [{ ids, folderId: FOLDERS.TRASH }]
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
				} = setupHook(useConvDeletePermanentlyFn, {
					initialProps: [{ ids, folderId: FOLDERS.INBOX }]
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

			it('should call MsgActionRequest when user confirms the deletion of the message', async () => {
				const interceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
				const {
					result: { current: functions }
				} = setupHook(useConvDeletePermanentlyFn, {
					initialProps: [{ ids, folderId: FOLDERS.TRASH }]
				});

				act(() => {
					functions.execute();
				});

				act(() => {
					vi.advanceTimersByTime(TIMERS.modal_open_delay);
				});

				const confirmButton = screen.getByRole('button', { name: 'Delete permanently' });
				expect(confirmButton).toBeVisible();

				fireEvent.click(confirmButton);

				const request = await act(async () => interceptor);

				expect(request.action.op).toEqual('delete');
			});

			it('should call the onActionComplete callback when the deletion is successful', async () => {
				const onActionComplete = vi.fn();
				createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
				const {
					user,
					result: { current: functions }
				} = setupHook(useConvDeletePermanentlyFn, {
					initialProps: [{ ids, folderId: FOLDERS.TRASH, onActionComplete }]
				});

				act(() => {
					functions.execute();
				});

				act(() => {
					vi.advanceTimersByTime(TIMERS.modal_open_delay);
				});

				const confirmButton = screen.getByRole('button', { name: 'Delete permanently' });
				expect(confirmButton).toBeVisible();

				await act(async () => user.click(confirmButton));

				expect(onActionComplete).toHaveBeenCalledWith(ids);
			});
		});
	});
});
