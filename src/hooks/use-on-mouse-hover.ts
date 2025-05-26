/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MutableRefObject, useEffect, useRef, useState } from 'react';

/**
 * Custom hook to track mouse hover state on a referenced DOM element.
 *
 * @returns {[MutableRefObject<HTMLDivElement | null>, boolean]} - A tuple where:
 *   - `ref` is a `MutableRefObject` that should be attached to a `div` element.
 *   - `isHovered` is a boolean indicating whether the element is hovered.
 *
 * @example
 * function MyComponent() {
 *   const {ref, isHovered} = useOnMouseHover();
 *
 *   return (
 *     <div ref={ref} style={{ backgroundColor: isHovered ? 'blue' : 'gray' }}>
 *       Hover over me!
 *     </div>
 *   );
 * }
 */

type UseOnMouseHoverReturnType = {
	ref: MutableRefObject<HTMLDivElement | null>;
	hasBeenHovered: boolean;
};
export function useOnMouseHover(): UseOnMouseHoverReturnType {
	const [hasBeenHovered, setHasBeenHovered] = useState(false);
	const ref = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const handleMouseOver = (): void => {
			setHasBeenHovered(true);
		};
		const node = ref.current;

		if (node) {
			node.addEventListener('mouseover', handleMouseOver);
		}

		return () => {
			if (node) {
				node.removeEventListener('mouseover', handleMouseOver);
			}
		};
	}, []);

	return { ref, hasBeenHovered };
}
