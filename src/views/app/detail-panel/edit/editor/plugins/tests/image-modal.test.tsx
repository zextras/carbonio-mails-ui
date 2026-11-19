/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { waitFor } from '@testing-library/react';

import { setupTest, screen, within } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

const IMAGE_URL = 'https://example.com/picture.png';
const IMAGE_HTML =
	'<p><img src="https://example.com/inline.png" alt="pic" data-pnsrc="cid:abc@carbonio" /></p>';
const EDITOR_TESTID = 'edit-view-editor';
const INSERT_IMAGE_LABEL = 'lexical-label.insert_image_url';
const EDIT_IMAGE_LABEL = 'lexical-label.edit_image';
const SOURCE_LABEL = 'lexical-label.image_source';
const ALT_LABEL = 'lexical-label.image_alt';
const WIDTH_LABEL = 'lexical-label.width';
const HEIGHT_LABEL = 'lexical-label.height';
const SAVE_LABEL = 'label.save';
const MODAL_TITLE = 'lexical-label.insert_edit_image';

type TestUser = ReturnType<typeof setupTest>['user'];

function richTextOf(editorId: string): string {
	return useEditorsStore.getState().editors[editorId]?.text.richText ?? '';
}

function imageTagOf(editorId: string): string {
	return /<img [^>]*>/.exec(richTextOf(editorId))?.[0] ?? '';
}

/** Makes the images report a natural size as soon as their source is set. */
function stubImageNaturalSize(naturalWidth: number, naturalHeight: number): void {
	class MockImage {
		onload: (() => void) | null = null;

		naturalWidth = naturalWidth;

		naturalHeight = naturalHeight;

		set src(_value: string) {
			this.onload?.();
		}
	}
	vi.stubGlobal('Image', MockImage);
}

/**
 * Finds the editor image and, since jsdom has no layout, gives it the size the
 * browser renders it with.
 */
async function findEditorImageSized(width: number, height: number): Promise<HTMLImageElement> {
	const image = (await within(screen.getByTestId(EDITOR_TESTID)).findByRole(
		'img'
	)) as HTMLImageElement;
	Object.defineProperty(image, 'clientWidth', { configurable: true, value: width });
	Object.defineProperty(image, 'clientHeight', { configurable: true, value: height });
	return image;
}

function setupEditor(richText: string): { editorId: string; user: TestUser } {
	const editor = generateNewMessageEditor();
	editor.text = { plainText: 'pic', richText };
	setupEditorStore({ editors: [editor] });
	const { user } = setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);
	return { editorId: editor.id, user };
}

describe('ImageModal', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('inserts an inline image from the values entered in the modal', async () => {
		const { editorId, user } = setupEditor('<p></p>');

		await user.click(screen.getByTestId(EDITOR_TESTID));
		await user.click(screen.getByRole('button', { name: INSERT_IMAGE_LABEL }));

		expect(await screen.findByText(MODAL_TITLE)).toBeInTheDocument();
		await user.pasteInto(screen.getByRole('textbox', { name: SOURCE_LABEL }), IMAGE_URL);
		await user.pasteInto(screen.getByRole('textbox', { name: ALT_LABEL }), 'a picture');
		await user.click(screen.getByRole('button', { name: SAVE_LABEL }));

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain(`src="${IMAGE_URL}"`);
		});
		expect(richTextOf(editorId)).toContain('alt="a picture"');
	});

	it('keeps the save action disabled until a source is provided', async () => {
		const { user } = setupEditor('<p></p>');

		await user.click(screen.getByRole('button', { name: INSERT_IMAGE_LABEL }));

		expect(await screen.findByText(MODAL_TITLE)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: SAVE_LABEL })).toBeDisabled();

		await user.pasteInto(screen.getByRole('textbox', { name: SOURCE_LABEL }), IMAGE_URL);

		expect(screen.getByRole('button', { name: SAVE_LABEL })).toBeEnabled();
	});

	it('edits a selected image in place when double-clicked', async () => {
		const { editorId, user } = setupEditor(IMAGE_HTML);

		const editorElement = screen.getByTestId(EDITOR_TESTID);
		const image = (await within(editorElement).findByRole('img')) as HTMLImageElement;
		await user.dblClick(image);

		expect(await screen.findByText(MODAL_TITLE)).toBeInTheDocument();
		expect(screen.getByRole('textbox', { name: SOURCE_LABEL })).toHaveValue(
			'https://example.com/inline.png'
		);
		expect(screen.getByRole('textbox', { name: ALT_LABEL })).toHaveValue('pic');

		const altInput = screen.getByRole('textbox', { name: ALT_LABEL });
		await user.clear(altInput);
		await user.paste('updated alt');
		await user.click(screen.getByRole('button', { name: SAVE_LABEL }));

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('alt="updated alt"');
		});
	});

	it('opens from the toolbar to edit the selected image, pre-filled with its rendered size', async () => {
		const { user } = setupEditor(IMAGE_HTML);
		const image = await findEditorImageSized(320, 160);

		await user.click(image);
		await user.click(await screen.findByRole('button', { name: EDIT_IMAGE_LABEL }));

		expect(await screen.findByText(MODAL_TITLE)).toBeInTheDocument();
		expect(screen.getByRole('textbox', { name: SOURCE_LABEL })).toHaveValue(
			'https://example.com/inline.png'
		);
		expect(screen.getByRole('textbox', { name: ALT_LABEL })).toHaveValue('pic');
		expect(screen.getByRole('spinbutton', { name: WIDTH_LABEL })).toHaveValue(320);
		expect(screen.getByRole('spinbutton', { name: HEIGHT_LABEL })).toHaveValue(160);
	});

	it('keeps the size of an image without explicit size when only its other properties change', async () => {
		const { editorId, user } = setupEditor(IMAGE_HTML);
		const image = await findEditorImageSized(320, 160);

		await user.dblClick(image);
		const altInput = await screen.findByRole('textbox', { name: ALT_LABEL });
		await user.clear(altInput);
		await user.paste('updated alt');
		await user.click(screen.getByRole('button', { name: SAVE_LABEL }));

		await waitFor(() => {
			expect(imageTagOf(editorId)).toContain('alt="updated alt"');
		});
		expect(imageTagOf(editorId)).not.toMatch(/width|height/);
	});

	it('saves the size entered for an image without explicit size, keeping its natural ratio', async () => {
		stubImageNaturalSize(400, 200);
		const { editorId, user } = setupEditor(IMAGE_HTML);
		const image = await findEditorImageSized(320, 160);

		await user.dblClick(image);
		const widthInput = await screen.findByRole('spinbutton', { name: WIDTH_LABEL });
		await user.clear(widthInput);
		await user.paste('100');

		expect(screen.getByRole('spinbutton', { name: HEIGHT_LABEL })).toHaveValue(50);

		await user.click(screen.getByRole('button', { name: SAVE_LABEL }));

		await waitFor(() => {
			expect(imageTagOf(editorId)).toContain('width: 100px');
		});
		expect(imageTagOf(editorId)).toContain('height: 50px');
	});

	it('keeps the height proportional to the width while the aspect ratio is locked', async () => {
		// Make the loaded image report a fixed 2:1 natural ratio synchronously.
		stubImageNaturalSize(400, 200);

		const { user } = setupEditor('<p></p>');

		await user.click(screen.getByRole('button', { name: INSERT_IMAGE_LABEL }));
		expect(await screen.findByText(MODAL_TITLE)).toBeInTheDocument();
		await user.pasteInto(screen.getByRole('textbox', { name: SOURCE_LABEL }), IMAGE_URL);

		// The natural size pre-fills both dimensions once the source loads.
		const widthInput = screen.getByRole('spinbutton', { name: WIDTH_LABEL });
		await waitFor(() => expect(widthInput).toHaveValue(400));
		expect(screen.getByRole('spinbutton', { name: HEIGHT_LABEL })).toHaveValue(200);

		// Editing the width keeps the height proportional (400/200 = 2 -> 100/50).
		await user.clear(widthInput);
		await user.paste('100');

		expect(screen.getByRole('spinbutton', { name: HEIGHT_LABEL })).toHaveValue(50);
	});
});
