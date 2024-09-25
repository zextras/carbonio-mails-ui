/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { times } from 'lodash';
import { act } from 'react-dom/test-utils';

import { FOLDER_VIEW } from '../../../carbonio-ui-commons/constants';
import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { populateFoldersStore } from '../../../carbonio-ui-commons/test/mocks/store/folders';
import { setupHook, screen } from '../../../carbonio-ui-commons/test/test-setup';
import { FOLDERS_DESCRIPTORS } from '../../../constants';
import { TIMERS } from '../../../tests/constants';
import { generateStore } from '../../../tests/generators/store';
import { useMsgMoveToFolderDescriptor, useMsgMoveToFolderFn } from '../use-msg-move-to-folder';

describe('useMsgMoveToFolderDescriptor', () => {
	const messagesId = times(faker.number.int({ max: 42 }), () =>
		faker.number.int({ max: 42000 }).toString()
	);
	const store = generateStore();

	it('Should return an object with specific id, icon, label and 2 functions', () => {
		const {
			result: { current: descriptor }
		} = setupHook(useMsgMoveToFolderDescriptor, {
			store,
			initialProps: [{ messagesId, deselectAll: jest.fn(), folderId: FOLDERS.INBOX }]
		});

		expect(descriptor).toEqual({
			id: 'message-move',
			icon: 'MoveOutline',
			label: 'Move',
			execute: expect.any(Function),
			canExecute: expect.any(Function)
		});
	});
});

describe('useMsgMoveToFolderFn', () => {
	populateFoldersStore({ view: FOLDER_VIEW.message });
	const messagesId = times(faker.number.int({ max: 42 }), () =>
		faker.number.int({ max: 42000 }).toString()
	);
	const store = generateStore();

	it('Should return an object with execute and canExecute functions', () => {
		const {
			result: { current: functions }
		} = setupHook(useMsgMoveToFolderFn, {
			store,
			initialProps: [{ messagesId, deselectAll: jest.fn(), folderId: FOLDERS.INBOX }]
		});

		expect(functions).toEqual({
			execute: expect.any(Function),
			canExecute: expect.any(Function)
		});
	});

	describe('canExecute', () => {
		it.each`
			folder                              | assertion
			${FOLDERS_DESCRIPTORS.INBOX}        | ${true}
			${FOLDERS_DESCRIPTORS.SENT}         | ${true}
			${FOLDERS_DESCRIPTORS.DRAFTS}       | ${true}
			${FOLDERS_DESCRIPTORS.TRASH}        | ${false}
			${FOLDERS_DESCRIPTORS.SPAM}         | ${true}
			${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${true}
		`(`should return $assertion if the folder is $folder.desc`, ({ folder, assertion }) => {
			const {
				result: { current: functions }
			} = setupHook(useMsgMoveToFolderFn, {
				store,
				initialProps: [{ messagesId, deselectAll: jest.fn(), folderId: folder.id }]
			});

			expect(functions.canExecute()).toEqual(assertion);
		});
	});

	describe('execute', () => {
		it('should call open the move modal', async () => {
			const {
				result: { current: functions }
			} = setupHook(useMsgMoveToFolderFn, {
				store,
				initialProps: [{ messagesId, deselectAll: jest.fn(), folderId: FOLDERS.INBOX }]
			});

			act(() => {
				functions.execute();
			});

			act(() => {
				jest.advanceTimersByTime(TIMERS.modal_open_delay);
			});

			expect(screen.getByText(`Move Message`)).toBeVisible();
		});

		it('should not open the deletion modal with if the action cannot be executed', async () => {
			const {
				result: { current: functions }
			} = setupHook(useMsgMoveToFolderFn, {
				store,
				initialProps: [{ messagesId, deselectAll: jest.fn(), folderId: FOLDERS.TRASH }]
			});

			act(() => {
				functions.execute();
			});

			act(() => {
				jest.advanceTimersByTime(TIMERS.modal_open_delay);
			});

			expect(screen.queryByText(`Move Message`)).not.toBeInTheDocument();
		});
	});
});
