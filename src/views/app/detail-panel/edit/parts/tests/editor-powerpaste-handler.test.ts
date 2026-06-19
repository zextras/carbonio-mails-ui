/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable sonarjs/no-duplicate-string */

import { type Editor } from 'tinymce';
import type { Mock } from 'vitest';

import { uploadFileApi } from 'api/upload-file-api';
import { getEditor, useEditorsStore } from 'store/editor/index';
import { saveDraftEmailStoreAction } from 'store/emails/actions/save-draft-action';
import {
	testingPurposeOnly,
	handleEditorPowerPaste
} from 'views/app/detail-panel/edit/parts/editor-powerpaste-handler';

vi.mock('api/upload-file-api');
vi.mock('store/emails/actions/save-draft-action');
vi.mock('store/editor');

const createMockEditor = (): Editor =>
	({
		insertContent: vi.fn(),
		setProgressState: vi.fn(),
		parser: {
			parse: vi.fn((html: string) => ({ html }))
		},
		serializer: {
			serialize: vi.fn((_node: unknown) => {
				// Return the html that was passed to parser.parse()
				return (_node as { html: string }).html;
			})
		}
	}) as unknown as Editor;

// A minimal 1×1 red PNG as a data URL used by several tests.
const TINY_PNG_DATA_URL =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==';

// ---- shared mock helpers ----

function setupUploadMocks(mockAid: string, mockContentId: string, mockFile: File): void {
	(uploadFileApi as Mock).mockResolvedValue({ aid: mockAid });

	(getEditor as Mock)
		.mockReturnValueOnce({ unsavedAttachments: [] })
		.mockReturnValueOnce({
			savedAttachments: [
				{
					messageId: 'msg123',
					isInline: true,
					contentId: mockContentId,
					filename: mockFile.name,
					partName: '2.2',
					contentType: mockFile.type,
					size: mockFile.size
				}
			]
		});

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
						s: 100,
						body: true,
						content: '<html></html>'
					},
					{
						part: '2.2',
						ct: mockFile.type,
						s: mockFile.size,
						cd: 'inline',
						filename: mockFile.name,
						ci: mockContentId
					}
				]
			}
		]
	});
}

// ---- handleEditorPowerPaste ----

describe('handleEditorPowerPaste', () => {
	it('should return early if clipboardData is missing', async () => {
		const editor = createMockEditor();
		const event = {
			preventDefault: vi.fn(),
			clipboardData: null
		} as unknown as ClipboardEvent;
		await handleEditorPowerPaste(editor, 'editor-1', event);
		expect(event.preventDefault).not.toHaveBeenCalled();
	});

	it('should return early if there are no valid images and no local HTML images', async () => {
		const editor = createMockEditor();
		const event = {
			preventDefault: vi.fn(),
			clipboardData: {
				items: [{ type: 'text/plain', getAsFile: vi.fn(() => null) }],
				getData: vi.fn(() => '')
			}
		} as unknown as ClipboardEvent;
		await handleEditorPowerPaste(editor, 'editor-1', event);
		expect(event.preventDefault).not.toHaveBeenCalled();
	});

	it('should return early if pasted text is an image URL', async () => {
		const editor = createMockEditor();
		const event = {
			preventDefault: vi.fn(),
			clipboardData: {
				items: [{ type: 'text/plain', getAsFile: vi.fn(() => null) }],
				getData: vi.fn((format: string) => {
					if (format === 'text/plain') return 'https://example.com/photo.png';
					return '';
				})
			}
		} as unknown as ClipboardEvent;
		await handleEditorPowerPaste(editor, 'editor-1', event);
		expect(event.preventDefault).not.toHaveBeenCalled();
	});

	it('should return early for Excel table content even when clipboard has an image', async () => {
		const editor = createMockEditor();
		const excelHtml = `<table><tr><td>A</td></tr></table>`;
		const event = {
			preventDefault: vi.fn(),
			clipboardData: {
				items: [
					{
						type: 'image/png',
						getAsFile: vi.fn(() => new File(['x'], 'shot.png', { type: 'image/png' }))
					}
				],
				getData: vi.fn((format: string) => (format === 'text/html' ? excelHtml : ''))
			}
		} as unknown as ClipboardEvent;
		await handleEditorPowerPaste(editor, 'editor-1', event);
		expect(event.preventDefault).not.toHaveBeenCalled();
	});

	it('should return early if HTML contains external images', async () => {
		const editor = createMockEditor();
		const htmlWithExternal = `<p>text</p><img src="https://external.example.com/image.png"/>`;
		const event = {
			preventDefault: vi.fn(),
			clipboardData: {
				items: [],
				getData: vi.fn((format: string) =>
					format === 'text/html' ? htmlWithExternal : ''
				)
			}
		} as unknown as ClipboardEvent;
		await handleEditorPowerPaste(editor, 'editor-1', event);
		expect(event.preventDefault).not.toHaveBeenCalled();
	});

	it('should process mixed HTML content (text + data: image) and insert reconstructed HTML', async () => {
		const mockAid = 'aid-mixed';
		const mockFile = new File(['x'], 'pasted-image-0.png', { type: 'image/png' });
		const mockContentId = `${mockAid}@carbonio`;
		setupUploadMocks(mockAid, mockContentId, mockFile);

		const fakeBlob = new Blob(['img'], { type: 'image/png' });
		global.fetch = vi.fn(() =>
			Promise.resolve({ blob: () => Promise.resolve(fakeBlob) })
		) as Mock;
		global.URL.createObjectURL = vi.fn(() => 'blob://fake-object-url');

		const htmlWithDataImage = `<p>Before</p><img src="${TINY_PNG_DATA_URL}"/><p>After</p>`;
		const editor = createMockEditor();
		const event = {
			preventDefault: vi.fn(),
			stopPropagation: vi.fn(),
			stopImmediatePropagation: vi.fn(),
			clipboardData: {
				items: [],
				getData: vi.fn((format: string) =>
					format === 'text/html' ? htmlWithDataImage : ''
				)
			}
		} as unknown as ClipboardEvent;

		await handleEditorPowerPaste(editor, 'editor-1', event);

		expect(event.preventDefault).toHaveBeenCalled();
		expect(editor.insertContent).toHaveBeenCalledTimes(1);

		const insertedHtml: string = (editor.insertContent as Mock).mock.calls[0][0];
		// Text segments must be present.
		expect(insertedHtml).toContain('Before');
		expect(insertedHtml).toContain('After');
		// Image must have been replaced with CID attributes.
		expect(insertedHtml).toContain(`data-pnsrc="cid:${mockContentId}"`);
		expect(insertedHtml).toContain(`data-mce-src="cid:${mockContentId}"`);
		// Original data: URL must have been replaced.
		expect(insertedHtml).not.toContain('data:image/png');
	});

	it('should fall back to clipboard-item upload when HTML has no local images', async () => {
		const mockAid = 'aid-fallback';
		const mockFile = new File(['content'], 'screenshot.jpg', { type: 'image/jpeg' });
		const mockContentId = `${mockAid}@carbonio`;
		setupUploadMocks(mockAid, mockContentId, mockFile);

		const fakeBlob = new Blob(['img'], { type: 'image/jpeg' });
		global.fetch = vi.fn(() =>
			Promise.resolve({ blob: () => Promise.resolve(fakeBlob) })
		) as Mock;
		global.URL.createObjectURL = vi.fn(() => 'blob://screenshot-url');

		const editor = createMockEditor();
		const event = {
			preventDefault: vi.fn(),
			stopPropagation: vi.fn(),
			stopImmediatePropagation: vi.fn(),
			clipboardData: {
				items: [
					{
						type: 'image/jpeg',
						getAsFile: vi.fn(() => mockFile)
					}
				],
				getData: vi.fn(() => '')
			}
		} as unknown as ClipboardEvent;

		await handleEditorPowerPaste(editor, 'editor-1', event);

		expect(event.preventDefault).toHaveBeenCalled();
		expect(editor.insertContent).toHaveBeenCalledTimes(1);
		const insertedHtml: string = (editor.insertContent as Mock).mock.calls[0][0];
		expect(insertedHtml).toContain(`data-pnsrc="cid:${mockContentId}"`);
	});
});

// ---- srcToFile ----

describe('srcToFile', () => {
	it('converts a data: URL to a File', async () => {
		const file = await testingPurposeOnly.srcToFile(TINY_PNG_DATA_URL, 0);
		expect(file).not.toBeNull();
		expect(file?.type).toBe('image/png');
		expect(file?.name).toBe('pasted-image-0.png');
	});

	it('returns null for an unsupported scheme', async () => {
		const file = await testingPurposeOnly.srcToFile('ftp://example.com/img.png', 0);
		expect(file).toBeNull();
	});

	it('handles blob: URLs via fetch', async () => {
		const fakeBlob = new Blob(['data'], { type: 'image/webp' });
		global.fetch = vi.fn(() =>
			Promise.resolve({ blob: () => Promise.resolve(fakeBlob) })
		) as Mock;
		const file = await testingPurposeOnly.srcToFile('blob://some-blob-url', 1);
		expect(file?.type).toBe('image/webp');
		expect(file?.name).toBe('pasted-image-1.webp');
	});

	it('returns null when blob: fetch fails', async () => {
		global.fetch = vi.fn(() => Promise.reject(new Error('network error'))) as Mock;
		const file = await testingPurposeOnly.srcToFile('blob://broken', 2);
		expect(file).toBeNull();
	});
});

// ---- uploadImage (same contract as editor-paste-handler) ----

describe('uploadImage', () => {
	const mockFile = new File(['content'], '1.jpg', { type: 'image/jpeg' });
	const mockAid = '12345';
	const mockContentId = `${mockAid}@carbonio`;
	const mockEditorId = 'test-editor';

	it('should upload an image and return the correct result', async () => {
		setupUploadMocks(mockAid, mockContentId, mockFile);

		const result = await testingPurposeOnly.uploadImage(mockFile, mockEditorId);

		expect(result.contentId).toBe(mockContentId);
		expect(result.fileName).toBe(mockFile.name);
		expect(result.downloadServiceUrl).toBeDefined();
		expect(result.cidUrl).toBeDefined();
	});
});
