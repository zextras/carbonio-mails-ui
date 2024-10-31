/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Dispatch } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';
import { CreateSnackbarFn, useSnackbar } from '@zextras/carbonio-design-system';

import { setupHook } from '../../../../carbonio-ui-commons/test/test-setup';
import { useAccept } from '../share-calendar-actions';

const createSnackbar = (arg: any): CreateSnackbarFn => arg;
const createSnackbarSpy = jest.fn(createSnackbar);

jest.mock('@zextras/carbonio-design-system', () => ({
	...jest.requireActual('@zextras/carbonio-design-system'),
	useSnackbar: jest.fn()
}));

beforeEach(() => {
	(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
});

afterEach(() => {
	jest.clearAllMocks();
});

describe('share calendar actions', () => {
	it('should mount shared calendar on accept', async () => {
		const dispatch = jest.fn(() =>
			Promise.resolve({
				type: 'fulfilled'
			})
		) as Dispatch<any>;
		const { unmount, result } = setupHook(useAccept);
		const zid = 'zid';
		const view = 'view';
		const rid = 'rid';
		const calendarName = 'calendarName';
		const color = 1;
		const accounts = {};

		const { current: accept } = result;
		renderHook(() =>
			accept({
				zid,
				view,
				rid,
				calendarName,
				color,
				accounts,
				dispatch,
				msgId: 'msgId',
				sharedCalendarName: calendarName,
				owner: 'owner',
				participants: [],
				grantee: 'grantee',
				customMessage: 'customMessage',
				role: 'role',
				allowedActions: 'allowedActions',
				notifyOrganizer: true,
				t: (msg, _) => msg
			})
		);
		await unmount();
		expect(dispatch).toHaveBeenCalled();
		expect(createSnackbarSpy).toHaveBeenCalledWith({
			key: 'share_accepted',
			replace: true,
			autoHideTimeout: 3000,
			hideButton: true,
			label: 'message.snackbar.share.accepted',
			severity: 'info'
		});
	});

	it('should display an error on existing folder', async () => {
		const dispatch = jest.fn(() =>
			Promise.resolve({
				type: 'error',
				error: {
					message: 'mail.ALREADY_EXISTS'
				}
			})
		) as Dispatch<any>;
		const { unmount, result } = setupHook(useAccept);
		const zid = 'zid';
		const view = 'view';
		const rid = 'rid';
		const calendarName = 'calendarName';
		const color = 1;
		const accounts = {};
		const { current: accept } = result;

		renderHook(() =>
			accept({
				zid,
				view,
				rid,
				calendarName,
				color,
				accounts,
				dispatch,
				msgId: 'msgId',
				sharedCalendarName: calendarName,
				owner: 'owner',
				participants: [],
				grantee: 'grantee',
				customMessage: 'customMessage',
				role: 'role',
				allowedActions: 'allowedActions',
				notifyOrganizer: true,
				t: (msg, _) => msg
			})
		);
		await unmount();
		expect(dispatch).toHaveBeenCalled();
		expect(createSnackbarSpy).toHaveBeenCalledWith({
			key: 'share',
			replace: true,
			autoHideTimeout: 3000,
			hideButton: true,
			label: 'label.error_folder_exists',
			severity: 'error'
		});
	});
});
