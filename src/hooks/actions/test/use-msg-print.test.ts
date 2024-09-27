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
import { useMsgPrintDescriptor, useMsgPrintFn } from '../use-msg-print';

describe('useMsgPrintDescripto', () => {
	const msg = generateMessage({ isComplete: true });

	describe('Descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgPrintDescriptor, { initialProps: [msg, msg.parent] });

			expect(descriptor).toEqual({
				id: 'message-print',
				icon: 'PrinterOutline',
				label: 'Print',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});

	describe('Functions', () => {
		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgPrintFn, { initialProps: [msg, FOLDERS.INBOX] });

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
				} = setupHook(useMsgPrintFn, { initialProps: [msg, folder.id] });

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			// Mock result for window.open
			const documentWriteSpy = jest.fn();
			const documentMock: Document = { ...window.document, write: documentWriteSpy };
			const windowOpenResultMock = {
				...window,
				document: documentMock,
				top: {
					...window.top,
					document: documentMock
				}
			};
			const windowOpenSpy = jest.spyOn(window, 'open').mockReturnValue(
				// The mock is not perfect, but it's good enough for this test
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				windowOpenResultMock
			);

			it('should open a new window and write a specific content into it', async () => {
				const batchResponse: Array<MailMessage> = [msg];
				createSoapAPIInterceptor('Batch', batchResponse);
				const {
					result: { current: functions }
				} = setupHook(useMsgPrintFn, { initialProps: [msg, FOLDERS.INBOX] });

				await act(async () => {
					functions.execute();
				});

				expect(documentWriteSpy).toHaveBeenCalledWith(
					expect.stringContaining('<title>Carbonio</title>')
				);
			});

			it('should not open a new window', async () => {
				const batchResponse: Array<MailMessage> = [msg];
				createSoapAPIInterceptor('Batch', batchResponse);
				const {
					result: { current: functions }
				} = setupHook(useMsgPrintFn, { initialProps: [msg, FOLDERS.DRAFTS] });

				await act(async () => {
					functions.execute();
				});

				expect(windowOpenSpy).not.toHaveBeenCalled();
			});
		});
	});
});
