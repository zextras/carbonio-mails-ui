/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable testing-library/prefer-user-event,sonarjs/no-duplicate-string */
import React from 'react';

import { fireEvent, render, renderHook, screen } from '@testing-library/react';

import { useOnMouseHover } from 'hooks/use-on-mouse-hover';

describe('useOnMouseHover', () => {
	const hoverElementDataTestId = 'hover-element';
	const TestComponent: () => React.JSX.Element = () => {
		const { ref, hasBeenHovered } = useOnMouseHover();
		return (
			<div ref={ref} data-testid={hoverElementDataTestId}>
				{hasBeenHovered ? 'Hovered' : 'Not hovered'}
			</div>
		);
	};

	it('returns false initially for hasBeenHovered', () => {
		render(<TestComponent />);
		expect(screen.getByTestId(hoverElementDataTestId)).toHaveTextContent('Not hovered');
	});

	it('sets hasBeenHovered to true on mouse over', async () => {
		render(<TestComponent />);
		const hoverElement = screen.getByTestId(hoverElementDataTestId);
		fireEvent.mouseOver(hoverElement);
		expect(hoverElement).toHaveTextContent('Hovered');
	});

	it('keeps hasBeenHovered to true on mouse out', () => {
		render(<TestComponent />);
		const hoverElement = screen.getByTestId(hoverElementDataTestId);
		fireEvent.mouseOver(hoverElement);
		expect(hoverElement).toHaveTextContent('Hovered');
		fireEvent.mouseOut(hoverElement);
		expect(hoverElement).toHaveTextContent('Hovered');
	});

	it('cleans up event listeners on unmount', () => {
		const { unmount } = render(<TestComponent />);
		const hoverElement = screen.getByTestId(hoverElementDataTestId);

		// Simulate hover to set hasBeenHovered = true
		fireEvent.mouseOver(hoverElement);
		expect(hoverElement).toHaveTextContent('Hovered');

		unmount();

		// Try to trigger mouseover after unmounting (should not throw errors or update state)
		fireEvent.mouseOver(hoverElement);

		// Since it's unmounted, we can't directly check state, but we ensure no errors occurred
	});

	it('does not attach or remove event listeners if ref.current is null', () => {
		const { result, rerender, unmount } = renderHook(() => useOnMouseHover());

		expect(result.current.hasBeenHovered).toBe(false);

		// should do nothing since ref is null
		rerender();

		// Unmount should not throw errors since cleanup should handle null case
		expect(() => unmount()).not.toThrow();
	});
});
