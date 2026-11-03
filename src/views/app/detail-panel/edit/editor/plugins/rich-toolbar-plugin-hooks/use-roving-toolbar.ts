/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { type KeyboardEvent, type RefObject, useCallback, useEffect, useRef } from 'react';

/**
 * Elements inside the toolbar that must stay out of the roving group (e.g. the
 * color picker popover, which manages its own focus).
 */
export const ROVING_TOOLBAR_IGNORE_ATTRIBUTE = 'data-roving-toolbar-ignore';

const ITEM_SELECTOR = `button:not([disabled]), [tabindex]:not([aria-hidden="true"])`;

const getItems = (toolbar: HTMLElement): HTMLElement[] => {
	const candidates = Array.from(toolbar.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).filter(
		(element) =>
			element.closest(`[${ROVING_TOOLBAR_IGNORE_ATTRIBUTE}]`) === null &&
			element.closest('[aria-hidden="true"]') === null
	);
	// Drop elements nested in another candidate, so a composite control (e.g. a
	// select) counts as a single item.
	return candidates.filter(
		(element) => !candidates.some((other) => other !== element && other.contains(element))
	);
};

type RovingToolbar = {
	toolbarRef: RefObject<HTMLDivElement>;
	onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
	/** Moves the focus to the toolbar item that was last focused (or the first). */
	focusToolbar: () => void;
};

/**
 * Implements the WAI-ARIA "toolbar" keyboard pattern, except that the toolbar
 * is not part of the Tab sequence (so Tab goes straight from the header fields
 * to the editor body): it is entered with `focusToolbar` (a shortcut), then
 * Left/Right/Home/End move between its controls. `onEscape` is called when
 * Escape is pressed on a control.
 */
export const useRovingToolbar = (onEscape?: () => void): RovingToolbar => {
	const toolbarRef = useRef<HTMLDivElement>(null);
	const activeItemRef = useRef<HTMLElement | null>(null);

	const syncTabIndexes = useCallback((): void => {
		const toolbar = toolbarRef.current;
		if (!toolbar) {
			return;
		}
		const items = getItems(toolbar);
		if (items.length === 0) {
			return;
		}
		if (!activeItemRef.current || !items.includes(activeItemRef.current)) {
			[activeItemRef.current] = items;
		}
		items.forEach((item) => {
			item.setAttribute('tabindex', '-1');
		});
	}, []);

	// The toolbar's content changes with the selection (e.g. the image alignment
	// control) and the design-system components may rewrite `tabindex` on render.
	useEffect(() => {
		syncTabIndexes();
	});

	useEffect(() => {
		const toolbar = toolbarRef.current;
		if (!toolbar) {
			return undefined;
		}
		const observer = new MutationObserver(syncTabIndexes);
		observer.observe(toolbar, { childList: true, subtree: true });

		const handleFocusIn = (event: FocusEvent): void => {
			const items = getItems(toolbar);
			const target = event.target as HTMLElement;
			const item = items.find((candidate) => candidate === target || candidate.contains(target));
			if (item) {
				activeItemRef.current = item;
				syncTabIndexes();
			}
		};
		toolbar.addEventListener('focusin', handleFocusIn);

		return (): void => {
			observer.disconnect();
			toolbar.removeEventListener('focusin', handleFocusIn);
		};
	}, [syncTabIndexes]);

	const focusToolbar = useCallback((): void => {
		const toolbar = toolbarRef.current;
		if (!toolbar) {
			return;
		}
		syncTabIndexes();
		activeItemRef.current?.focus();
	}, [syncTabIndexes]);

	const onKeyDown = useCallback(
		(event: KeyboardEvent<HTMLElement>): void => {
			const toolbar = toolbarRef.current;
			if (!toolbar || event.defaultPrevented) {
				return;
			}
			const items = getItems(toolbar);
			const currentIndex = items.indexOf(event.target as HTMLElement);
			// Ignore events from popovers/portals (e.g. an open dropdown menu)
			if (currentIndex === -1) {
				return;
			}

			let nextIndex: number | undefined;
			switch (event.key) {
				case 'ArrowRight':
					nextIndex = (currentIndex + 1) % items.length;
					break;
				case 'ArrowLeft':
					nextIndex = (currentIndex - 1 + items.length) % items.length;
					break;
				case 'Home':
					nextIndex = 0;
					break;
				case 'End':
					nextIndex = items.length - 1;
					break;
				case 'Escape':
					if (onEscape) {
						event.preventDefault();
						onEscape();
					}
					return;
				default:
					return;
			}
			event.preventDefault();
			items[nextIndex].focus();
		},
		[onEscape]
	);

	return { toolbarRef, onKeyDown, focusToolbar };
};
