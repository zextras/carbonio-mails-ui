/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const MODAL_SELECTORS = [
	'[data-testid*="modal"]',
	'[data-testid*="Modal"]',
	'[data-testid*="BoardContainerComp"]'
];

export function isInputContext(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return true;

	const inputTags = ['INPUT', 'TEXTAREA', 'SELECT'];
	return (
		target.isContentEditable ||
		inputTags.includes(target.nodeName) ||
		target.closest('[contenteditable="true"]') !== null
	);
}

export function hasModalOverlay(): boolean {
	return MODAL_SELECTORS.some((selector) => document.querySelector(selector) !== null);
}
