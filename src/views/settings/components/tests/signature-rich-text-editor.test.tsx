/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable max-classes-per-file -- two minimal Event stubs cover a jsdom gap (see below) */
import React from 'react';

import { fireEvent, waitFor } from '@testing-library/react';

import { setupTest, screen, within } from '@test-setup';
import { INLINE_IMAGE_FILE_INPUT_TESTID } from 'views/app/detail-panel/edit/editor/plugins/rich-toolbar-plugin';
import { SignatureRichTextEditor } from 'views/settings/components/signature-rich-text-editor';

const CONTENT_TESTID = 'signature-editor-content-editable';
const IMAGE_LABEL = 'lexical-label.image';
const IMAGE_FROM_URL_LABEL = 'lexical-label.insert_image_url';

/** A 1x1 transparent PNG, small enough to keep the expected data URI readable. */
const PNG_BASE64 =
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==';
const PNG_DATA_URI = `data:image/png;base64,${PNG_BASE64}`;

// jsdom (20) implements neither DragEvent nor ClipboardEvent, yet Lexical's
// default paste handler does `instanceof` checks against both. Two distinct
// no-op Event subclasses stand in so the checks resolve (rather than throwing a
// ReferenceError) and the synthetic paste event is classified as a clipboard
// paste, not a drag.
class StubDragEvent extends Event {}
class StubClipboardEvent extends Event {}

function pngFile(name = 'logo.png'): File {
	const bytes = Uint8Array.from(atob(PNG_BASE64), (char) => char.charCodeAt(0));
	return new File([bytes], name, { type: 'image/png' });
}

type TestUser = ReturnType<typeof setupTest>['user'];

function renderSignatureEditor(value = '<p>signature</p>'): {
	onChange: ReturnType<typeof vi.fn>;
	user: TestUser;
} {
	const onChange = vi.fn();
	const { user } = setupTest(<SignatureRichTextEditor value={value} onChange={onChange} />);
	return { onChange, user };
}

/** Picks files through the hidden input behind the toolbar's image button. */
function selectFiles(user: TestUser, files: Array<File>): Promise<void> {
	return user.upload(screen.getByTestId(INLINE_IMAGE_FILE_INPUT_TESTID), files);
}

/**
 * Dispatches a synthetic paste event with a hand-built clipboard payload, since
 * jsdom cannot represent files on a real `DataTransfer` / `userEvent.paste`.
 */
function pasteFileInto(target: HTMLElement, file: File): void {
	// eslint-disable-next-line testing-library/prefer-user-event
	fireEvent.paste(target, {
		clipboardData: {
			items: [{ kind: 'file', type: file.type, getAsFile: (): File => file }],
			files: [],
			getData: (): string => '',
			types: []
		}
	});
}

describe('SignatureRichTextEditor', () => {
	const globalScope = globalThis as Record<string, unknown>;
	const originalDragEvent = globalScope.DragEvent;
	const originalClipboardEvent = globalScope.ClipboardEvent;

	beforeAll(() => {
		globalScope.DragEvent = originalDragEvent ?? StubDragEvent;
		globalScope.ClipboardEvent = originalClipboardEvent ?? StubClipboardEvent;
	});

	afterAll(() => {
		globalScope.DragEvent = originalDragEvent;
		globalScope.ClipboardEvent = originalClipboardEvent;
	});

	it('offers both the insert-image-from-device and the insert-image-from-URL buttons', () => {
		renderSignatureEditor();

		expect(screen.getByRole('button', { name: IMAGE_LABEL })).toBeVisible();
		expect(screen.getByRole('button', { name: IMAGE_FROM_URL_LABEL })).toBeVisible();
	});

	it('embeds an image picked from the device as a data URI', async () => {
		const { user } = renderSignatureEditor();

		await selectFiles(user, [pngFile()]);

		const image = await within(screen.getByTestId(CONTENT_TESTID)).findByRole('img');
		expect(image).toHaveAttribute('src', PNG_DATA_URI);
	});

	it('reports the embedded image through onChange, so it can be saved with the signature', async () => {
		const { user, onChange } = renderSignatureEditor();

		await selectFiles(user, [pngFile()]);

		await waitFor(() => {
			expect(onChange).toHaveBeenCalledWith(expect.stringContaining(PNG_DATA_URI));
		});
	});

	it('embeds a pasted image as a data URI', async () => {
		renderSignatureEditor();
		const content = screen.getByTestId(CONTENT_TESTID);

		pasteFileInto(content, pngFile('pasted.png'));

		const image = await within(content).findByRole('img');
		expect(image).toHaveAttribute('src', PNG_DATA_URI);
	});

	it('renders a data URI image of a signature loaded from the server', async () => {
		renderSignatureEditor(`<p><img src="${PNG_DATA_URI}" alt="Inline attachment" /></p>`);

		const image = await within(screen.getByTestId(CONTENT_TESTID)).findByRole('img');
		expect(image).toHaveAttribute('src', PNG_DATA_URI);
	});

	it('ignores a picked file which is not an image', async () => {
		const { user } = renderSignatureEditor();

		await selectFiles(user, [new File(['a document'], 'doc.pdf', { type: 'application/pdf' })]);

		const content = screen.getByTestId(CONTENT_TESTID);
		await waitFor(() => {
			expect(within(content).queryByRole('img')).not.toBeInTheDocument();
		});
	});
});
