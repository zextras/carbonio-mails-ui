/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from '@testing-library/react';

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupHook } from '../../../carbonio-ui-commons/test/test-setup';
import { FOLDERS_DESCRIPTORS } from '../../../constants';
import { generateMessage } from '../../../tests/generators/generateMessage';
import { MailMessage } from '../../../types';
import { useMsgShowOriginalDescriptor, useMsgShowOriginalFn } from '../use-msg-show-original';

describe('useMsgShowOriginal', () => {
	const msg = generateMessage();

	describe('Descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgShowOriginalDescriptor, { initialProps: [msg.id, msg.parent] });

			expect(descriptor).toEqual({
				id: 'message-show_original',
				icon: 'CodeOutline',
				label: 'Show original',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});

	describe('Functions', () => {
		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgShowOriginalFn, { initialProps: [msg.id, FOLDERS.INBOX] });

			expect(descriptor).toEqual({
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
				} = setupHook(useMsgShowOriginalFn, { initialProps: [msg.id, folder.id] });

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

			it('should open a new window on a specific URL', async () => {
				const batchResponse: Array<MailMessage> = [msg];
				createSoapAPIInterceptor('Batch', batchResponse);
				const {
					result: { current: functions }
				} = setupHook(useMsgShowOriginalFn, { initialProps: [msg.id, FOLDERS.INBOX] });

				await act(async () => {
					functions.execute();
				});

				expect(windowOpenSpy).toHaveBeenCalledWith(
					`/service/home/~/?auth=co&view=text&id=${msg.id}`,
					'_blank'
				);
			});

			it('should not open a new window', async () => {
				const batchResponse: Array<MailMessage> = [msg];
				createSoapAPIInterceptor('Batch', batchResponse);
				const {
					result: { current: functions }
				} = setupHook(useMsgShowOriginalFn, { initialProps: [msg.id, FOLDERS.DRAFTS] });

				await act(async () => {
					functions.execute();
				});

				expect(windowOpenSpy).not.toHaveBeenCalled();
			});
		});
	});
});
