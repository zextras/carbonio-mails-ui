/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { type Editor } from 'tinymce';

import { handleEditorPaste } from '../editor-paste-handler';

const createMockEditor = (): Editor =>
	({
		insertContent: jest.fn(),
		setProgressState: jest.fn()
	}) as unknown as Editor;

jest.mock('axios');

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
});
