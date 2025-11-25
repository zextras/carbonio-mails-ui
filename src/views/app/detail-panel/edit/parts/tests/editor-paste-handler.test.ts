import { Mock } from 'vitest';
/* eslint-disable sonarjs/no-duplicate-string */
// noinspection HtmlRequiredLangAttribute

/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { type Editor } from 'tinymce';

import { uploadFileApi } from 'api/upload-file-api';
import { getEditor, useEditorsStore } from 'store/editor/index';
import { saveDraftEmailStoreAction } from 'store/emails/actions/save-draft-action';
import {
	testingPurposeOnly,
	handleEditorPaste
} from 'views/app/detail-panel/edit/parts/editor-paste-handler';

vi.mock('api/upload-file-api');
vi.mock('store/emails/actions/save-draft-action');
vi.mock('store/editor');

vi.mock('axios');

const createMockEditor = (): Editor =>
	({
		insertContent: vi.fn(),
		setProgressState: vi.fn()
	}) as unknown as Editor;

describe('handleEditorPaste', () => {
	const defaultClipboardEvent = {
		preventDefault: vi.fn(),
		clipboardData: {
			items: [
				{
					type: 'image/png',
					getAsFile: vi.fn(() => new File(['dummy content'], 'test.png', { type: 'image/png' }))
				}
			]
		}
	} as unknown as ClipboardEvent;

	it('should return early if clipboardData is missing', () => {
		const editor = createMockEditor();
		const event = { ...defaultClipboardEvent, clipboardData: null };
		handleEditorPaste(editor, 'editor-1', event);
		expect(event.preventDefault).not.toHaveBeenCalled();
	});

	it('should return early if there are no valid images', () => {
		const editor = createMockEditor();
		const event = {
			...defaultClipboardEvent,
			clipboardData: {
				items: [{ type: 'text/plain', getAsFile: vi.fn(() => null) }],
				getData: vi.fn(() => null)
			}
		} as unknown as ClipboardEvent;
		handleEditorPaste(editor, 'editor-1', event);
		expect(event.preventDefault).not.toHaveBeenCalled();
	});

	it('should return early if pasted data is a image link', () => {
		const editor = createMockEditor();
		const event = {
			...defaultClipboardEvent,
			clipboardData: {
				items: [
					{
						type: 'text/plain',
						getAsFile: vi.fn(() => null)
					}
				],
				getData: vi.fn(() => 'https://example.com/image.png')
			}
		} as unknown as ClipboardEvent;
		handleEditorPaste(editor, 'editor-1', event);
		expect(event.preventDefault).not.toHaveBeenCalled();
	});

	it('should allow default paste behavior for Excel tables (HTML without images)', () => {
		const editor = createMockEditor();
		const excelTableHtml = `<table><tr><td>Cell 1</td><td>Cell 2</td></tr><tr><td>Cell 3</td><td>Cell 4</td></tr></table>`;
		const event = {
			preventDefault: vi.fn(),
			clipboardData: {
				items: [
					{
						type: 'text/plain',
						getAsFile: vi.fn(() => null)
					}
				],
				getData: vi.fn((format: string) => {
					if (format === 'text/html') return excelTableHtml;
					if (format === 'text/plain') return 'Cell 1\tCell 2\nCell 3\tCell 4';
					return '';
				})
			}
		} as unknown as ClipboardEvent;
		handleEditorPaste(editor, 'editor-1', event);
		// Should not prevent default for HTML content without images
		expect(event.preventDefault).not.toHaveBeenCalled();
	});

	it('should skip image upload when table content is present (Excel/Calc paste)', () => {
		const editor = createMockEditor();
		const excelTableHtml = `<table><tr><td>Cell 1</td><td>Cell 2</td></tr><tr><td>Cell 3</td><td>Cell 4</td></tr></table>`;
		const event = {
			preventDefault: vi.fn(),
			clipboardData: {
				items: [
					{
						type: 'image/png',
						getAsFile: vi.fn(() => new File(['dummy'], 'screenshot.png', { type: 'image/png' }))
					}
				],
				getData: vi.fn((format: string) => {
					if (format === 'text/html') return excelTableHtml;
					if (format === 'text/plain') return 'Cell 1\tCell 2\nCell 3\tCell 4';
					return '';
				})
			}
		} as unknown as ClipboardEvent;
		handleEditorPaste(editor, 'editor-1', event);
		// Should not prevent default when table content is present, even with images
		expect(event.preventDefault).not.toHaveBeenCalled();
	});

	describe('uploadImage', () => {
		it('should upload an image and return the correct result', async () => {
			const mockFile = new File(['content'], '1.jpg', { type: 'image/jpeg' });
			const mockAid = '12345';
			const mockContentId = `${mockAid}@carbonio`;
			const mockEditorId = 'test-editor';

			(useEditorsStore.getState as Mock).mockReturnValue({
				setDid: vi.fn(),
				setSize: vi.fn(),
				removeUnsavedAttachments: vi.fn(),
				setSavedAttachments: vi.fn()
			});

			(saveDraftEmailStoreAction as Mock).mockResolvedValue({
				m: [
					{
						id: 'msg123',
						s: 1024,
						mp: [
							{
								part: '2.1',
								ct: 'text/html',
								s: 632,
								body: true,
								content: '<html xmlns="http://www.w3.org/1999/html"></body></body></html>'
							},
							{
								part: '2.2',
								ct: 'image/jpeg',
								s: 81571,
								cd: 'inline',
								filename: mockFile.name,
								ci: mockContentId
							}
						]
					}
				]
			});

			(uploadFileApi as Mock).mockResolvedValue({ aid: mockAid });
			(getEditor as Mock).mockReturnValueOnce({ unsavedAttachments: [] }).mockReturnValueOnce({
				savedAttachments: [
					{
						messageId: 'msg123',
						isInline: true,
						contentId: mockContentId,
						filename: mockFile.name,
						partName: '2.2',
						contentType: 'image/jpeg',
						size: 190
					}
				]
			});

			const result = await testingPurposeOnly.uploadImage(mockFile, mockEditorId);

			expect(result.contentId).toBe(mockContentId);
			expect(result.fileName).toBe(mockFile.name);
			expect(result.downloadServiceUrl).toBeDefined();
			expect(result.cidUrl).toBeDefined();
		});
	});
});
