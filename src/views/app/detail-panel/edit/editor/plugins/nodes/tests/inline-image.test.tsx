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

		await user.click(await screen.findByRole('button', { name: 'label.image_align' }));
		await user.click(await screen.findByText('label.align_center'));

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
});
