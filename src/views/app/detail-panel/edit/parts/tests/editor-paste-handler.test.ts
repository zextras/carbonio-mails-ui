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

jest.mock('../../../../../../api/upload-file-api');
jest.mock('../../../../../../store/emails/actions/save-draft-action');
jest.mock('../../../../../../store/editor');

jest.mock('axios');

const createMockEditor = (): Editor =>
	({
		insertContent: jest.fn(),
		setProgressState: jest.fn()
	}) as unknown as Editor;

describe('handleEditorPaste', () => {
	const defaultClipboardEvent = {
		preventDefault: jest.fn(),
		clipboardData: {
			items: [
				{
					type: 'image/png',
					getAsFile: jest.fn(() => new File(['dummy content'], 'test.png', { type: 'image/png' }))
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
				items: [{ type: 'text/plain', getAsFile: jest.fn(() => null) }],
				getData: jest.fn(() => null)
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
						getAsFile: jest.fn(() => null)
					}
				],
				getData: jest.fn(() => 'http://example.com/image.png')
			}
		} as unknown as ClipboardEvent;
		handleEditorPaste(editor, 'editor-1', event);
		expect(event.preventDefault).not.toHaveBeenCalled();
	});

	describe('uploadImage', () => {
		it('should upload an image and return the correct result', async () => {
			const mockFile = new File(['content'], '1.jpg', { type: 'image/jpeg' });
			const mockAid = '12345';
			const mockContentId = `${mockAid}@carbonio`;
			const mockEditorId = 'test-editor';

			(useEditorsStore.getState as jest.Mock).mockReturnValue({
				setDid: jest.fn(),
				setSize: jest.fn(),
				removeUnsavedAttachments: jest.fn(),
				setSavedAttachments: jest.fn()
			});

			(saveDraftEmailStoreAction as jest.Mock).mockResolvedValue({
				m: [
					{
						id: 'msg123',
						s: 1024,
						mp: [
							{
								part: '2.1',
								ct: 'text/html',
								s: 632,
								requiresSmartLinkConversion: false,
								body: true,
								content: '<html xmlns="http://www.w3.org/1999/html"></body></body></html>'
							},
							{
								part: '2.2',
								ct: 'image/jpeg',
								s: 81571,
								cd: 'inline',
								filename: mockFile.name,
								ci: mockContentId,
								requiresSmartLinkConversion: false
							}
						]
					}
				]
			});

			(uploadFileApi as jest.Mock).mockResolvedValue({ aid: mockAid });
			(getEditor as jest.Mock).mockReturnValueOnce({ unsavedAttachments: [] }).mockReturnValueOnce({
				savedAttachments: [
					{
						messageId: 'msg123',
						isInline: true,
						contentId: mockContentId,
						filename: mockFile.name,
						partName: '2.2',
						contentType: 'image/jpeg',
						size: 190,
						requiresSmartLinkConversion: false
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
