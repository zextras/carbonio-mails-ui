/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { parseTextToHTMLDocument } from 'helpers/text';
import { MessageAction } from 'types/actions';
import {
	findMessageActionById,
	generateSmartLinkHtml,
	insertAboveSignature
} from 'ui-actions/utils';

describe('findMessageActionById', () => {
	test('returns undefined if an empty actions array is passed', () => {
		expect(findMessageActionById([], '42')).toBeUndefined();
	});

	test('returns undefined if no action has the given name', () => {
		const actions: Array<MessageAction> = [
			{
				id: 'dummy-action-1',
				icon: 'gear',
				label: 'dummy action 1',
				onClick: vi.fn()
			},
			{
				id: 'dummy-action-2',
				icon: 'gear',
				label: 'dummy action 2',
				onClick: vi.fn()
			}
		];
		expect(findMessageActionById(actions, '42')).toBeUndefined();
	});

	test('returns the action that has the given name', () => {
		const action1 = {
			id: 'dummy-action-1',
			icon: 'gear',
			label: 'dummy action 1',
			onClick: vi.fn()
		};

		const action2 = {
			id: 'dummy-action-2',
			icon: 'gear',
			label: 'dummy action 2',
			onClick: vi.fn()
		};

		const action3 = {
			id: 'dummy-action-3',
			icon: 'gear',
			label: 'dummy action 3',
			onClick: vi.fn()
		};

		const actions: Array<MessageAction> = [action1, action2, action3];
		expect(findMessageActionById(actions, 'dummy-action-2')).toBe(action2);
	});

	test('returns the first action if multiple actions have the same given name', () => {
		const action1 = {
			id: 'dummy-action-1',
			icon: 'gear',
			label: 'dummy action 1',
			onClick: vi.fn()
		};

		const action2 = {
			id: 'dummy-action-2',
			icon: 'gear',
			label: 'dummy action 2',
			onClick: vi.fn()
		};

		const action3 = {
			id: 'dummy-action-3',
			icon: 'gear',
			label: 'dummy action 3',
			onClick: vi.fn()
		};

		const action4 = {
			id: 'dummy-action-2',
			icon: 'gear',
			label: 'dummy action 2',
			onClick: vi.fn()
		};

		const action5 = {
			id: 'dummy-action-4',
			icon: 'gear',
			label: 'dummy action 4',
			onClick: vi.fn()
		};

		const actions: Array<MessageAction> = [action1, action2, action3, action4, action5];
		expect(findMessageActionById(actions, 'dummy-action-2')).toBe(action2);
		expect(findMessageActionById(actions, 'dummy-action-4')).not.toBe(action2);
	});
});

describe('generateSmartLinkHtml', () => {
	it('generates correct HTML for smart link with attachment filename', async () => {
		const publicLinkUrl = { publicUrl: 'https://example.com/file' };
		const result = generateSmartLinkHtml({
			publicLinkUrl: publicLinkUrl.publicUrl,
			filename: 'document.txt'
		});
		const htmlDoc = parseTextToHTMLDocument(result);
		const expectedFileName = 'document.txt';
		const linkElement = htmlDoc.getElementsByTagName('a')[0];
		const hrefValue = linkElement.getAttribute('href');
		expect(hrefValue).toBe(publicLinkUrl.publicUrl);
		expect(linkElement.text).toBe(expectedFileName);
	});

	it('falls back to publicUrl when filename is undefined', async () => {
		const smartLink = { publicUrl: 'https://example.com/file' };
		const index = 0;
		const attachmentsWithoutFileName = [{ publicLinkUrl: smartLink, filename: undefined }];
		const result = generateSmartLinkHtml({
			publicLinkUrl: smartLink.publicUrl,
			// disable typescript to check the fallback
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			filename: attachmentsWithoutFileName[index].filename
		});

		const htmlDoc = parseTextToHTMLDocument(result);
		const linkElement = htmlDoc.getElementsByTagName('a')[0];
		expect(linkElement.text).toBe(smartLink.publicUrl);
	});
});

describe('insertAboveSignature', () => {
	it('should insert content above signature div when signature div exists', () => {
		const htmlContent = '<p>this is a message</p><div class="signature-div">&nbsp;</div>';
		const contentToInsert = '<p>Inserted content</p>';
		const expected =
			'<p>this is a message</p><p>Inserted content</p><div class="signature-div">&nbsp;</div>';

		const result = insertAboveSignature(htmlContent, contentToInsert);

		expect(result).toBe(expected);
	});

	it('should append content at the end when no signature div exists', () => {
		const htmlContent = '<p>this is a message</p><p>another paragraph</p>';
		const contentToInsert = '<p>Appended content</p>';
		const expected = '<p>this is a message</p><p>another paragraph</p><p>Appended content</p>';

		const result = insertAboveSignature(htmlContent, contentToInsert);

		expect(result).toBe(expected);
	});

	it('should handle signature div with additional attributes', () => {
		const htmlContent =
			'<p>message</p><div id="sig1" class="signature-div extra-class" data-test="value">&nbsp;</div>';
		const contentToInsert = '<p>Inserted content</p>';
		const expected =
			'<p>message</p><p>Inserted content</p><div id="sig1" class="signature-div extra-class" data-test="value">&nbsp;</div>';

		const result = insertAboveSignature(htmlContent, contentToInsert);

		expect(result).toBe(expected);
	});

	it('should handle multiple signature divs and use the first one', () => {
		const htmlContent =
			'<p>message</p><div class="signature-div">first</div><div class="signature-div">second</div>';
		const contentToInsert = '<p>Inserted content</p>';
		const expected =
			'<p>message</p><p>Inserted content</p><div class="signature-div">first</div><div class="signature-div">second</div>';

		const result = insertAboveSignature(htmlContent, contentToInsert);

		expect(result).toBe(expected);
	});

	it('should handle empty html content', () => {
		const htmlContent = '';
		const contentToInsert = '<p>Inserted content</p>';
		const expected = '<p>Inserted content</p>';

		const result = insertAboveSignature(htmlContent, contentToInsert);

		expect(result).toBe(expected);
	});

	it('should handle empty content to insert', () => {
		const htmlContent = '<p>this is a message</p><div class="signature-div">&nbsp;</div>';
		const contentToInsert = '';
		const expected = '<p>this is a message</p><div class="signature-div">&nbsp;</div>';

		const result = insertAboveSignature(htmlContent, contentToInsert);

		expect(result).toBe(expected);
	});

	it('should handle complex HTML content to insert', () => {
		const htmlContent = '<p>this is a message</p><div class="signature-div">&nbsp;</div>';
		const contentToInsert = '<div><p>Nested content</p><span>More content</span></div>';
		const expected =
			'<p>this is a message</p><div><p>Nested content</p><span>More content</span></div><div class="signature-div">&nbsp;</div>';

		const result = insertAboveSignature(htmlContent, contentToInsert);

		expect(result).toBe(expected);
	});

	it('should handle multiple elements to insert', () => {
		const htmlContent = '<p>this is a message</p><div class="signature-div">&nbsp;</div>';
		const contentToInsert = '<p>First element</p><p>Second element</p>';
		const expected =
			'<p>this is a message</p><p>First element</p><p>Second element</p><div class="signature-div">&nbsp;</div>';

		const result = insertAboveSignature(htmlContent, contentToInsert);

		expect(result).toBe(expected);
	});

	it('should preserve whitespace and formatting', () => {
		const htmlContent = '<p>this is a message</p>\n<div class="signature-div">&nbsp;</div>';
		const contentToInsert = '<p>Inserted content</p>\n';
		const expected =
			'<p>this is a message</p>\n<p>Inserted content</p>\n<div class="signature-div">&nbsp;</div>';

		const result = insertAboveSignature(htmlContent, contentToInsert);

		expect(result).toBe(expected);
	});

	it('should handle signature div with class as substring', () => {
		const htmlContent =
			'<p>message</p><div class="my-signature-div-class">wrong div</div><div class="signature-div">correct div</div>';
		const contentToInsert = '<p>Inserted content</p>';
		const expected =
			'<p>message</p><div class="my-signature-div-class">wrong div</div><p>Inserted content</p><div class="signature-div">correct div</div>';

		const result = insertAboveSignature(htmlContent, contentToInsert);

		expect(result).toBe(expected);
	});

	it('should handle self-closing tags in content to insert', () => {
		const htmlContent = '<p>this is a message</p><div class="signature-div">&nbsp;</div>';
		const contentToInsert = '<img src="test.jpg" alt="test"><br>';
		const expected =
			'<p>this is a message</p><img src="test.jpg" alt="test"><br><div class="signature-div">&nbsp;</div>';

		const result = insertAboveSignature(htmlContent, contentToInsert);

		expect(result).toBe(expected);
	});
});
