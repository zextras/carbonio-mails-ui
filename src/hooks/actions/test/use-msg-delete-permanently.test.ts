/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from 'react-dom/test-utils';

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { setupHook, screen } from '../../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS } from '../../../constants';
import { TIMERS } from '../../../tests/constants';
import { generateMessage } from '../../../tests/generators/generateMessage';
import { generateStore } from '../../../tests/generators/store';
import {
	useDeleteMsgPermanentlyDescriptor,
	useDeleteMsgPermanentlyFn
} from '../use-msg-delete-permanently';

describe('useMsgDeletePermanentlyDescriptor', () => {
	const msg = generateMessage();

	const store = generateStore({
		messages: {
			searchedInFolder: {},
			messages: { [msg.id]: msg },
			searchRequestStatus: API_REQUEST_STATUS.fulfilled
		}
	});

	it('Should return an object with specific id, icon, label and 2 functions', () => {
		const {
			result: { current: descriptor }
		} = setupHook(useDeleteMsgPermanentlyDescriptor, {
			store,
			initialProps: [{ messageId: msg.id, deselectAll: jest.fn(), folderId: FOLDERS.INBOX }]
		});

		expect(descriptor).toEqual({
			id: 'message-delete-permanently',
			icon: 'DeletePermanentlyOutline',
			label: 'Delete Permanently',
			execute: expect.any(Function),
			canExecute: expect.any(Function)
		});
	});
});

describe('useMsgDeletePermanentlyFn', () => {
	const msg = generateMessage();

	const store = generateStore({
		messages: {
			searchedInFolder: {},
			messages: { [msg.id]: msg },
			searchRequestStatus: API_REQUEST_STATUS.fulfilled
		}
	});

	it('Should return an object with execute and canExecute functions', () => {
		const {
			result: { current: functions }
		} = setupHook(useDeleteMsgPermanentlyFn, {
			store,
			initialProps: [{ messageId: msg.id, deselectAll: jest.fn(), folderId: FOLDERS.INBOX }]
		});

		expect(functions).toEqual({
			execute: expect.any(Function),
			canExecute: expect.any(Function)
		});
	});

	describe('canExecute', () => {
		it('should return true if the folder is trash', () => {
			const {
				result: { current: functions }
			} = setupHook(useDeleteMsgPermanentlyFn, {
				store,
				initialProps: [{ messageId: msg.id, deselectAll: jest.fn(), folderId: FOLDERS.TRASH }]
			});

			expect(functions.canExecute()).toEqual(true);
		});

		it('should return true if the folder is spam', () => {
			const {
				result: { current: functions }
			} = setupHook(useDeleteMsgPermanentlyFn, {
				store,
				initialProps: [{ messageId: msg.id, deselectAll: jest.fn(), folderId: FOLDERS.SPAM }]
			});

			expect(functions.canExecute()).toEqual(true);
		});

		it('should return false if the folder is not trash nor spam', () => {
			const {
				result: { current: functions }
			} = setupHook(useDeleteMsgPermanentlyFn, {
				store,
				initialProps: [{ messageId: msg.id, deselectAll: jest.fn(), folderId: FOLDERS.INBOX }]
			});

			expect(functions.canExecute()).toEqual(false);
		});
	});

	describe('execute', () => {
		it('should call open the deletion modal', async () => {
			const {
				result: { current: functions }
			} = setupHook(useDeleteMsgPermanentlyFn, {
				store,
				initialProps: [{ messageId: msg.id, deselectAll: jest.fn(), folderId: FOLDERS.TRASH }]
			});

			act(() => {
				functions.execute();
			});

			act(() => {
				jest.advanceTimersByTime(TIMERS.modal_open_delay);
			});

			expect(screen.queryByText(`Are you sure to permanently delete this element?`)).toBeVisible();
		});

		it('should call open the deletion modal with if the action cannot be executed', async () => {
			const {
				result: { current: functions }
			} = setupHook(useDeleteMsgPermanentlyFn, {
				store,
				initialProps: [{ messageId: msg.id, deselectAll: jest.fn(), folderId: FOLDERS.INBOX }]
			});

			act(() => {
				functions.execute();
			});

			act(() => {
				jest.advanceTimersByTime(TIMERS.modal_open_delay);
			});

			expect(
				screen.queryByText(`Are you sure to permanently delete this element?`)
			).not.toBeInTheDocument();
		});
	});
});
