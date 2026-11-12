/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { fireEvent, waitFor } from '@testing-library/react';

import { setupTest, screen, within } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';
import { DROP_CARET_TEST_ID } from 'views/app/detail-panel/edit/editor/plugins/image-drag-drop';

const EDITOR_TEST_ID = 'edit-view-editor';

const IMAGE_HTML =
	'<p><img src="https://example.com/inline.png" alt="pic" data-pnsrc="cid:abc@carbonio" /></p>';

function richTextOf(editorId: string): string {
	return useEditorsStore.getState().editors[editorId]?.text.richText ?? '';
}

function setupEditorWithHtml(richText: string): {
	editorId: string;
	user: ReturnType<typeof setupTest>['user'];
} {
	const editor = generateNewMessageEditor();
	editor.text = { plainText: 'pic', richText };
	setupEditorStore({ editors: [editor] });
	const { user } = setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);
	return { editorId: editor.id, user };
}

async function findEditorImage(): Promise<HTMLImageElement> {
	const editorElement = screen.getByTestId(EDITOR_TEST_ID);
	return (await within(editorElement).findByRole('img')) as HTMLImageElement;
}

/**
 * Minimal DataTransfer (not implemented by jsdom), shared by the events of a
 * single drag operation. As in the browsers, its data can be read only on drop:
 * during the dragover (protected mode) only the types are exposed.
 */
function createDataTransfer(): {
	dataTransfer: DataTransfer;
	setProtected: (value: boolean) => void;
} {
	const data = new Map<string, string>();
	let isProtected = false;
	const dataTransfer = {
		get types(): string[] {
			return Array.from(data.keys());
		},
		setData: (type: string, value: string): void => {
			data.set(type, value);
		},
		getData: (type: string): string => (isProtected ? '' : (data.get(type) ?? '')),
		effectAllowed: 'uninitialized',
		dropEffect: 'none',
		files: [] as unknown as FileList
	} as unknown as DataTransfer;
	return {
		dataTransfer,
		setProtected: (value: boolean): void => {
			isProtected = value;
		}
	};
}

/**
 * jsdom has no layout, so the DOM position under the pointer at drop time is
 * provided through a mocked `document.caretRangeFromPoint`.
 */
function mockDropPosition(node: Node, offset: number): void {
	const range = document.createRange();
	range.setStart(node, offset);
	range.collapse(true);
	document.caretRangeFromPoint = vi.fn((): Range => range);
}

/* eslint-disable testing-library/prefer-user-event -- user-event does not support native drag and drop */
/**
 * Drags `source` and drops it on `target`. Returns whether the editor allowed
 * the drop (by cancelling the dragover) and whether it drew the drop caret
 * while dragging.
 */
function dragAndDrop(
	source: Element,
	target: Element
): { dropAllowed: boolean; dropCaretShown: boolean } {
	const { dataTransfer, setProtected } = createDataTransfer();
	fireEvent.dragStart(source, { dataTransfer });
	setProtected(true);
	const dropAllowed = !fireEvent.dragOver(target, { dataTransfer });
	const dropCaretShown = screen.queryByTestId(DROP_CARET_TEST_ID) !== null;
	setProtected(false);
	fireEvent.drop(target, { dataTransfer });
	fireEvent.dragEnd(source, { dataTransfer });
	return { dropAllowed, dropCaretShown };
}
/* eslint-enable testing-library/prefer-user-event */

describe('Inline image editing', () => {
	afterEach(() => {
		// @ts-expect-error -- removing the mock installed by mockDropPosition
		delete document.caretRangeFromPoint;
	});

	it('renders an inline image from existing draft HTML', async () => {
		setupEditorWithHtml(IMAGE_HTML);

		const image = await findEditorImage();

		expect(image).toHaveAttribute('src', 'https://example.com/inline.png');
	});

	it('shows resize handles when the image is selected', async () => {
		const { user } = setupEditorWithHtml(IMAGE_HTML);

		const image = await findEditorImage();
		await user.click(image);

		expect(await screen.findByTestId('image-resizer-se')).toBeInTheDocument();
		expect(screen.getByTestId('image-resizer-e')).toBeInTheDocument();
	});

	it('persists the new size after dragging a resize handle', async () => {
		const { editorId, user } = setupEditorWithHtml(IMAGE_HTML);

		const image = await findEditorImage();
		await user.click(image);

		const handle = await screen.findByTestId('image-resizer-se');
		/* eslint-disable testing-library/prefer-user-event -- simulating a pointer drag with explicit coordinates */
		fireEvent.mouseDown(handle, { clientX: 0, clientY: 0 });
		fireEvent.mouseMove(document, { clientX: 120, clientY: 80 });
		fireEvent.mouseUp(document, { clientX: 120, clientY: 80 });
		/* eslint-enable testing-library/prefer-user-event */

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('width: 120px');
		});
		expect(richTextOf(editorId)).toContain('height: 80px');
	});

	it('aligns the selected image from the toolbar control', async () => {
		const { editorId, user } = setupEditorWithHtml(IMAGE_HTML);

		const image = await findEditorImage();
		await user.click(image);

		await user.click(await screen.findByRole('button', { name: 'lexical-label.image_align' }));
		await user.click(await screen.findByText('lexical-label.align_center'));

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('margin-left: auto');
		});
		expect(richTextOf(editorId)).toContain('display: block');
	});

	it('removes the image when Delete is pressed while selected', async () => {
		const { editorId, user } = setupEditorWithHtml(IMAGE_HTML);

		const image = await findEditorImage();
		await user.click(image);

		await user.keyboard('{Delete}');

		const editorElement = screen.getByTestId(EDITOR_TEST_ID);
		await waitFor(() => {
			expect(within(editorElement).queryByRole('img')).not.toBeInTheDocument();
		});
		expect(richTextOf(editorId)).not.toContain('https://example.com/inline.png');
	});

	it('round-trips width, alignment and the cid reference from draft HTML', async () => {
		const { editorId } = setupEditorWithHtml(
			'<p><img src="https://example.com/inline.png" alt="pic" data-pnsrc="cid:abc@carbonio" ' +
				'style="width: 200px; float: left;" /></p>'
		);

		const image = await findEditorImage();
		expect(image).toHaveStyle({ width: '200px' });

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('width: 200px');
		});
		const richText = richTextOf(editorId);
		expect(richText).toContain('float: left');
		expect(richText).toContain('data-pnsrc="cid:abc@carbonio"');
	});

	it('moves the image to the drop position when dragged into another paragraph', async () => {
		const { editorId } = setupEditorWithHtml(
			'<p>first<img src="https://example.com/inline.png" alt="pic" data-pnsrc="cid:abc@carbonio" ' +
				'style="width: 200px; float: left;" /></p><p>second paragraph</p>'
		);

		const image = await findEditorImage();
		const editorElement = screen.getByTestId(EDITOR_TEST_ID);
		const targetText = within(editorElement).getByText('second paragraph');
		const targetTextNode = document.createTreeWalker(targetText, NodeFilter.SHOW_TEXT).nextNode();
		if (targetTextNode === null) {
			throw new Error('missing drop target text node');
		}
		mockDropPosition(targetTextNode, 'second'.length);

		const { dropAllowed, dropCaretShown } = dragAndDrop(image, targetText);

		expect(dropAllowed).toBe(true);
		expect(dropCaretShown).toBe(true);
		expect(screen.queryByTestId(DROP_CARET_TEST_ID)).not.toBeInTheDocument();

		await waitFor(() => {
			expect(richTextOf(editorId)).toMatch(/second<\/span><img [^>]*><span[^>]*> paragraph/);
		});
		const richText = richTextOf(editorId);
		expect(richText.match(/<img /g)).toHaveLength(1);
		expect(richText).toMatch(/<p[^>]*><span[^>]*>first<\/span><\/p>/);
		expect(richText).toContain('src="https://example.com/inline.png"');
		expect(richText).toContain('alt="pic"');
		expect(richText).toContain('data-pnsrc="cid:abc@carbonio"');
		expect(richText).toContain('data-mce-src="cid:abc@carbonio"');
		expect(richText).toContain('width: 200px');
		expect(richText).toContain('float: left');
		expect(within(editorElement).getAllByRole('img')).toHaveLength(1);
	});

	it('leaves the content unchanged when the image is dropped on itself', async () => {
		const { editorId } = setupEditorWithHtml(
			'<p>first<img src="https://example.com/inline.png" alt="pic" data-pnsrc="cid:abc@carbonio" />' +
				'</p><p>second paragraph</p>'
		);

		const image = await findEditorImage();
		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('second paragraph');
		});
		const initialRichText = richTextOf(editorId);
		mockDropPosition(image, 0);

		const { dropCaretShown } = dragAndDrop(image, image);

		expect(dropCaretShown).toBe(false);
		expect(richTextOf(editorId)).toBe(initialRichText);
		expect(screen.getByRole('img')).toBe(image);
	});
});
