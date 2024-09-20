/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { setupHook } from '../../../carbonio-ui-commons/test/test-setup';
import { FOLDERS_DESCRIPTORS } from '../../../constants';
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
		it.each`
			folder                              | assertion
			${FOLDERS_DESCRIPTORS.INBOX}        | ${true}
			${FOLDERS_DESCRIPTORS.SENT}         | ${true}
			${FOLDERS_DESCRIPTORS.DRAFTS}       | ${false}
			${FOLDERS_DESCRIPTORS.TRASH}        | ${true}
			${FOLDERS_DESCRIPTORS.SPAM}         | ${true}
			${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${true}
		`(`should return $assertion if the folder is $folder.desc`, ({ folder, assertion }) => {
			const {
				result: { current: functions }
			} = setupHook(useMsgDownloadEmlFn, { initialProps: [msg.id, folder.id] });

			expect(functions.canExecute()).toEqual(assertion);
		});
	});

	describe('execute', () => {
		it.todo('should change the browser URL');

		it.todo('should not change the browser URL if the action cannot be executed');
	});
});
