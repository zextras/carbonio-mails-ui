/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from 'react';

import { faker } from '@faker-js/faker';

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { populateFoldersStore } from '../../../carbonio-ui-commons/test/mocks/store/folders';
import { setupHook } from '../../../carbonio-ui-commons/test/test-setup';
import { generateConversation } from '../../../tests/generators/generateConversation';
import * as extraWindow from '../../../views/app/extra-windows/use-extra-window';
import {
	useConvPreviewOnSeparatedWindowDescriptor,
	useConvPreviewOnSeparatedWindowFn
} from '../use-conv-preview-on-separated-window';

describe('useConvPreviewOnSeparatedWindow', () => {
	const conv = generateConversation({ messageGenerationCount: faker.number.int({ max: 42 }) });

	describe('descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useConvPreviewOnSeparatedWindowDescriptor, {
				initialProps: [{ conversationId: conv.id, folderId: FOLDERS.INBOX, subject: conv.subject }]
			});

			expect(descriptor).toEqual({
				id: 'preview-on-separated-window',
				icon: 'ExternalLink',
				label: 'Open in a new tab',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});

	describe('functions', () => {
		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useConvPreviewOnSeparatedWindowFn, {
				initialProps: [
					{
						conversationId: conv.id,
						folderId: FOLDERS.INBOX,
						subject: conv.subject
					}
				]
			});

			expect(descriptor).toEqual({
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});

		describe('canExecute', () => {
			const useExtraWindowSpy = jest.spyOn(extraWindow, 'useExtraWindow');

			it('should return false if the message is already being previewed in a separated window', () => {
				useExtraWindowSpy.mockReturnValue({ isInsideExtraWindow: true });

				const {
					result: { current: functions }
				} = setupHook(useConvPreviewOnSeparatedWindowFn, {
					initialProps: [
						{
							conversationId: conv.id,
							folderId: FOLDERS.INBOX,
							subject: conv.subject
						}
					]
				});

				expect(functions.canExecute()).toEqual(false);
			});

			it('should return true if the message is not being previewed in a separated window', () => {
				useExtraWindowSpy.mockReturnValue({ isInsideExtraWindow: false });

				const {
					result: { current: functions }
				} = setupHook(useConvPreviewOnSeparatedWindowFn, {
					initialProps: [
						{
							conversationId: conv.id,
							folderId: FOLDERS.INBOX,
							subject: conv.subject
						}
					]
				});

				expect(functions.canExecute()).toEqual(true);
			});
		});

		describe('execute', () => {
			const useExtraWindowSpy = jest.spyOn(extraWindow, 'useExtraWindow');

			it('should not call the integrated function if the action cannot be executed', async () => {
				useExtraWindowSpy.mockReturnValue({ isInsideExtraWindow: true });
				populateFoldersStore();

				const {
					result: { current: functions }
				} = setupHook(useConvPreviewOnSeparatedWindowFn, {
					initialProps: [
						{
							conversationId: conv.id,
							folderId: FOLDERS.INBOX,
							subject: conv.subject
						}
					]
				});

				await act(async () => {
					functions.execute();
				});

				expect(window.open).not.toHaveBeenCalled();
			});

			it('should call the API with the proper params if the action can be executed', async () => {
				useExtraWindowSpy.mockReturnValue({ isInsideExtraWindow: false });
				populateFoldersStore();

				const {
					result: { current: functions }
				} = setupHook(useConvPreviewOnSeparatedWindowFn, {
					initialProps: [
						{
							conversationId: conv.id,
							folderId: FOLDERS.INBOX,
							subject: conv.subject
						}
					]
				});

				await act(async () => {
					functions.execute();
				});

				expect(window.open).toHaveBeenCalledWith(
					`http://localhost/carbonio/focus-mode/msg-preview/folder/2/conversation/${conv.id}`,
					conv.subject
				);
			});
		});
	});
});
