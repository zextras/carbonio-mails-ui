/* eslint-disable @typescript-eslint/explicit-function-return-type */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { renderHook, act } from '@testing-library/react';

import { useMarkAsReadOnClick } from 'hooks/use-mark-as-read-on-click';

jest.mock('@zextras/carbonio-shell-ui', () => ({
	...jest.requireActual('@zextras/carbonio-shell-ui'),
	useUserSettings: () => ({
		prefs: { zimbraPrefMarkMsgRead: '0' }
	})
}));

const createActionMock = () => ({
	canExecute: jest.fn(() => true),
	execute: jest.fn()
});

describe('useMarkAsReadOnClick', () => {
	it('should execute action when unread, preference enabled and conditions pass', () => {
		const action = createActionMock();
		const { result } = renderHook(() =>
			useMarkAsReadOnClick({ isRead: false, action, conditions: [true, true] })
		);

		act(() => {
			result.current();
		});

		expect(action.canExecute).toHaveBeenCalled();
		expect(action.execute).toHaveBeenCalled();
	});

	it('should NOT execute when already read', () => {
		const action = createActionMock();
		const { result } = renderHook(() =>
			useMarkAsReadOnClick({ isRead: true, action, conditions: [true] })
		);

		act(() => {
			result.current();
		});

		expect(action.canExecute).not.toHaveBeenCalled();
		expect(action.execute).not.toHaveBeenCalled();
	});

	it('should NOT execute when a condition fails', () => {
		const action = createActionMock();
		const { result } = renderHook(() =>
			useMarkAsReadOnClick({ isRead: false, action, conditions: [true, false] })
		);

		act(() => {
			result.current();
		});

		expect(action.canExecute).not.toHaveBeenCalled();
		expect(action.execute).not.toHaveBeenCalled();
	});

	it('should execute action when unread, preference enabled and no conditions provided', () => {
		const action = createActionMock();
		const { result } = renderHook(() =>
			useMarkAsReadOnClick({ isRead: false, action, conditions: [] })
		);
		act(() => {
			result.current();
		});

		expect(action.canExecute).toHaveBeenCalled();
		expect(action.execute).toHaveBeenCalled();
	});
});
