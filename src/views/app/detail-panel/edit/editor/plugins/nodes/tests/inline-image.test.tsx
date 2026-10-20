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
	const editorElement = screen.getByTestId('edit-view-editor');
	return (await within(editorElement).findByRole('img')) as HTMLImageElement;
}

describe('Inline image editing', () => {
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

	it('highlights the edit image toolbar button only while the image is selected', async () => {
		const { user } = setupEditorWithHtml(IMAGE_HTML);

		expect(screen.getByRole('button', { name: 'lexical-label.insert_image_url' })).toHaveAttribute(
			'aria-pressed',
			'false'
		);

		await user.click(await findEditorImage());

		expect(await screen.findByRole('button', { name: 'lexical-label.edit_image' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
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

	it.each([
		{ handle: 'se', drag: { clientX: 100, clientY: 10 }, width: 300, height: 150 },
		{ handle: 'e', drag: { clientX: 100, clientY: 70 }, width: 300, height: 150 },
		{ handle: 's', drag: { clientX: 70, clientY: 50 }, width: 300, height: 150 },
		{ handle: 'nw', drag: { clientX: -100, clientY: -5 }, width: 300, height: 150 }
	])(
		'keeps the original aspect ratio when dragging the $handle handle',
		async ({ handle, drag, width, height }) => {
			// 200x100 image (2:1), rendered at its natural size
			vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(200);
			vi.spyOn(HTMLImageElement.prototype, 'naturalHeight', 'get').mockReturnValue(100);
			vi.spyOn(HTMLImageElement.prototype, 'getBoundingClientRect').mockReturnValue({
				width: 200,
				height: 100
			} as DOMRect);
			const { editorId, user } = setupEditorWithHtml(IMAGE_HTML);

			await user.click(await findEditorImage());

			const resizer = await screen.findByTestId(`image-resizer-${handle}`);
			/* eslint-disable testing-library/prefer-user-event -- simulating a pointer drag with explicit coordinates */
			fireEvent.mouseDown(resizer, { clientX: 0, clientY: 0 });
			fireEvent.mouseMove(document, drag);
			fireEvent.mouseUp(document, drag);
			/* eslint-enable testing-library/prefer-user-event */

			await waitFor(() => {
				expect(richTextOf(editorId)).toContain(`width: ${width}px`);
			});
			expect(richTextOf(editorId)).toContain(`height: ${height}px`);
		}
	);

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

		const editorElement = screen.getByTestId('edit-view-editor');
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
			`${IMAGE_HTML}<p>first target text</p><p>second target text</p>`
		);
		const image = await findEditorImage();
		const editorElement = screen.getByTestId('edit-view-editor');
		const dropTarget = within(editorElement).getByText('second target text');
		// eslint-disable-next-line testing-library/no-node-access -- the drop point must be a DOM text node
		const secondParagraphText = dropTarget.firstChild as Text;

		const store: Record<string, string> = {};
		const dataTransfer = {
			setData: (type: string, value: string): void => {
				store[type] = value;
			},
			getData: (type: string): string => store[type] ?? '',
			get types(): string[] {
				return Object.keys(store);
			},
			effectAllowed: 'all'
		};
		const caretRange = document.createRange();
		caretRange.setStart(secondParagraphText, 'second '.length);
		document.caretRangeFromPoint = vi.fn().mockReturnValue(caretRange);

		fireEvent.dragStart(image, { dataTransfer });
		fireEvent.dragOver(dropTarget, { dataTransfer });
		fireEvent.drop(dropTarget, {
			dataTransfer,
			clientX: 1,
			clientY: 1
		});

		await waitFor(() => {
			expect(richTextOf(editorId)).toMatch(
				/second <\/span><img[^>]*data-pnsrc="cid:abc@carbonio"[^>]*><span[^>]*>target text/
			);
		});
		expect(richTextOf(editorId).match(/<img/g)).toHaveLength(1);
		expect(within(editorElement).getAllByRole('img')).toHaveLength(1);
	});
});
