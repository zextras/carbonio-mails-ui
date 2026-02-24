/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from 'react';

import { faker } from '@faker-js/faker';
import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { setupHook } from '@test-setup';
import { populateFoldersStore } from '@test-utils/store/folders';
import { FOCUS_MODE_MAIL_VIEW_ROUTE, FOCUS_MODE_ROUTE } from 'constants/index';
import * as externalTabs from 'helpers/external-tabs';
import {
	useConvPreviewOnSeparatedWindowDescriptor,
	useConvPreviewOnSeparatedWindowFn
} from 'hooks/actions/use-conv-preview-on-separated-window';
import { generateConversation } from '__test__/generators/generateConversation';

describe('useConvPreviewOnSeparatedWindow', () => {
	const conv = generateConversation({ messageGenerationCount: faker.number.int({ max: 42 }) });

	describe('descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useConvPreviewOnSeparatedWindowDescriptor, {
				initialProps: [{ conversationId: conv.id, folderId: FOLDERS.INBOX }]
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
		const isStandalonePreviewSpy = vi.spyOn(externalTabs, 'isFocusModeMailView');

		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useConvPreviewOnSeparatedWindowFn, {
				initialProps: [
					{
						conversationId: conv.id,
						folderId: FOLDERS.INBOX
					}
				]
			});

			expect(descriptor).toEqual({
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});

		describe('canExecute', () => {
			it('should return false if the message is already being previewed in a separated window', () => {
				isStandalonePreviewSpy.mockReturnValue(true);

				const {
					result: { current: functions }
				} = setupHook(useConvPreviewOnSeparatedWindowFn, {
					initialProps: [
						{
							conversationId: conv.id,
							folderId: FOLDERS.INBOX
						}
					]
				});

				expect(functions.canExecute()).toEqual(false);
			});

			it('should return true if the message is not being previewed in a separated window', () => {
				isStandalonePreviewSpy.mockReturnValue(false);

				const {
					result: { current: functions }
				} = setupHook(useConvPreviewOnSeparatedWindowFn, {
					initialProps: [
						{
							conversationId: conv.id,
							folderId: FOLDERS.INBOX
						}
					]
				});

				expect(functions.canExecute()).toEqual(true);
			});
		});

		describe('execute', () => {
			it('should not open a window if the action cannot be executed', async () => {
				isStandalonePreviewSpy.mockReturnValue(true);
				populateFoldersStore();

				const {
					result: { current: functions }
				} = setupHook(useConvPreviewOnSeparatedWindowFn, {
					initialProps: [
						{
							conversationId: conv.id,
							folderId: FOLDERS.INBOX
						}
					]
				});

				await act(async () => {
					functions.execute();
				});

				expect(window.open).not.toHaveBeenCalled();
			});

			it('should open a window to the conversation preview url if the action can be executed', async () => {
				isStandalonePreviewSpy.mockReturnValue(false);
				populateFoldersStore();

				const {
					result: { current: functions }
				} = setupHook(useConvPreviewOnSeparatedWindowFn, {
					initialProps: [
						{
							conversationId: conv.id,
							folderId: FOLDERS.INBOX
						}
					]
				});

				await act(async () => {
					functions.execute();
				});

				expect(window.open).toHaveBeenCalledWith(
					`http://localhost/carbonio/${FOCUS_MODE_ROUTE}/${FOCUS_MODE_MAIL_VIEW_ROUTE}/folder/2/conversation/${conv.id}`
				);
			});
		});
	});
});
