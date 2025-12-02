/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from 'react';

import { setupHook } from '@test-setup';
import { populateFoldersStore } from '@test-utils/store/folders';
import { FOCUS_MODE_MAIL_VIEW_ROUTE, FOCUS_MODE_ROUTE } from 'constants/index';
import * as externalTabs from 'helpers/external-tabs';
import { getParentFolderId } from 'helpers/folders';
import {
	useMsgPreviewOnSeparatedWindowDescriptor,
	useMsgPreviewOnSeparatedWindowFn
} from 'hooks/actions/use-msg-preview-on-separated-window';
import { generateMessage } from '__test__/generators/generateMessage';

describe('useMsgPreviewOnSeparatedWindow', () => {
	const msg = generateMessage({ isComplete: true });

	describe('Descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgPreviewOnSeparatedWindowDescriptor, {
				initialProps: [
					{
						messageId: msg.id,
						folderId: getParentFolderId(msg.parent)
					}
				]
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

	describe('Functions', () => {
		const isStandalonePreviewSpy = vi.spyOn(externalTabs, 'isFocusModeMailView');

		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: functions }
			} = setupHook(useMsgPreviewOnSeparatedWindowFn, {
				initialProps: [
					{
						messageId: msg.id,
						folderId: getParentFolderId(msg.parent)
					}
				]
			});

			expect(functions).toEqual({
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});

		describe('canExecute', () => {
			it('should return false if the message is already being previewed in a separated window', () => {
				isStandalonePreviewSpy.mockReturnValue(true);

				const {
					result: { current: functions }
				} = setupHook(useMsgPreviewOnSeparatedWindowFn, {
					initialProps: [
						{
							messageId: msg.id,
							folderId: getParentFolderId(msg.parent)
						}
					]
				});

				expect(functions.canExecute()).toEqual(false);
			});

			it('should return true if the message is not being previewed in a separated window', () => {
				isStandalonePreviewSpy.mockReturnValue(false);

				const {
					result: { current: functions }
				} = setupHook(useMsgPreviewOnSeparatedWindowFn, {
					initialProps: [
						{
							messageId: msg.id,
							folderId: getParentFolderId(msg.parent)
						}
					]
				});

				expect(functions.canExecute()).toEqual(true);
			});
		});

		describe('execute', () => {
			it('should not call the integrated function if the action cannot be executed', async () => {
				isStandalonePreviewSpy.mockReturnValue(true);
				populateFoldersStore();

				const {
					result: { current: functions }
				} = setupHook(useMsgPreviewOnSeparatedWindowFn, {
					initialProps: [
						{
							messageId: msg.id,
							folderId: getParentFolderId(msg.parent)
						}
					]
				});

				await act(async () => {
					functions.execute();
				});

				expect(window.open).not.toHaveBeenCalled();
			});

			it('should call the API with the proper params if the action can be executed', async () => {
				isStandalonePreviewSpy.mockReturnValue(false);
				populateFoldersStore();

				const {
					result: { current: functions }
				} = setupHook(useMsgPreviewOnSeparatedWindowFn, {
					initialProps: [
						{
							messageId: msg.id,
							folderId: getParentFolderId(msg.parent)
						}
					]
				});

				await act(async () => {
					functions.execute();
				});

				expect(window.open).toHaveBeenCalledWith(
					`http://localhost/carbonio/${FOCUS_MODE_ROUTE}/${FOCUS_MODE_MAIL_VIEW_ROUTE}/folder/2/message/${msg.id}`
				);
			});
		});
	});
});
