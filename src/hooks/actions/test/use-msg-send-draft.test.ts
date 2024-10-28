/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from 'react';

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { createSoapAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupHook } from '../../../carbonio-ui-commons/test/test-setup';
import { FOLDERS_DESCRIPTORS } from '../../../constants';
import { generateMessage } from '../../../tests/generators/generateMessage';
import { generateStore } from '../../../tests/generators/store';
import { type SaveDraftRequest } from '../../../types';
import { useMsgSendDraftDescriptor, useMsgSendDraftFn } from '../use-msg-send-draft';

describe('useMsgSendDraft', () => {
	const msg = generateMessage({ folderId: FOLDERS.DRAFTS });
	const store = generateStore();

	describe('Descriptor', () => {
		it('Should return an object with specific id, icon, label and 2 functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgSendDraftDescriptor, { store, initialProps: [msg, msg.parent] });

			expect(descriptor).toEqual({
				id: 'message-send',
				icon: 'PaperPlaneOutline',
				label: 'Send',
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});
	});

	describe('Functions', () => {
		it('Should return an object with execute and canExecute functions', () => {
			const {
				result: { current: descriptor }
			} = setupHook(useMsgSendDraftFn, { store, initialProps: [msg, msg.parent] });

			expect(descriptor).toEqual({
				execute: expect.any(Function),
				canExecute: expect.any(Function)
			});
		});

		describe('canExecute', () => {
			it.each`
				folder                              | assertion
				${FOLDERS_DESCRIPTORS.INBOX}        | ${false}
				${FOLDERS_DESCRIPTORS.SENT}         | ${false}
				${FOLDERS_DESCRIPTORS.DRAFTS}       | ${true}
				${FOLDERS_DESCRIPTORS.TRASH}        | ${false}
				${FOLDERS_DESCRIPTORS.SPAM}         | ${false}
				${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${false}
			`(`should return $assertion if the folder is $folder.desc`, ({ folder, assertion }) => {
				const {
					result: { current: functions }
				} = setupHook(useMsgSendDraftFn, {
					store,
					initialProps: [msg, folder.id]
				});

				expect(functions.canExecute()).toEqual(assertion);
			});
		});

		describe('execute', () => {
			it('should not call the API if the action cannot be executed', async () => {
				const callFlag = jest.fn();
				createSoapAPIInterceptor('SendMsg').then(callFlag);

				const {
					result: { current: functions }
				} = setupHook(useMsgSendDraftFn, { store, initialProps: [msg, FOLDERS.INBOX] });

				await act(async () => {
					functions.execute();
				});

				expect(callFlag).not.toHaveBeenCalled();
			});

			it('should call the API with the proper params if the action can be executed', async () => {
				const apiInterceptor = createSoapAPIInterceptor<SaveDraftRequest>('SendMsg');

				const {
					result: { current: functions }
				} = setupHook(useMsgSendDraftFn, {
					store,
					initialProps: [msg, FOLDERS.DRAFTS]
				});

				await act(async () => {
					functions.execute();
				});

				const requestParameter = await apiInterceptor;
				expect(requestParameter.m.id).toBe(msg.id);
				expect(requestParameter.m.su).not.toBeUndefined();
				expect(requestParameter.m.e).not.toBeUndefined();
				expect(requestParameter.m.mp).not.toBeUndefined();
			});
		});
	});
});
