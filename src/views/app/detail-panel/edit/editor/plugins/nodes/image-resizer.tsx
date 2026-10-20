/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useRef } from 'react';

import { t } from '@zextras/carbonio-shell-ui';

const MIN_SIZE = 40;

type Direction = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const HANDLES: ReadonlyArray<Direction> = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

type DragState = {
	startX: number;
	startY: number;
	startWidth: number;
	startHeight: number;
	/** width / height the image keeps while resizing; null when it can't be determined */
	ratio: number | null;
};

export type ImageResizerProps = {
	imageRef: React.RefObject<HTMLImageElement>;
	onResizeStart: () => void;
	onResizeEnd: (width: number, height: number) => void;
};

/**
 * Original aspect ratio of the image: the intrinsic one when the image is
 * loaded, otherwise the currently rendered one.
 */
function getImageRatio(image: HTMLImageElement, rendered: DOMRect): number | null {
	const natural = image.naturalWidth / image.naturalHeight;
	if (Number.isFinite(natural) && natural > 0) {
		return natural;
	}
	const current = rendered.width / rendered.height;
	return Number.isFinite(current) && current > 0 ? current : null;
}

function nextSize(
	direction: Direction,
	drag: DragState,
	clientX: number,
	clientY: number
): {
	width: number;
	height: number;
} {
	const deltaX = clientX - drag.startX;
	const deltaY = clientY - drag.startY;
	let width = drag.startWidth;
	let height = drag.startHeight;

	if (direction.includes('e')) {
		width = drag.startWidth + deltaX;
	} else if (direction.includes('w')) {
		width = drag.startWidth - deltaX;
	}
	if (direction.includes('s')) {
		height = drag.startHeight + deltaY;
	} else if (direction.includes('n')) {
		height = drag.startHeight - deltaY;
	}

	const { ratio } = drag;
	if (ratio === null) {
		return {
			width: Math.max(MIN_SIZE, Math.round(width)),
			height: Math.max(MIN_SIZE, Math.round(height))
		};
	}

	// Keep the original aspect ratio: the side handles drive a single axis, the
	// corner handles follow whichever axis the pointer moved the most.
	const horizontal = direction === 'e' || direction === 'w';
	const vertical = direction === 'n' || direction === 's';
	const widthScale = Math.abs(width / drag.startWidth - 1);
	const heightScale = Math.abs(height / drag.startHeight - 1);
	const drivenByHeight = vertical || (!horizontal && heightScale > widthScale);
	const rawWidth = drivenByHeight ? height * ratio : width;

	const nextWidth = Math.max(MIN_SIZE, MIN_SIZE * ratio, Math.round(rawWidth));
	return { width: nextWidth, height: Math.round(nextWidth / ratio) };
}

/**
 * Drag handles overlaid on a selected {@link ImageNode}. Resizing updates the
 * image DOM live for an immediate preview and commits the final size once on
 * mouse up (via `onResizeEnd`) so it does not flood the change/save pipeline.
 */
export const ImageResizer = ({
	imageRef,
	onResizeStart,
	onResizeEnd
}: ImageResizerProps): React.JSX.Element => {
	const dragRef = useRef<{ direction: Direction; state: DragState } | null>(null);

	const onPointerMove = useCallback(
		(event: MouseEvent): void => {
			const drag = dragRef.current;
			const image = imageRef.current;
			if (drag === null || image === null) {
				return;
			}
			const { width, height } = nextSize(drag.direction, drag.state, event.clientX, event.clientY);
			// The height is left to the aspect ratio so the image can't be distorted
			// when its width is capped by the container.
			image.style.width = `${width}px`;
			image.style.height = 'auto';
			image.style.aspectRatio = `${width} / ${height}`;
		},
		[imageRef]
	);

	const onPointerUp = useCallback(
		(event: MouseEvent): void => {
			const drag = dragRef.current;
			document.removeEventListener('mousemove', onPointerMove);
			document.removeEventListener('mouseup', onPointerUp);
			dragRef.current = null;
			if (drag === null) {
				return;
			}
			const { width, height } = nextSize(drag.direction, drag.state, event.clientX, event.clientY);
			onResizeEnd(width, height);
		},
		[onPointerMove, onResizeEnd]
	);

	const onHandleMouseDown = useCallback(
		(direction: Direction, event: React.MouseEvent): void => {
			const image = imageRef.current;
			if (image === null) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			const rect = image.getBoundingClientRect();
			dragRef.current = {
				direction,
				state: {
					startX: event.clientX,
					startY: event.clientY,
					startWidth: rect.width,
					startHeight: rect.height,
					ratio: getImageRatio(image, rect)
				}
			};
			onResizeStart();
			document.addEventListener('mousemove', onPointerMove);
			document.addEventListener('mouseup', onPointerUp);
		},
		[imageRef, onPointerMove, onPointerUp, onResizeStart]
	);

	return (
		<>
			{HANDLES.map((direction) => (
				<button
					key={direction}
					type="button"
					aria-label={t('lexical-label.image_resize', 'Resize image')}
					className={`mails-lexical-image-resizer mails-lexical-image-resizer-${direction}`}
					data-testid={`image-resizer-${direction}`}
					onMouseDown={(event): void => onHandleMouseDown(direction, event)}
				/>
			))}
		</>
	);
};
