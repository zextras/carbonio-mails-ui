/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type React from 'react';
import { CSSProperties, useEffect, useCallback, useRef } from 'react';

import { find } from 'lodash';

import { BORDERS } from '../constants';

/**
 * Define the border following the cardinal points (north, south, west, east).
 * Similar to the definition of the cursor for the pointer
 */
export type Border = 'n' | 's' | 'e' | 'w' | 'ne' | 'sw' | 'nw' | 'se';

export type ElementPosition = {
	top: number;
	left: number;
};

export type ElementSize = {
	width: number;
	height: number;
};

export type Geometry = ElementPosition & ElementSize;
type UseResizableReturnType = React.MouseEventHandler;

type ResizeOptions = {
	initialGeometry?: Partial<Geometry>;
	onGeometryChange?: (geometry: Partial<Geometry>) => void;
};

export function getCursorFromBorder(border: Border): NonNullable<CSSProperties['cursor']> {
	const direction = find(
		[
			['n', 's'],
			['e', 'w'],
			['ne', 'sw'],
			['nw', 'se']
		],
		(borders) => borders.includes(border)
	)?.join('');
	return direction?.concat('-resize') ?? '';
}

function calcNewSizeAndPosition(
	border: Border,
	from: { clientTop: number; clientLeft: number } & Geometry,
	mouseEvent: MouseEvent
): Geometry {
	const newSizeAndPosition = {
		top: from.top,
		left: from.left,
		height: from.height,
		width: from.width
	};
	if (border.includes('n')) {
		const heightDifference = from.clientTop - mouseEvent.clientY;
		newSizeAndPosition.height = from.height + heightDifference;
		newSizeAndPosition.top = from.top - heightDifference;
	}
	if (border.includes('s')) {
		newSizeAndPosition.height = mouseEvent.clientY - from.clientTop;
	}
	if (border.includes('e')) {
		newSizeAndPosition.width = mouseEvent.clientX - from.clientLeft;
	}
	if (border.includes('w')) {
		const widthDifference = from.clientLeft - mouseEvent.clientX;
		newSizeAndPosition.width = from.width + widthDifference;
		newSizeAndPosition.left = from.left - widthDifference;
	}
	return newSizeAndPosition;
}

export function setGlobalCursor(cursor: CSSProperties['cursor']): void {
	// remove previously set cursor
	const cursors: string[] = [];
	document.body.classList.forEach((item) => {
		if (item.startsWith('global-cursor-')) {
			cursors.push(item);
		}
	});
	document.body.classList.remove(...cursors);
	if (cursor) {
		document.body.classList.add(`global-cursor-${cursor}`);
	}
}

export const useResize = (
	elementToResizeRef: React.RefObject<HTMLElement>,
	border: Border,
	options?: ResizeOptions
): UseResizableReturnType => {
	const initialSizeAndPositionRef = useRef<Parameters<typeof calcNewSizeAndPosition>[1]>();
	const lastSizeAndPositionRef = useRef<Partial<Geometry>>(options?.initialGeometry ?? {});

	useEffect(() => {
		lastSizeAndPositionRef.current = { ...options?.initialGeometry };
	}, [options?.initialGeometry]);

	const resizeElement = useCallback(
		({ width, height, top, left }: Geometry) => {
			if (elementToResizeRef.current) {
				const elementToResize = elementToResizeRef.current;
				const sizeAndPositionToApply: Partial<Geometry> = lastSizeAndPositionRef.current;
				if (top >= 0 && border === BORDERS.SOUTH) {
					sizeAndPositionToApply.height = height;
					sizeAndPositionToApply.top = top;
					elementToResize.style.height = `${height}px`;
					elementToResize.style.top = `${top}px`;
				}
				if (left >= 0 && border === BORDERS.EAST) {
					sizeAndPositionToApply.width = width;
					sizeAndPositionToApply.left = left;
					elementToResize.style.width = `${width}px`;
					elementToResize.style.left = `${left}px`;
				}
				// reset bottom in favor of top
				elementToResize.style.bottom = '';
				// reset right in favor of left
				elementToResize.style.right = '';
				lastSizeAndPositionRef.current = sizeAndPositionToApply;
			}
		},
		[border, elementToResizeRef]
	);

	const onMouseMove = useCallback(
		(mouseMoveEvent: MouseEvent) => {
			if (initialSizeAndPositionRef.current) {
				const newSizeAndPosition = calcNewSizeAndPosition(
					border,
					initialSizeAndPositionRef.current,
					mouseMoveEvent
				);
				resizeElement(newSizeAndPosition);
			}
		},
		[border, resizeElement]
	);

	const onMouseUp = useCallback(() => {
		setGlobalCursor(undefined);
		document.body.removeEventListener('mousemove', onMouseMove);
		document.body.removeEventListener('mouseup', onMouseUp);
		options?.onGeometryChange?.(lastSizeAndPositionRef.current);
	}, [onMouseMove, options]);

	return useCallback(
		(mouseDownEvent: React.MouseEvent | MouseEvent) => {
			if (!mouseDownEvent.defaultPrevented && elementToResizeRef.current) {
				mouseDownEvent.preventDefault();
				const clientRect = elementToResizeRef.current.getBoundingClientRect();
				initialSizeAndPositionRef.current = {
					height: initialSizeAndPositionRef?.current?.height ?? 0,
					width: elementToResizeRef.current.offsetWidth,
					// height: elementToResizeRef.current.offsetHeight,
					top: elementToResizeRef.current.offsetTop,
					left: elementToResizeRef.current.offsetLeft,
					clientTop: clientRect.top,
					clientLeft: clientRect.left
				};
				setGlobalCursor(getCursorFromBorder(border));
				document.body.addEventListener('mousemove', onMouseMove);
				document.body.addEventListener('mouseup', onMouseUp);
			}
		},
		[border, elementToResizeRef, onMouseMove, onMouseUp]
	);
};
