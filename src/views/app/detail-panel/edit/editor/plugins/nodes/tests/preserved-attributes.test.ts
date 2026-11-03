/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable jest-dom/prefer-to-have-style, jest-dom/prefer-to-have-attribute, sonarjs/no-duplicate-string */
import {
	applyAttributes,
	applyEditorViewAttributes,
	areAttributesEqual,
	extractParagraphAttributes,
	extractPreservedAttributes,
	hasBlockChild,
	mergeStyleDeclarations,
	TABLE_EDITOR_VIEW_ATTRIBUTES
} from '../preserved-attributes';

const createElement = (html: string): HTMLElement => {
	const holder = document.createElement('div');
	// eslint-disable-next-line no-param-reassign
	holder.innerHTML = html;
	return holder.firstElementChild as HTMLElement;
};

describe('preserved-attributes', () => {
	describe('extractPreservedAttributes', () => {
		it('keeps the whitelisted attributes', () => {
			const element = createElement(
				'<div style="color: red" class="a" id="b" dir="rtl" lang="it" align="center"></div>'
			);

			expect(extractPreservedAttributes(element)).toEqual({
				style: 'color: red',
				class: 'a',
				id: 'b',
				dir: 'rtl',
				lang: 'it',
				align: 'center'
			});
		});

		it('keeps data-* attributes but not the ones managed by Lexical', () => {
			const element = createElement('<div data-foo="1" data-lexical-text="true"></div>');

			expect(extractPreservedAttributes(element)).toEqual({ 'data-foo': '1' });
		});

		it('never keeps event handlers, href or src', () => {
			const element = createElement('<div onclick="alert(1)" href="x" src="y"></div>');

			expect(extractPreservedAttributes(element)).toEqual({});
		});

		it('skips attributes with a blank value', () => {
			const element = createElement('<div class="  " style=""></div>');

			expect(extractPreservedAttributes(element)).toEqual({});
		});
	});

	describe('extractParagraphAttributes', () => {
		it('leaves dir out', () => {
			const element = createElement('<p dir="ltr" class="x"></p>');

			expect(extractParagraphAttributes(element)).toEqual({ class: 'x' });
		});
	});

	describe('hasBlockChild', () => {
		it('is true when a child is a block element', () => {
			expect(hasBlockChild(createElement('<div><span>a</span><p>b</p></div>'))).toBe(true);
			expect(hasBlockChild(createElement('<div><table></table></div>'))).toBe(true);
		});

		it('is false when there are only inline children', () => {
			expect(hasBlockChild(createElement('<div><span>a</span><b>b</b></div>'))).toBe(false);
		});
	});

	describe('applyAttributes', () => {
		it('sets every attribute on the element', () => {
			const element = createElement('<div></div>');

			applyAttributes(element, { id: 'x', class: 'y' });

			expect(element.id).toBe('x');
			expect(element.className).toBe('y');
		});
	});

	describe('mergeStyleDeclarations', () => {
		it('overrides existing declarations and keeps the others', () => {
			const element = createElement('<div style="color: red; margin: 0"></div>');

			mergeStyleDeclarations(element, 'color: blue; padding: 4px');

			expect(element.style.color).toBe('blue');
			expect(element.style.margin).toBe('0px');
			expect(element.style.padding).toBe('4px');
		});

		it('skips the listed properties', () => {
			const element = createElement('<div></div>');

			mergeStyleDeclarations(element, 'color: blue; padding: 4px', ['padding']);

			expect(element.style.color).toBe('blue');
			expect(element.style.padding).toBe('');
		});

		it('keeps the !important priority', () => {
			const element = createElement('<div></div>');

			mergeStyleDeclarations(element, 'color: blue !important');

			expect(element.style.getPropertyPriority('color')).toBe('important');
		});
	});

	describe('applyEditorViewAttributes', () => {
		it('applies the allowed attributes only', () => {
			const element = createElement('<div></div>');

			applyEditorViewAttributes(element, {
				dir: 'rtl',
				lang: 'it',
				id: 'external',
				class: 'external',
				width: '100'
			});

			expect(element.getAttribute('dir')).toBe('rtl');
			expect(element.getAttribute('lang')).toBe('it');
			expect(element.id).toBe('');
			expect(element.className).toBe('');
			expect(element.hasAttribute('width')).toBe(false);
		});

		it('removes the positioning styles from the live element', () => {
			const element = createElement('<div></div>');

			applyEditorViewAttributes(element, {
				style: 'position: fixed; z-index: 9; top: 0; pointer-events: none; color: red'
			});

			expect(element.style.position).toBe('');
			expect(element.style.zIndex).toBe('');
			expect(element.style.top).toBe('');
			expect(element.style.pointerEvents).toBe('');
			expect(element.style.color).toBe('red');
		});

		it('applies the presentational table attributes when allowed', () => {
			const element = createElement('<table></table>');

			applyEditorViewAttributes(
				element,
				{ width: '100', border: '1', cellpadding: '2' },
				TABLE_EDITOR_VIEW_ATTRIBUTES
			);

			expect(element.getAttribute('width')).toBe('100');
			expect(element.getAttribute('border')).toBe('1');
			expect(element.getAttribute('cellpadding')).toBe('2');
		});

		it('skips the extra styles it is told to skip', () => {
			const element = createElement('<div></div>');

			applyEditorViewAttributes(
				element,
				{ style: 'color: red; width: 10px' },
				['style'],
				['width']
			);

			expect(element.style.color).toBe('red');
			expect(element.style.width).toBe('');
		});
	});

	describe('areAttributesEqual', () => {
		it('is true for the same entries regardless of order', () => {
			expect(areAttributesEqual({ a: '1', b: '2' }, { b: '2', a: '1' })).toBe(true);
		});

		it('is false when a value or a key differs', () => {
			expect(areAttributesEqual({ a: '1' }, { a: '2' })).toBe(false);
			expect(areAttributesEqual({ a: '1' }, { a: '1', b: '2' })).toBe(false);
			expect(areAttributesEqual({ a: '1', b: '2' }, { a: '1', c: '2' })).toBe(false);
		});
	});
});
