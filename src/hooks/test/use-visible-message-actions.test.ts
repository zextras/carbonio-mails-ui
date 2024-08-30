/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { renderHook, act } from '@testing-library/react-hooks';

import { useVisibleActionsCount } from '../use-visible-actions-count';

describe('useVisibleActionsCount', () => {
	let containerRef: React.RefObject<HTMLInputElement>;

	beforeEach(() => {
		containerRef = {
			current: {
				clientWidth: 500 // Set a mock width
			} as HTMLInputElement
		} as React.RefObject<HTMLInputElement>;
	});

	it('calculates the number of visible actions', () => {
		const { result } = renderHook(() => useVisibleActionsCount(containerRef, { iconWidth: 50 }));

		act(() => {
			// Trigger the calculation
			result.current[1]();
		});

		// If the container width is 500 and each icon is 50 wide, we should have 10 visible actions
		expect(result.current[0]).toBe(10);
	});
});
