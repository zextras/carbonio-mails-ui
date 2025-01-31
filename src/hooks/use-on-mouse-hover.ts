/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useState, useRef, useEffect, MutableRefObject } from 'react';

/**
 * Custom hook to track mouse hover state on a referenced DOM element.
 *
 * @returns {[MutableRefObject<HTMLDivElement | null>, boolean]} - A tuple where:
 *   - `ref` is a `MutableRefObject` that should be attached to a `div` element.
 *   - `isHovered` is a boolean indicating whether the element is hovered.
 *
 * @example
 * function MyComponent() {
 *   const [ref, isHovered] = useOnMouseHover();
 *
 *   return (
 *     <div ref={ref} style={{ backgroundColor: isHovered ? 'blue' : 'gray' }}>
 *       Hover over me!
 *     </div>
 *   );
 * }
 */
export function useOnMouseHover(): [
	ref: MutableRefObject<HTMLDivElement | null>,
	isHovered: boolean
] {
	const [isHovered, setIsHovered] = useState(false);
	const ref = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		const handleMouseOver = (): void => setIsHovered(true);
		const handleMouseOut = (): void => setIsHovered(false);
		const node = ref.current;
		if (node) {
			node.addEventListener('mouseover', handleMouseOver);
			node.addEventListener('mouseout', handleMouseOut);
		}
		return () => {
			if (node) {
				node.removeEventListener('mouseover', handleMouseOver);
				node.removeEventListener('mouseout', handleMouseOut);
			}
		};
	}, []);
	return [ref, isHovered];
}
