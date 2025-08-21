/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { isInputContext } from 'hooks/utils';

describe('isInputContext', () => {
	let container: HTMLDivElement;

	beforeEach(() => {
		// Create a container for test elements
		container = document.createElement('div');
		document.body.appendChild(container);
	});

	afterEach(() => {
		// Clean up after each test
		document.body.removeChild(container);
	});

	describe('non-HTMLElement targets', () => {
		it('should return false for null', () => {
			expect(isInputContext(null)).toBe(false);
		});

		it('should return false for non-HTMLElement EventTarget', () => {
			// Create a non-HTMLElement EventTarget (e.g., XMLHttpRequest, Window, Document)
			const xhr = new XMLHttpRequest();
			expect(isInputContext(xhr)).toBe(false);
		});

		it('should return false for Document', () => {
			expect(isInputContext(document)).toBe(false);
		});

		it('should return false for Window', () => {
			expect(isInputContext(window)).toBe(false);
		});

		it('should return false for Text node', () => {
			const textNode = document.createTextNode('test');
			expect(isInputContext(textNode)).toBe(false);
		});
	});

	describe('input elements', () => {
		it('should return true for INPUT element', () => {
			const input = document.createElement('input');
			container.appendChild(input);
			expect(isInputContext(input)).toBe(true);
		});

		it('should return true for TEXTAREA element', () => {
			const textarea = document.createElement('textarea');
			container.appendChild(textarea);
			expect(isInputContext(textarea)).toBe(true);
		});

		it('should return true for SELECT element', () => {
			const select = document.createElement('select');
			container.appendChild(select);
			expect(isInputContext(select)).toBe(true);
		});

		it('should return true for different input types', () => {
			const inputTypes = ['text', 'password', 'email', 'number', 'date', 'checkbox', 'radio'];

			inputTypes.forEach((type) => {
				const input = document.createElement('input');
				input.type = type;
				container.appendChild(input);
				expect(isInputContext(input)).toBe(true);
			});
		});
	});

	describe('contentEditable elements', () => {
		it('should return true for element with contentEditable="true"', () => {
			const div = document.createElement('div');
			div.setAttribute('contenteditable', 'true');
			container.appendChild(div);

			expect(isInputContext(div)).toBe(true);
		});

		it('should return false for element with contentEditable="false"', () => {
			const div = document.createElement('div');
			div.setAttribute('contenteditable', 'false');
			container.appendChild(div);
			expect(isInputContext(div)).toBe(false);
		});

		it('should return true for nested element inside contentEditable parent', () => {
			const parent = document.createElement('div');
			parent.setAttribute('contenteditable', 'true');
			const child = document.createElement('span');
			parent.appendChild(child);
			container.appendChild(parent);

			expect(isInputContext(child)).toBe(true);
		});

		it('should return true for deeply nested element inside contentEditable ancestor', () => {
			const grandparent = document.createElement('div');
			grandparent.setAttribute('contenteditable', 'true');
			const parent = document.createElement('div');
			const child = document.createElement('span');

			grandparent.appendChild(parent);
			parent.appendChild(child);
			container.appendChild(grandparent);

			expect(isInputContext(child)).toBe(true);
		});

		it('should return false for element outside contentEditable context', () => {
			const editableDiv = document.createElement('div');
			editableDiv.setAttribute('contenteditable', 'true');
			const normalDiv = document.createElement('div');

			container.appendChild(editableDiv);
			container.appendChild(normalDiv);

			expect(isInputContext(normalDiv)).toBe(false);
		});
	});

	describe('edge cases', () => {
		it('should handle contenteditable with different string values', () => {
			const div0 = document.createElement('div');
			div0.setAttribute('contenteditable', '');
			container.appendChild(div0);
			// Empty contenteditable attribute typically means true
			expect(isInputContext(div0)).toBe(true);

			const div1 = document.createElement('div');
			div1.setAttribute('contenteditable', 'true');
			container.appendChild(div1);
			expect(isInputContext(div1)).toBe(true);

			const div2 = document.createElement('div');
			div2.setAttribute('contenteditable', 'plaintext-only');
			container.appendChild(div2);
			expect(isInputContext(div2)).toBe(true);
		});
	});
});
