/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { createEvent, fireEvent, waitFor } from '@testing-library/react';

import { setupTest, screen, within } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';
import { DROP_CARET_TEST_ID } from 'views/app/detail-panel/edit/editor/plugins/image-drag-drop';
import { INLINE_IMAGE_DRAG_TYPE } from 'views/app/detail-panel/edit/editor/plugins/nodes/image-types';

const EDITOR_TEST_ID = 'edit-view-editor';

const IMAGE_HTML =
	'<p><img src="https://example.com/inline.png" alt="pic" data-pnsrc="cid:abc@carbonio" /></p>';

const INSERT_IMAGE_LABEL = 'lexical-label.insert_image_url';
const EDIT_IMAGE_LABEL = 'lexical-label.edit_image';

/** Exported size of a 200x100 image resized to 300px of width. */
const RESIZED_WIDTH = 'width: 300px';
const RESIZED_HEIGHT = 'height: 150px';
const RESIZED_WIDTH_PX = '300px';

function richTextOf(editorId: string): string {
	return useEditorsStore.getState().editors[editorId]?.text.richText ?? '';
}

type TestUser = ReturnType<typeof setupTest>['user'];

function setupEditorWithHtml(richText: string): {
	editorId: string;
	user: TestUser;
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

type Size = { width: number; height: number };

/**
 * jsdom has no layout and loads no image: gives the images a natural size and
 * the size they are rendered with.
 */
function mockImageGeometry(natural: Size, rendered: Size = natural): void {
	vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(natural.width);
	vi.spyOn(HTMLImageElement.prototype, 'naturalHeight', 'get').mockReturnValue(natural.height);
	vi.spyOn(HTMLImageElement.prototype, 'getBoundingClientRect').mockReturnValue(
		rendered as DOMRect
	);
}

type Pointer = { clientX: number; clientY: number };

/* eslint-disable testing-library/prefer-user-event -- simulating a pointer drag with explicit coordinates */
/** Drags a resize handle from the origin to `to` and releases it there. */
function dragHandle(handle: Element, to: Pointer): void {
	fireEvent.mouseDown(handle, { clientX: 0, clientY: 0 });
	fireEvent.mouseMove(document, to);
	fireEvent.mouseUp(document, to);
}
/* eslint-enable testing-library/prefer-user-event */

/** Selects the image of the editor and drags its `handle` resize handle to `to`. */
async function resizeImage(user: TestUser, handle: string, to: Pointer): Promise<void> {
	await user.click(await findEditorImage());
	dragHandle(await screen.findByTestId(`image-resizer-${handle}`), to);
}

function imageTagOf(editorId: string): string {
	return /<img [^>]*>/.exec(richTextOf(editorId))?.[0] ?? '';
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
 * jsdom has no layout, so the DOM position under the pointer is provided through
 * a mocked `document.caretPositionFromPoint` (or, with `legacy`, through the
 * `document.caretRangeFromPoint` used by the browsers lacking the former).
 */
function mockDropPosition(node: Node, offset: number, { legacy = false } = {}): void {
	if (legacy) {
		const range = document.createRange();
		range.setStart(node, offset);
		range.collapse(true);
		Object.defineProperty(document, 'caretRangeFromPoint', {
			configurable: true,
			value: vi.fn((): Range => range)
		});
		return;
	}
	Object.defineProperty(document, 'caretPositionFromPoint', {
		configurable: true,
		value: vi.fn(() => ({ offsetNode: node, offset }))
	});
}

function getTextNode(element: Element): Node {
	const textNode = document.createTreeWalker(element, NodeFilter.SHOW_TEXT).nextNode();
	if (textNode === null) {
		throw new Error('missing text node');
	}
	return textNode;
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

/**
 * Starts dragging `source` and moves it over `target`, without dropping it.
 */
function startDragOver(source: Element, target: Element): DataTransfer {
	const { dataTransfer, setProtected } = createDataTransfer();
	fireEvent.dragStart(source, { dataTransfer });
	setProtected(true);
	fireEvent.dragOver(target, { dataTransfer });
	return dataTransfer;
}

function fireDragLeave(element: Element, relatedTarget: EventTarget | null): void {
	const event = createEvent.dragLeave(element);
	Object.defineProperty(event, 'relatedTarget', { value: relatedTarget });
	fireEvent(element, event);
}
/* eslint-enable testing-library/prefer-user-event */

async function setupEditorForMove(
	richText: string
): Promise<{ editorId: string; editorElement: HTMLElement; initialRichText: string }> {
	const { editorId } = setupEditorWithHtml(richText);
	await within(screen.getByTestId(EDITOR_TEST_ID)).findAllByRole('img');
	await waitFor(() => {
		expect(richTextOf(editorId)).toContain('<img ');
	});
	return {
		editorId,
		editorElement: screen.getByTestId(EDITOR_TEST_ID),
		initialRichText: richTextOf(editorId)
	};
}

const TARGET_TEXT = 'second paragraph';

const MOVABLE_IMAGE_HTML =
	'<p>first<img src="https://example.com/inline.png" alt="pic" data-pnsrc="cid:abc@carbonio" /></p>' +
	'<p>second paragraph</p>';

describe('Inline image editing', () => {
	afterEach(() => {
		// Remove the mocks installed by mockDropPosition and mockImageGeometry
		Reflect.deleteProperty(document, 'caretPositionFromPoint');
		Reflect.deleteProperty(document, 'caretRangeFromPoint');
		vi.restoreAllMocks();
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

	it('highlights the image dialog button, labelled as edit, only while a single image is selected', async () => {
		const { user } = setupEditorWithHtml(
			'<p><img src="https://example.com/a.png" alt="first" />' +
				'<img src="https://example.com/b.png" alt="second" /></p>'
		);
		const editorElement = screen.getByTestId(EDITOR_TEST_ID);
		const first = await within(editorElement).findByRole('img', { name: 'first' });

		expect(screen.getByRole('button', { name: INSERT_IMAGE_LABEL, pressed: false })).toBeVisible();

		await user.click(first);

		expect(
			await screen.findByRole('button', { name: EDIT_IMAGE_LABEL, pressed: true })
		).toBeVisible();

		// With two images selected the dialog would insert a new image, not edit one
		await user.keyboard('{Shift>}');
		await user.click(within(editorElement).getByRole('img', { name: 'second' }));
		await user.keyboard('{/Shift}');

		expect(
			await screen.findByRole('button', { name: INSERT_IMAGE_LABEL, pressed: false })
		).toBeVisible();
		expect(screen.getByRole('button', { name: 'lexical-label.image_align' })).toBeVisible();
	});

	it('resizes freely, persisting the new size, when the size of the image cannot be read', async () => {
		// jsdom: no natural nor rendered size
		const { editorId, user } = setupEditorWithHtml(IMAGE_HTML);

		await resizeImage(user, 'se', { clientX: 120, clientY: 80 });

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('width: 120px');
		});
		expect(richTextOf(editorId)).toContain('height: 80px');
	});

	// Side handles drive their own axis; corner handles follow the axis moved the most
	it.each([
		{ handle: 'e', to: { clientX: 100, clientY: 70 } },
		{ handle: 'w', to: { clientX: -100, clientY: 70 } },
		{ handle: 's', to: { clientX: 70, clientY: 50 } },
		{ handle: 'n', to: { clientX: 70, clientY: -50 } },
		{ handle: 'se', to: { clientX: 100, clientY: 10 } },
		{ handle: 'nw', to: { clientX: -100, clientY: -5 } },
		{ handle: 'ne', to: { clientX: 100, clientY: -5 } },
		{ handle: 'sw', to: { clientX: -5, clientY: 50 } }
	])('keeps the aspect ratio when dragging the $handle handle', async ({ handle, to }) => {
		mockImageGeometry({ width: 200, height: 100 });
		const { editorId, user } = setupEditorWithHtml(IMAGE_HTML);

		await resizeImage(user, handle, to);

		await waitFor(() => {
			expect(imageTagOf(editorId)).toContain(RESIZED_WIDTH);
		});
		expect(imageTagOf(editorId)).toContain(RESIZED_HEIGHT);
	});

	it.each<[string, Size, Size]>([
		[
			'the natural ratio over the rendered one',
			{ width: 200, height: 100 },
			{ width: 200, height: 200 }
		],
		[
			'the rendered ratio while the image is not loaded',
			{ width: 0, height: 0 },
			{ width: 200, height: 100 }
		]
	])('keeps %s', async (_, natural, rendered) => {
		mockImageGeometry(natural, rendered);
		const { editorId, user } = setupEditorWithHtml(IMAGE_HTML);

		await resizeImage(user, 'e', { clientX: 100, clientY: 0 });

		await waitFor(() => {
			expect(imageTagOf(editorId)).toContain(RESIZED_WIDTH);
		});
		expect(imageTagOf(editorId)).toContain(RESIZED_HEIGHT);
	});

	it.each([
		{ shape: 'wide', size: { width: 200, height: 100 }, expected: { width: 80, height: 40 } },
		{ shape: 'tall', size: { width: 100, height: 200 }, expected: { width: 40, height: 80 } }
	])(
		'stops shrinking a $shape image when its smaller side reaches 40px, keeping the ratio',
		async ({ size, expected }) => {
			mockImageGeometry(size);
			const { editorId, user } = setupEditorWithHtml(IMAGE_HTML);

			await resizeImage(user, 'se', { clientX: -500, clientY: -500 });

			await waitFor(() => {
				expect(imageTagOf(editorId)).toContain(`width: ${expected.width}px`);
			});
			expect(imageTagOf(editorId)).toContain(`height: ${expected.height}px`);
		}
	);

	it('does not enlarge an image already thinner than the minimum to reach it', async () => {
		// A 600x10 divider: reaching 40px of height would make it 2400px wide
		mockImageGeometry({ width: 600, height: 10 });
		const { editorId, user } = setupEditorWithHtml(IMAGE_HTML);

		await resizeImage(user, 'e', { clientX: -300, clientY: 0 });

		await waitFor(() => {
			expect(imageTagOf(editorId)).toContain('width: 600px');
		});
		expect(imageTagOf(editorId)).toContain('height: 10px');
	});

	it('previews the size while dragging and commits it only on mouse up', async () => {
		mockImageGeometry({ width: 200, height: 100 });
		const { editorId, user } = setupEditorWithHtml(IMAGE_HTML);
		const image = await findEditorImage();
		await user.click(image);
		const handle = await screen.findByTestId('image-resizer-e');

		/* eslint-disable testing-library/prefer-user-event -- simulating a pointer drag with explicit coordinates */
		fireEvent.mouseDown(handle, { clientX: 0, clientY: 0 });
		fireEvent.mouseMove(document, { clientX: 100, clientY: 0 });

		// The height follows the ratio, so a container narrower than the image can't distort it
		expect(image).toHaveStyle({ width: RESIZED_WIDTH_PX, height: 'auto' });
		// eslint-disable-next-line jest-dom/prefer-to-have-style -- jsdom's CSS parser drops aspect-ratio, so toHaveStyle can't see it
		expect(image.style.aspectRatio).toBe('300 / 150');
		expect(imageTagOf(editorId)).not.toContain('width:');

		fireEvent.mouseUp(document, { clientX: 100, clientY: 0 });
		/* eslint-enable testing-library/prefer-user-event */

		await waitFor(() => {
			expect(imageTagOf(editorId)).toContain(RESIZED_WIDTH);
		});
	});

	it('renders an image with both sizes set with the height following their ratio', async () => {
		const { editorId } = setupEditorWithHtml(
			'<p><img src="https://example.com/inline.png" alt="pic" style="width: 300px; height: 150px;" /></p>'
		);

		const image = await findEditorImage();

		expect(image).toHaveStyle({ width: RESIZED_WIDTH_PX, height: 'auto', maxWidth: '100%' });
		// eslint-disable-next-line jest-dom/prefer-to-have-style -- jsdom's CSS parser drops aspect-ratio, so toHaveStyle can't see it
		expect(image.style.aspectRatio).toBe('300 / 150');
		// The exported HTML keeps both sizes
		await waitFor(() => {
			expect(imageTagOf(editorId)).toContain(RESIZED_WIDTH);
		});
		expect(imageTagOf(editorId)).toContain(RESIZED_HEIGHT);
	});

	it('stops following the pointer when the image is deleted while resizing', async () => {
		const addListener = vi.spyOn(document, 'addEventListener');
		const removeListener = vi.spyOn(document, 'removeEventListener');
		const { editorId, user } = setupEditorWithHtml(IMAGE_HTML);
		await user.click(await findEditorImage());
		const handle = await screen.findByTestId('image-resizer-se');

		addListener.mockClear();
		// eslint-disable-next-line testing-library/prefer-user-event -- simulating a pointer drag with explicit coordinates
		fireEvent.mouseDown(handle, { clientX: 0, clientY: 0 });
		const dragListeners = addListener.mock.calls.filter(
			([type]) => type === 'mousemove' || type === 'mouseup'
		);
		expect(dragListeners).toHaveLength(2);

		await user.keyboard('{Delete}');

		await waitFor(() => {
			expect(richTextOf(editorId)).not.toContain('<img ');
		});
		dragListeners.forEach(([type, listener]) => {
			expect(removeListener).toHaveBeenCalledWith(type, listener);
		});
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

	describe('moving an image by drag and drop', () => {
		it('moves the image to the drop position when dragged into another paragraph', async () => {
			const { editorId, editorElement } = await setupEditorForMove(
				'<p>first<img src="https://example.com/inline.png" alt="pic" data-pnsrc="cid:abc@carbonio" ' +
					'style="width: 200px; float: left;" /></p><p>second paragraph</p>'
			);
			const image = await findEditorImage();
			const targetText = within(editorElement).getByText(TARGET_TEXT);
			mockDropPosition(getTextNode(targetText), 'second'.length);

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

		it('resolves the drop position on the browsers lacking caretPositionFromPoint', async () => {
			const { editorId, editorElement } = await setupEditorForMove(MOVABLE_IMAGE_HTML);
			const image = await findEditorImage();
			const targetText = within(editorElement).getByText(TARGET_TEXT);
			mockDropPosition(getTextNode(targetText), 'second'.length, { legacy: true });

			dragAndDrop(image, targetText);

			await waitFor(() => {
				expect(richTextOf(editorId)).toMatch(/second<\/span><img [^>]*><span[^>]*> paragraph/);
			});
		});

		it('moves the image to the end of the text when the pointer is past the text', async () => {
			const { editorId, editorElement } = await setupEditorForMove(MOVABLE_IMAGE_HTML);
			const image = await findEditorImage();
			const targetText = within(editorElement).getByText(TARGET_TEXT);
			// Hit on the text element, after its text node
			mockDropPosition(targetText, 1);

			dragAndDrop(image, targetText);

			await waitFor(() => {
				expect(richTextOf(editorId)).toMatch(/second paragraph<\/span><img /);
			});
		});

		it('moves the image into an empty paragraph', async () => {
			const { editorId, editorElement } = await setupEditorForMove(
				'<p>first<img src="https://example.com/inline.png" alt="pic" /></p><p><br></p><p>last</p>'
			);
			const image = await findEditorImage();
			const emptyParagraph = within(editorElement).getAllByRole('paragraph')[1];
			mockDropPosition(emptyParagraph, 0);

			const { dropCaretShown } = dragAndDrop(image, emptyParagraph);

			expect(dropCaretShown).toBe(true);
			await waitFor(() => {
				expect(richTextOf(editorId)).toMatch(
					/first<\/span><\/p><p[^>]*><img [^>]*><\/p><p[^>]*><span[^>]*>last/
				);
			});
		});

		it('moves the image right after another image when dropped on it', async () => {
			const { editorId, editorElement } = await setupEditorForMove(
				'<p><img src="https://example.com/a.png" alt="moved" />text</p>' +
					'<p>end<img src="https://example.com/b.png" alt="target" /></p>'
			);
			const image = within(editorElement).getByRole('img', { name: 'moved' });
			const targetImage = within(editorElement).getByRole('img', { name: 'target' });
			mockDropPosition(targetImage, 0);

			const { dropCaretShown } = dragAndDrop(image, targetImage);

			expect(dropCaretShown).toBe(true);
			await waitFor(() => {
				expect(richTextOf(editorId)).toMatch(/alt="target"[^>]*><img [^>]*alt="moved"/);
			});
			expect(richTextOf(editorId).match(/alt="moved"/g)).toHaveLength(1);
		});

		it('appends the image to the nearest paragraph when dropped outside of any paragraph', async () => {
			const { editorId, editorElement } = await setupEditorForMove(MOVABLE_IMAGE_HTML);
			const image = await findEditorImage();
			// Hit on the editor root, below its last paragraph
			mockDropPosition(editorElement, 2);

			dragAndDrop(image, editorElement);

			await waitFor(() => {
				expect(richTextOf(editorId)).toMatch(/second paragraph<\/span><img /);
			});
		});

		it('leaves the content unchanged when the image is dropped on itself', async () => {
			const { editorId, initialRichText } = await setupEditorForMove(MOVABLE_IMAGE_HTML);
			const image = await findEditorImage();
			mockDropPosition(image, 0);

			const { dropCaretShown } = dragAndDrop(image, image);

			expect(dropCaretShown).toBe(false);
			expect(richTextOf(editorId)).toBe(initialRichText);
			expect(screen.getByRole('img')).toBe(image);
		});

		it('leaves the content unchanged when the drop position cannot be resolved', async () => {
			const { editorId, editorElement, initialRichText } =
				await setupEditorForMove(MOVABLE_IMAGE_HTML);
			const image = await findEditorImage();
			const targetText = within(editorElement).getByText(TARGET_TEXT);

			const { dropAllowed, dropCaretShown } = dragAndDrop(image, targetText);

			expect(dropAllowed).toBe(true);
			expect(dropCaretShown).toBe(false);
			expect(richTextOf(editorId)).toBe(initialRichText);
		});

		it.each([
			['an image of another editor', JSON.stringify({ editorKey: 'other-editor', nodeKey: '1' })],
			['an unknown payload', 'not a json payload'],
			['an empty payload', '']
		])('ignores the drop of %s', async (_, payload) => {
			const { editorId, editorElement, initialRichText } =
				await setupEditorForMove(MOVABLE_IMAGE_HTML);
			const targetText = within(editorElement).getByText(TARGET_TEXT);
			mockDropPosition(getTextNode(targetText), 'second'.length);
			const { dataTransfer } = createDataTransfer();
			dataTransfer.setData(INLINE_IMAGE_DRAG_TYPE, payload);

			/* eslint-disable testing-library/prefer-user-event -- user-event does not support native drag and drop */
			fireEvent.dragOver(targetText, { dataTransfer });
			expect(screen.queryByTestId(DROP_CARET_TEST_ID)).not.toBeInTheDocument();
			const dropHandled = !fireEvent.drop(targetText, { dataTransfer });
			/* eslint-enable testing-library/prefer-user-event */

			expect(dropHandled).toBe(true);
			expect(richTextOf(editorId)).toBe(initialRichText);
		});

		it('hides the drop caret when the drag leaves the editor', async () => {
			const { editorElement } = await setupEditorForMove(MOVABLE_IMAGE_HTML);
			const image = await findEditorImage();
			const targetText = within(editorElement).getByText(TARGET_TEXT);
			mockDropPosition(getTextNode(targetText), 'second'.length);
			startDragOver(image, targetText);
			expect(screen.getByTestId(DROP_CARET_TEST_ID)).toBeInTheDocument();

			// Moving between elements of the editor keeps it
			fireDragLeave(editorElement, targetText);
			expect(screen.getByTestId(DROP_CARET_TEST_ID)).toBeInTheDocument();

			fireDragLeave(editorElement, document.body);
			expect(screen.queryByTestId(DROP_CARET_TEST_ID)).not.toBeInTheDocument();
		});

		it('hides the drop caret and keeps the content when the drag is cancelled', async () => {
			const { editorId, editorElement, initialRichText } =
				await setupEditorForMove(MOVABLE_IMAGE_HTML);
			const image = await findEditorImage();
			const targetText = within(editorElement).getByText(TARGET_TEXT);
			mockDropPosition(getTextNode(targetText), 'second'.length);
			const dataTransfer = startDragOver(image, targetText);
			expect(screen.getByTestId(DROP_CARET_TEST_ID)).toBeInTheDocument();

			// eslint-disable-next-line testing-library/prefer-user-event -- user-event does not support native drag and drop
			fireEvent.dragEnd(image, { dataTransfer });

			expect(screen.queryByTestId(DROP_CARET_TEST_ID)).not.toBeInTheDocument();
			expect(richTextOf(editorId)).toBe(initialRichText);
		});
	});
});
