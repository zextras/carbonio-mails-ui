/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useRef } from 'react';

import { t } from '@zextras/carbonio-shell-ui';

const MIN_SIZE = 40;

type Direction = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const HANDLES: ReadonlyArray<Direction> = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

type Size = {
	width: number;
	height: number;
};

type DragState = {
	startX: number;
	startY: number;
	startWidth: number;
	startHeight: number;
	/** Width / height kept while resizing; null when it can't be read (free resize). */
	ratio: number | null;
};

export type ImageResizerProps = {
	imageRef: React.RefObject<HTMLImageElement>;
	onResizeStart: () => void;
	onResizeEnd: (width: number, height: number) => void;
};

function toRatio(width: number, height: number): number | null {
	const ratio = width / height;
	return Number.isFinite(ratio) && ratio > 0 ? ratio : null;
}

/**
 * Aspect ratio kept by the resize: the natural one of the image once it is
 * loaded, otherwise the rendered one. Null (free resize) when the image has no
 * rendered size, since the proportional resize scales from it.
 */
function getImageRatio(image: HTMLImageElement, rendered: DOMRect): number | null {
	if (!(rendered.width > 0 && rendered.height > 0)) {
		return null;
	}
	return (
		toRatio(image.naturalWidth, image.naturalHeight) ?? toRatio(rendered.width, rendered.height)
	);
}

/** Size following the pointer on the axes moved by the handle, with no constraint. */
function pointerSize(
	direction: Direction,
	drag: DragState,
	clientX: number,
	clientY: number
): Size {
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
	return { width, height };
}

/**
 * Scales the image keeping `ratio`: a side handle drives its own axis and the
 * other one follows, a corner handle follows the axis the pointer moved the most.
 * The smaller side doesn't go below {@link MIN_SIZE}; an image that was already
 * smaller than that when the drag started (e.g. a thin divider) can't be shrunk,
 * but it isn't enlarged to reach the minimum either.
 */
function proportionalSize(
	direction: Direction,
	drag: DragState,
	ratio: number,
	pointer: Size
): Size {
	const horizontal = direction === 'e' || direction === 'w';
	const vertical = direction === 'n' || direction === 's';
	const widthChange = Math.abs(pointer.width / drag.startWidth - 1);
	const heightChange = Math.abs(pointer.height / drag.startHeight - 1);
	const drivenByHeight = vertical || (!horizontal && heightChange > widthChange);
	const width = drivenByHeight ? pointer.height * ratio : pointer.width;

	const minWidth = Math.max(
		1,
		Math.min(Math.ceil(MIN_SIZE * Math.max(1, ratio)), Math.round(drag.startWidth))
	);
	const nextWidth = Math.max(minWidth, Math.round(width));
	return { width: nextWidth, height: Math.max(1, Math.round(nextWidth / ratio)) };
}

function nextSize(direction: Direction, drag: DragState, clientX: number, clientY: number): Size {
	const pointer = pointerSize(direction, drag, clientX, clientY);
	if (drag.ratio !== null) {
		return proportionalSize(direction, drag, drag.ratio, pointer);
	}
	return {
		width: Math.max(MIN_SIZE, Math.round(pointer.width)),
		height: Math.max(MIN_SIZE, Math.round(pointer.height))
	};
}

/**
 * Drag handles overlaid on a selected {@link ImageNode}. Resizing keeps the
 * aspect ratio of the image, updates the image DOM live for an immediate preview
 * and commits the final size once on mouse up (via `onResizeEnd`) so it does
 * not flood the change/save pipeline.
 */
export const ImageResizer = ({
	imageRef,
	onResizeStart,
	onResizeEnd
}: ImageResizerProps): React.JSX.Element => {
	const dragRef = useRef<{ direction: Direction; state: DragState } | null>(null);
	const removeDragListenersRef = useRef<(() => void) | null>(null);

	const onPointerMove = useCallback(
		(event: MouseEvent): void => {
			const drag = dragRef.current;
			const image = imageRef.current;
			if (drag === null || image === null) {
				return;
			}
			const { width, height } = nextSize(drag.direction, drag.state, event.clientX, event.clientY);
			// Same style the image is rendered with once the size is committed: the
			// height follows the aspect ratio, so the image can't be distorted when
			// its width is capped by the container.
			image.style.width = `${width}px`;
			image.style.height = 'auto';
			image.style.aspectRatio = `${width} / ${height}`;
		},
		[imageRef]
	);

	const endDrag = useCallback((): void => {
		removeDragListenersRef.current?.();
		removeDragListenersRef.current = null;
		dragRef.current = null;
	}, []);

	const onPointerUp = useCallback(
		(event: MouseEvent): void => {
			const drag = dragRef.current;
			endDrag();
			if (drag === null) {
				return;
			}
			const { width, height } = nextSize(drag.direction, drag.state, event.clientX, event.clientY);
			onResizeEnd(width, height);
		},
		[endDrag, onResizeEnd]
	);

	// Stop listening to the pointer if the handles go away mid-drag (e.g. the
	// image is deleted), so that no stale size is committed on the next mouse up.
	useEffect(() => endDrag, [endDrag]);

	const onHandleMouseDown = useCallback(
		(direction: Direction, event: React.MouseEvent): void => {
			const image = imageRef.current;
			if (image === null) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			endDrag();
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
			removeDragListenersRef.current = (): void => {
				document.removeEventListener('mousemove', onPointerMove);
				document.removeEventListener('mouseup', onPointerUp);
			};
		},
		[endDrag, imageRef, onPointerMove, onPointerUp, onResizeStart]
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
