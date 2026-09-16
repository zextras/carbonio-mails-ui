/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as shell from '@zextras/carbonio-shell-ui';

import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { getMP } from 'store/editor/editor-transformations';
import { UnsavedAttachment } from 'types/attachments';
import { MailsEditorV2 } from 'types/editor';
import { SoapEmailMessagePartObj } from 'types/soap/save-draft';

const SIMPLE_PARAGRAPH = '<p>Hello</p>';

const setComposeFormat = (format: 'html' | 'text'): void => {
	vi.spyOn(shell, 'getUserSettings').mockImplementation(
		vi.fn(() => ({
			attrs: {},
			prefs: {
				zimbraPrefComposeFormat: format,
				zimbraPrefHtmlEditorDefaultFontFamily: 'arial, helvetica, sans-serif',
				zimbraPrefHtmlEditorDefaultFontSize: '12pt',
				zimbraPrefHtmlEditorDefaultFontColor: '#000000'
			},
			props: []
		}))
	);
};

const findPartByContentType = (
	parts: SoapEmailMessagePartObj[] | undefined,
	contentType: string
): SoapEmailMessagePartObj | undefined =>
	(parts ?? []).reduce<SoapEmailMessagePartObj | undefined>(
		(found, part) =>
			found ?? (part.ct === contentType ? part : findPartByContentType(part.mp, contentType)),
		undefined
	);

const setupRichTextEditor = (
	richText: string,
	unsavedAttachments: UnsavedAttachment[] = []
): MailsEditorV2 => ({
	...generateNewMessageEditor(),
	isRichText: true,
	text: { plainText: 'Hello', richText },
	unsavedAttachments
});

describe('getMP', () => {
	beforeEach(() => {
		setComposeFormat('html');
	});

	describe('text/html mime part (CO-4171)', () => {
		it('should send the HTML body as a complete document with html and body tags', () => {
			const editor = setupRichTextEditor(SIMPLE_PARAGRAPH);

			const htmlPart = findPartByContentType(getMP(editor), 'text/html');
			const html = htmlPart?.content?._content ?? '';

			expect(html).toMatch(/^<html>/);
			expect(html).toContain('<body>');
			expect(html).toContain('</body></html>');
			expect(html).toContain('Hello');
		});

		it('should keep the user preference styles inlined inside the body', () => {
			const editor = setupRichTextEditor(SIMPLE_PARAGRAPH);

			const html = findPartByContentType(getMP(editor), 'text/html')?.content?._content ?? '';

			expect(html).toContain('<body><p style=');
			expect(html).toContain('font-family: arial, helvetica, sans-serif');
			expect(html).not.toContain('<style');
		});

		it('should produce a single body element for the html part', () => {
			const editor = setupRichTextEditor(SIMPLE_PARAGRAPH);

			const html = findPartByContentType(getMP(editor), 'text/html')?.content?._content ?? '';

			expect(html.match(/<body/g)).toHaveLength(1);
			expect(html.match(/<\/body>/g)).toHaveLength(1);
		});

		it('should wrap the HTML body also when inline attachments are present', () => {
			const inlineAttachment: UnsavedAttachment = {
				aid: 'aid-1',
				contentId: '<image1@test>',
				contentType: 'image/png',
				filename: 'image.png',
				size: 10,
				isInline: true,
				uploadStatus: { status: 'completed' }
			} as unknown as UnsavedAttachment;
			const editor = setupRichTextEditor('<p>Hello <img src="cid:image1@test" /></p>', [
				inlineAttachment
			]);

			const parts = getMP(editor);
			const relatedPart = findPartByContentType(parts, 'multipart/related');
			const html = findPartByContentType(parts, 'text/html')?.content?._content ?? '';

			expect(relatedPart).toBeDefined();
			expect(html).toMatch(/^<html><body>/);
			expect(html).toMatch(/<\/body><\/html>$/);
		});

		it('should leave the text/plain part untouched', () => {
			const editor = setupRichTextEditor(SIMPLE_PARAGRAPH);

			const plainPart = findPartByContentType(getMP(editor), 'text/plain');

			expect(plainPart?.content?._content).toBe('Hello');
		});
	});

	describe('plain text editor', () => {
		it('should not wrap the content when the editor is plain text', () => {
			setComposeFormat('text');
			const editor: MailsEditorV2 = {
				...generateNewMessageEditor(),
				isRichText: false,
				text: { plainText: 'Hello', richText: SIMPLE_PARAGRAPH }
			};

			const parts = getMP(editor);

			expect(findPartByContentType(parts, 'text/html')).toBeUndefined();
			expect(findPartByContentType(parts, 'text/plain')?.content?._content).toBe('Hello');
		});
	});
});
