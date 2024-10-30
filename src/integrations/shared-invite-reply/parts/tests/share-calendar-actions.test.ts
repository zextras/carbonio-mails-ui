import { Dispatch } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';

import { useAccept } from '../share-calendar-actions';

/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
describe('share calendar actions', () => {
	it('should mount shared calendar on accept', () => {
		const dispatch = jest.fn(() =>
			Promise.resolve({
				type: 'fullfilled'
			})
		) as Dispatch<any>;
		jest.spyOn(console, 'error').mockImplementation(jest.fn());
		const zid = 'zid';
		const view = 'view';
		const rid = 'rid';
		const calendarName = 'calendarName';
		const color = 1;
		const accounts = {};
		const { result } = renderHook(() => useAccept());
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
				t: jest.fn()
			})
		);
		expect(dispatch).toHaveBeenCalled();
	});
});
