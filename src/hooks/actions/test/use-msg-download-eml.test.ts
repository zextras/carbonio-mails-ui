/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { setupHook } from '../../../carbonio-ui-commons/test/test-setup';
import { generateMessage } from '../../../tests/generators/generateMessage';
import { useMsgDownloadEmlDescriptor, useMsgDownloadEmlFn } from '../use-msg-download-eml';

describe('useMsgDownloadEmlDescriptor', () => {
	it('Should return an object with specific id, icon, label and 2 functions', () => {
		const msg = generateMessage();

		const {
			result: { current: descriptor }
		} = setupHook(useMsgDownloadEmlDescriptor, { initialProps: [msg.id, msg.parent] });

		expect(descriptor).toEqual({
			id: 'download-eml',
			icon: 'DownloadOutline',
			label: 'Download EML',
			execute: expect.any(Function),
			canExecute: expect.any(Function)
		});
	});
});

describe('useMsgDownloadEmlFn', () => {
	const msg = generateMessage({ isComplete: true });

	it('Should return an object with execute and canExecute functions', () => {
		const {
			result: { current: descriptor }
		} = setupHook(useMsgDownloadEmlFn, { initialProps: [msg.id, FOLDERS.INBOX] });

		expect(descriptor).toEqual({
			execute: expect.any(Function),
			canExecute: expect.any(Function)
		});
	});

	describe('canExecute', () => {
		it('should return false if the folder is draft', () => {
			const {
				result: { current: functions }
			} = setupHook(useMsgDownloadEmlFn, { initialProps: [msg.id, FOLDERS.DRAFTS] });

			expect(functions.canExecute()).toEqual(false);
		});

		it('should return true if the folder is not draft', () => {
			const {
				result: { current: functions }
			} = setupHook(useMsgDownloadEmlFn, { initialProps: [msg.id, FOLDERS.INBOX] });

			expect(functions.canExecute()).toEqual(true);
		});
	});

	describe('execute', () => {
		it.todo('should change the browser URL');

		it.todo('should not change the browser URL if the action cannot be executed');
	});
});
