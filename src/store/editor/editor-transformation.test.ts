/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { buildSavedAttachments, composeAttachMpField } from 'store/editor/editor-transformations';
import { generateMessage } from 'tests/generators/generateMessage';

describe('composeAttachMpField', () => {
	it('should correctly transform an array of SavedAttachment to an array of MailAttachmentParts', async () => {
		const savedAttachments = [
			{
				contentType: 'message/rfc822',
				size: 8539,
				isInline: false,
				filename: 'Conquista del mondo senza meeting room.eml',
				partName: '2',
				messageId: '11215'
			}
		];
		const result = composeAttachMpField(savedAttachments);

		const expectedOutput = [
			{
				mid: '11215',
				part: '2'
			}
		];
		expect(result).toEqual(expectedOutput);
	});
});

describe('buildSavedAttachments', () => {
	it('should return an empty array when there are no parts', () => {
		const message = generateMessage({ folderId: '2' });
		message.parts = [];
		const result = buildSavedAttachments(message);
		expect(result).toEqual([]);
	});

	it('should correctly mark image/* type with contentId as inline', () => {
		const message = generateMessage({ folderId: '2' });
		message.parts = [
			{
				contentType: 'image/png',
				filename: 'img.png',
				name: '2.2',
				size: 1234,
				ci: '<abc123@zimbra>'
			}
		];

		const result = buildSavedAttachments(message);

		expect(result[0]).toMatchObject({
			isInline: true,
			contentId: 'abc123@zimbra',
			partName: '2.2',
			contentType: 'image/png',
			filename: 'img.png',
			messageId: message.id
		});
	});

	it('should mark part with disposition "inline" as inline even if not an image', () => {
		const message = generateMessage({ folderId: '2' });
		message.parts = [
			{
				contentType: 'application/pdf',
				disposition: 'inline',
				filename: 'doc.pdf',
				name: '2.3',
				size: 2048
			}
		];

		const result = buildSavedAttachments(message);
		expect(result[0].isInline).toBe(true);
	});

	it('should not mark as inline when contentId is missing and disposition is not "inline"', () => {
		const message = generateMessage({ folderId: '2' });
		message.parts = [
			{
				contentType: 'application/pdf',
				filename: 'doc.pdf',
				name: '2.4',
				size: 512
			}
		];

		const result = buildSavedAttachments(message);
		expect(result[0].isInline).toBe(false);
	});

	it('should extract inner contentId from brackets', () => {
		const message = generateMessage({ folderId: '2' });
		message.parts = [
			{
				contentType: 'image/jpeg',
				ci: '<image123@crb>',
				name: '2.5',
				size: 200
			}
		];

		const result = buildSavedAttachments(message);
		expect(result[0].contentId).toBe('image123@crb');
	});

	it('should leave contentId undefined if ci is not present', () => {
		const message = generateMessage({ folderId: '2' });
		message.parts = [
			{
				contentType: 'image/jpeg',
				name: '2.6',
				size: 300
			}
		];

		const result = buildSavedAttachments(message);
		expect(result[0].contentId).toBeUndefined();
	});

	it('should correctly build a SavedAttachment for a part with inline CID and text/html content', () => {
		const message = generateMessage({ folderId: '2' });

		message.parts = [
			{
				contentType: 'text/html',
				content: `<html><body>
				<img src="cid:65766eee-4439-438c-a375-1ac111ed1a07@zimbra" />
				<p>Hello, this is a test email with inline image.</p>
			</body></html>`,
				size: 999,
				name: '2.2',
				ci: '<65766eee-4439-438c-a375-1ac111ed1a07@zimbra>'
			}
		];

		const result = buildSavedAttachments(message);

		expect(result).toEqual([
			{
				messageId: message.id,
				isInline: true, // because ci is present and contentType is text/html
				contentId: '65766eee-4439-438c-a375-1ac111ed1a07@zimbra',
				filename: '', // no filename provided
				partName: '2.2',
				contentType: 'text/html',
				size: 999
			}
		]);
	});
});
