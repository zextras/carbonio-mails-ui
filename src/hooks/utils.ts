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
	if (!(target instanceof HTMLElement)) return false;

	const inputTags = ['INPUT', 'TEXTAREA', 'SELECT'];
	return (
		target.isContentEditable ||
		inputTags.includes(target.nodeName) ||
		target.closest('[contenteditable="true"]') !== null ||
		target.closest('[contenteditable=""]') !== null ||
		target.closest('[contenteditable="plaintext-only"]') !== null
	);
}

export function hasModalOverlay(): boolean {
	return MODAL_SELECTORS.some((selector) => document.querySelector(selector) !== null);
}
