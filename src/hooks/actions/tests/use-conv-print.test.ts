/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { setupHook } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateConversation } from '__test__/generators/generateConversation';
import { FOLDERS_DESCRIPTORS } from 'constants/index';
import { useConvPrintDescriptor, useConvPrintFn } from 'hooks/actions/use-conv-print';
import { NormalizedConversation } from 'types/conversations';

describe('useConvPrint', () => {
	describe('Descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const conv = generateConversation();

			const {
				result: { current: descriptor }
			} = setupHook(useConvPrintDescriptor, { initialProps: [[conv], FOLDERS.INBOX] });

			expect(descriptor).toEqual({
				id: 'conversation-print',
				icon: 'PrinterOutline',
				label: 'Print',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});
	describe('Functions', () => {
		const conv = generateConversation();

		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useConvPrintFn, { initialProps: [[conv], FOLDERS.INBOX] });

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
				} = setupHook(useConvPrintFn, { initialProps: [[conv], folder.id] });

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			// Mock result for window.open
			const documentWriteSpy = vi.fn();
			const documentMock: Document = { ...window.document, write: documentWriteSpy };
			const windowOpenResultMock = {
				...window,
				document: documentMock,
				top: {
					...window.top,
					document: documentMock
				}
			};
			const windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(
				// The mock is not perfect, but it's good enough for this test
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				windowOpenResultMock
			);

			it('should open a new window and write a specific content into it', async () => {
				const batchResponse: Array<NormalizedConversation> = [conv];
				createSoapAPIInterceptor('Batch', batchResponse);
				const {
					result: { current: functions }
				} = setupHook(useConvPrintFn, { initialProps: [[conv], FOLDERS.INBOX] });

				await act(async () => {
					functions.execute();
				});

				expect(documentWriteSpy).toHaveBeenCalledWith(
					expect.stringContaining('<title>Carbonio</title>')
				);
			});

			it('should not open a new window', async () => {
				const batchResponse: Array<NormalizedConversation> = [conv];
				createSoapAPIInterceptor('Batch', batchResponse);
				const {
					result: { current: functions }
				} = setupHook(useConvPrintFn, { initialProps: [[conv], FOLDERS.DRAFTS] });

				await act(async () => {
					functions.execute();
				});

				expect(windowOpenSpy).not.toHaveBeenCalled();
			});
		});
	});
});
