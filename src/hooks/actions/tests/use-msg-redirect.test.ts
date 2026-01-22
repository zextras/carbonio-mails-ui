/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from 'react';

import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { setupHook, screen } from '@test-setup';
import { TIMERS } from '__test__/constants';
import { generateMessage } from '__test__/generators/generateMessage';
import { FOLDERS_DESCRIPTORS } from 'constants/index';
import { useMsgRedirectDescriptor, useMsgRedirectFn } from 'hooks/actions/use-msg-redirect';

describe('useMsgRedirect', () => {
	const msg = generateMessage();

	describe('Descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgRedirectDescriptor, {
				initialProps: [msg.id, FOLDERS.INBOX]
			});

			expect(descriptor).toEqual({
				id: 'message-redirect',
				icon: 'CornerUpRight',
				label: 'Redirect',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});

	describe('Functions', () => {
		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: functions }
			} = setupHook(useMsgRedirectFn, {
				initialProps: [msg.id, FOLDERS.INBOX]
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
				${FOLDERS_DESCRIPTORS.DRAFTS}       | ${false}
				${FOLDERS_DESCRIPTORS.TRASH}        | ${false}
				${FOLDERS_DESCRIPTORS.SPAM}         | ${true}
				${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${true}
			`(`should return $assertion if the folder is $folder.desc`, ({ folder, assertion }) => {
				const {
					result: { current: functions }
				} = setupHook(useMsgRedirectFn, {
					initialProps: [msg.id, folder.id]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			it('should open the redirect modal', async () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgRedirectFn, {
					initialProps: [msg.id, FOLDERS.INBOX]
				});

				act(() => {
					functions.execute();
				});

				act(() => {
					vi.advanceTimersByTime(TIMERS.modal_open_delay);
				});

				expect(screen.queryByText(`Redirect e-mail`)).toBeVisible();
			});

			it('should not open the redirect modal with if the action cannot be executed', async () => {
				const {
					result: { current: functions }
				} = setupHook(useMsgRedirectFn, {
					initialProps: [msg.id, FOLDERS.TRASH]
				});

				act(() => {
					functions.execute();
				});

				act(() => {
					vi.advanceTimersByTime(TIMERS.modal_open_delay);
				});

				expect(screen.queryByText(`Redirect e-mail`)).not.toBeInTheDocument();
			});
		});
	});
});
