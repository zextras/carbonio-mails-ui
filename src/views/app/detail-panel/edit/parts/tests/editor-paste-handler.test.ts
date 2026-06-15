/* eslint-disable sonarjs/no-duplicate-string */
// noinspection HtmlRequiredLangAttribute

/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	createTipTapPasteHandler,
	getPastedInlineImageFiles
} from 'views/app/detail-panel/edit/parts/editor-paste-handler';

const buildClipboardEvent = (overrides: Partial<DataTransfer> | null): ClipboardEvent =>
	({
		preventDefault: vi.fn(),
		clipboardData: overrides
	}) as unknown as ClipboardEvent;

const imageItem = (): DataTransferItem =>
	({
		type: 'image/png',
		getAsFile: vi.fn(() => new File(['dummy content'], 'test.png', { type: 'image/png' }))
	}) as unknown as DataTransferItem;

const textItem = (): DataTransferItem =>
	({
		type: 'text/plain',
		getAsFile: vi.fn(() => null)
	}) as unknown as DataTransferItem;

describe('getPastedInlineImageFiles', () => {
	it('should return an empty array if clipboardData is missing', () => {
		expect(getPastedInlineImageFiles(buildClipboardEvent(null))).toEqual([]);
	});

	it('should return an empty array if there are no images', () => {
		const event = buildClipboardEvent({
			items: [textItem()],
			getData: vi.fn(() => '')
		} as unknown as DataTransfer);
		expect(getPastedInlineImageFiles(event)).toEqual([]);
	});

	it('should return an empty array if pasted data is an image link', () => {
		const event = buildClipboardEvent({
			items: [imageItem()],
			getData: vi.fn((format: string) =>
				format === 'text/plain' ? 'https://example.com/image.png' : ''
			)
		} as unknown as DataTransfer);
		expect(getPastedInlineImageFiles(event)).toEqual([]);
	});

	it('should return an empty array when table content is present (Excel/Calc paste)', () => {
		const excelTableHtml = `<table><tr><td>Cell 1</td><td>Cell 2</td></tr></table>`;
		const event = buildClipboardEvent({
			items: [imageItem()],
			getData: vi.fn((format: string) => (format === 'text/html' ? excelTableHtml : ''))
		} as unknown as DataTransfer);
		expect(getPastedInlineImageFiles(event)).toEqual([]);
	});

	it('should return an empty array when the HTML payload references an external image', () => {
		const event = buildClipboardEvent({
			items: [imageItem()],
			getData: vi.fn((format: string) =>
				format === 'text/html' ? '<img src="http://example.com/a.png" />' : ''
			)
		} as unknown as DataTransfer);
		expect(getPastedInlineImageFiles(event)).toEqual([]);
	});

	it('should return the local image files for a valid image paste', () => {
		const event = buildClipboardEvent({
			items: [imageItem()],
			getData: vi.fn(() => '')
		} as unknown as DataTransfer);
		const files = getPastedInlineImageFiles(event);
		expect(files).toHaveLength(1);
		expect(files[0].name).toBe('test.png');
	});
});

describe('createTipTapPasteHandler', () => {
	it('should keep the default paste behaviour when there are no image files', () => {
		const onImageFiles = vi.fn();
		const handler = createTipTapPasteHandler({ onImageFiles });
		const event = buildClipboardEvent({
			items: [textItem()],
			getData: vi.fn(() => '')
		} as unknown as DataTransfer);

		expect(handler(event)).toBe(false);
		expect(event.preventDefault).not.toHaveBeenCalled();
		expect(onImageFiles).not.toHaveBeenCalled();
	});

	it('should prevent default and forward the image files when present', () => {
		const onImageFiles = vi.fn();
		const handler = createTipTapPasteHandler({ onImageFiles });
		const event = buildClipboardEvent({
			items: [imageItem()],
			getData: vi.fn(() => '')
		} as unknown as DataTransfer);

		expect(handler(event)).toBe(true);
		expect(event.preventDefault).toHaveBeenCalled();
		expect(onImageFiles).toHaveBeenCalledWith(expect.arrayContaining([expect.any(File)]));
	});
});
