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
import { generateConversation } from '__test__/generators/generateConversation';
import { generateMessage } from '__test__/generators/generateMessage';
import { FOLDERS_DESCRIPTORS } from 'constants/index';
import * as publishEvent from 'event-bus/publish-event';
import {
	useConvDeletePermanentlyDescriptor,
	useConvDeletePermanentlyFn
} from 'hooks/actions/use-conv-delete-permanently';
import { getConversationMessages, updateConversations, updateMessages } from 'store/emails/store';
import { ConvActionRequest, ConvActionResponse } from 'types/soap/conv-action';

const DELETE_PERMANENTLY_BUTTON = 'Delete permanently';

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

				const confirmButton = screen.getByRole('button', { name: DELETE_PERMANENTLY_BUTTON });
				expect(confirmButton).toBeVisible();

				fireEvent.click(confirmButton);

				const request = await act(async () => interceptor);

				expect(request.action.op).toEqual('delete');
			});

			it.each`
				openFolder | openFolderId     | tcon
				${'Junk'}  | ${FOLDERS.SPAM}  | ${'j'}
				${'Trash'} | ${FOLDERS.TRASH} | ${'t'}
			`(
				'should delete only the messages in the group of the folder open in the route ($openFolder, tcon $tcon)',
				async ({ openFolderId, tcon }) => {
					const interceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
					const {
						result: { current: functions }
					} = setupHook(useConvDeletePermanentlyFn, {
						initialProps: [{ ids, folderId: openFolderId }],
						initialEntries: [`/folder/${openFolderId}`],
						path: '/folder/:folderId/*'
					});

					act(() => {
						functions.execute();
					});
					act(() => {
						vi.advanceTimersByTime(TIMERS.modal_open_delay);
					});
					fireEvent.click(screen.getByRole('button', { name: DELETE_PERMANENTLY_BUTTON }));

					const request = await act(async () => interceptor);
					expect(request.action.op).toEqual('delete');
					expect(request.action.tcon).toEqual(tcon);
				}
			);

			it('should report to the quota only the size of the messages it deletes', async () => {
				const quotaSpy = vi.spyOn(publishEvent, 'publishQuotaChangedEvent');
				updateMessages([
					{ ...generateMessage({ id: '268', cid: '270', folderId: FOLDERS.SPAM }), size: 1000 },
					{ ...generateMessage({ id: '269', cid: '270', folderId: FOLDERS.SENT }), size: 500 }
				]);
				updateConversations([generateConversation({ id: '270', messageIds: ['269', '268'] })]);
				// The store is updated through a task queue
				await vi.waitFor(() => expect(getConversationMessages('270')).toHaveLength(2));
				createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>('ConvAction', {
					action: { id: '270', op: 'delete' }
				});
				const {
					result: { current: functions }
				} = setupHook(useConvDeletePermanentlyFn, {
					initialProps: [{ ids: ['270'], folderId: FOLDERS.SPAM }],
					initialEntries: [`/folder/${FOLDERS.SPAM}`],
					path: '/folder/:folderId/*'
				});

				act(() => {
					functions.execute();
				});
				act(() => {
					vi.advanceTimersByTime(TIMERS.modal_open_delay);
				});
				fireEvent.click(screen.getByRole('button', { name: DELETE_PERMANENTLY_BUTTON }));

				await vi.waitFor(() => expect(quotaSpy).toHaveBeenCalledWith(1000));
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

				const confirmButton = screen.getByRole('button', { name: DELETE_PERMANENTLY_BUTTON });
				expect(confirmButton).toBeVisible();

				await act(async () => user.click(confirmButton));

				expect(onActionComplete).toHaveBeenCalledWith(ids);
			});
		});
	});
});
