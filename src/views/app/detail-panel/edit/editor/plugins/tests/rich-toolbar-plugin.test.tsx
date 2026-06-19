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

const DEFAULT_HTML = '<p>hello world</p>';
const EDITOR_TESTID = 'edit-view-editor';
const PARAGRAPH_LABEL = 'label.paragraph';
const BOLD_LABEL = 'label.bold';
const LINK_LABEL = 'label.link';
const ALIGN_LEFT_LABEL = 'label.align_left';
const ALIGN_CENTER_LABEL = 'label.align_center';
// The font / size / paragraph selects render in this order; they carry no label,
// so they are addressed by position.
const SELECT_INDEX = { font: 0, size: 1, paragraph: 2 };

type TestUser = ReturnType<typeof setupTest>['user'];

function richTextOf(editorId: string): string {
	return useEditorsStore.getState().editors[editorId]?.text.richText ?? '';
}

function setupEditor(richText = DEFAULT_HTML): { editorId: string; user: TestUser } {
	const editor = generateNewMessageEditor();
	editor.text = { plainText: 'hello world', richText };
	setupEditorStore({ editors: [editor] });
	const { user } = setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);
	return { editorId: editor.id, user };
}

/** Renders the editor, waits for the initial content and selects all of it. */
async function setupWithSelectedContent(richText = DEFAULT_HTML): Promise<{
	editorId: string;
	user: TestUser;
	editorElement: HTMLElement;
}> {
	const { editorId, user } = setupEditor(richText);
	const editorElement = screen.getByTestId(EDITOR_TESTID);
	await within(editorElement).findByText('hello world');
	await user.click(editorElement);
	await user.keyboard('{Control>}a{/Control}');
	return { editorId, user, editorElement };
}

/**
 * Opens the font / size / paragraph `Select` at the given position. The selects
 * render no label and the chevron icon has `pointer-events: none`, so the
 * dropdown is opened by clicking the focusable trigger box around the chevron.
 */
async function openSelect(user: TestUser, index: number): Promise<void> {
	const chevron = screen.getAllByTestId('icon: ArrowDown')[index];
	// eslint-disable-next-line testing-library/no-node-access
	const trigger = chevron.closest('[tabindex="0"]');
	if (trigger === null) {
		throw new Error('select trigger not found');
	}
	await user.click(trigger);
}

describe('RichToolbarPlugin', () => {
	describe('rendering', () => {
		it('renders the formatting controls', () => {
			setupEditor();

			expect(screen.getByRole('button', { name: BOLD_LABEL })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'label.italic' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'label.underline' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'label.strikethrough' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: ALIGN_LEFT_LABEL })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'label.bullet_list' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'label.numbered_list' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: LINK_LABEL })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'label.table' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'label.image' })).toBeInTheDocument();
		});

		it('renders the font, size and paragraph selectors', () => {
			setupEditor();

			// The three selects each render a chevron trigger...
			expect(screen.getAllByTestId('icon: ArrowDown')).toHaveLength(3);
			// ...and the paragraph selector shows its current block value.
			expect(screen.getAllByText(PARAGRAPH_LABEL).length).toBeGreaterThan(0);
		});
	});

	describe('inline text formatting', () => {
		it('applies bold to the selection', async () => {
			const { editorId, user } = await setupWithSelectedContent();

			await user.click(screen.getByRole('button', { name: BOLD_LABEL }));

			await waitFor(() => {
				expect(richTextOf(editorId)).toContain('font-weight: bold');
			});
		});

		it('applies italic to the selection', async () => {
			const { editorId, user } = await setupWithSelectedContent();

			await user.click(screen.getByRole('button', { name: 'label.italic' }));

			await waitFor(() => {
				expect(richTextOf(editorId)).toContain('font-style: italic');
			});
		});

		it('applies underline to the selection', async () => {
			const { editorId, user } = await setupWithSelectedContent();

			await user.click(screen.getByRole('button', { name: 'label.underline' }));

			await waitFor(() => {
				expect(richTextOf(editorId)).toContain('text-decoration: underline');
			});
		});

		it('applies strikethrough to the selection', async () => {
			const { editorId, user } = await setupWithSelectedContent();

			await user.click(screen.getByRole('button', { name: 'label.strikethrough' }));

			await waitFor(() => {
				expect(richTextOf(editorId)).toContain('line-through');
			});
		});

		it('clears inline styling with the remove-formatting control', async () => {
			const { editorId, user } = await setupWithSelectedContent();

			await openSelect(user, SELECT_INDEX.font);
			await user.click(await screen.findByText('Tahoma'));
			await waitFor(() => {
				expect(richTextOf(editorId)).toContain('tahoma');
			});

			await user.click(screen.getByTestId(EDITOR_TESTID));
			await user.keyboard('{Control>}a{/Control}');
			await user.click(screen.getByRole('button', { name: 'label.remove_format' }));

			await waitFor(() => {
				expect(richTextOf(editorId)).not.toContain('font-family: tahoma');
			});
		});
	});

	describe('block styles and lists', () => {
		it('turns the selection into a heading', async () => {
			const { editorElement, user } = await setupWithSelectedContent();

			await openSelect(user, SELECT_INDEX.paragraph);
			await user.click(await screen.findByText('label.heading_1'));

			expect(await within(editorElement).findByRole('heading', { level: 1 })).toBeInTheDocument();
		});

		it('turns the selection into a blockquote', async () => {
			const { editorId, user } = await setupWithSelectedContent();

			await openSelect(user, SELECT_INDEX.paragraph);
			await user.click(await screen.findByText('label.blockquote'));

			await waitFor(() => {
				expect(richTextOf(editorId)).toContain('<blockquote');
			});
		});

		it('inserts a bulleted list', async () => {
			const { editorId, user } = await setupWithSelectedContent();

			await user.click(screen.getByRole('button', { name: 'label.bullet_list' }));

			await waitFor(() => {
				expect(richTextOf(editorId)).toContain('<ul');
			});
		});

		it('inserts a numbered list', async () => {
			const { editorId, user } = await setupWithSelectedContent();

			await user.click(screen.getByRole('button', { name: 'label.numbered_list' }));

			await waitFor(() => {
				expect(richTextOf(editorId)).toContain('<ol');
			});
		});
	});

	describe('paragraph alignment', () => {
		it('aligns the paragraph to the center', async () => {
			const { editorId, user } = await setupWithSelectedContent();

			await user.click(screen.getByRole('button', { name: ALIGN_CENTER_LABEL }));

			await waitFor(() => {
				expect(richTextOf(editorId)).toContain('text-align: center');
			});
		});

		it('aligns the paragraph to the right', async () => {
			const { editorId, user } = await setupWithSelectedContent();

			await user.click(screen.getByRole('button', { name: 'label.align_right' }));

			await waitFor(() => {
				expect(richTextOf(editorId)).toContain('text-align: right');
			});
		});
	});

	describe('font and size selectors', () => {
		it('applies the chosen font family to the selection', async () => {
			const { editorId, user } = await setupWithSelectedContent();

			await openSelect(user, SELECT_INDEX.font);
			await user.click(await screen.findByText('Tahoma'));

			await waitFor(() => {
				expect(richTextOf(editorId)).toContain('font-family: tahoma');
			});
		});

		it('applies the chosen font size to the selection', async () => {
			const { editorId, user } = await setupWithSelectedContent();

			await openSelect(user, SELECT_INDEX.size);
			await user.click(await screen.findByText('48pt'));

			await waitFor(() => {
				expect(richTextOf(editorId)).toContain('font-size: 48pt');
			});
		});
	});

	describe('colors', () => {
		it('applies the selected text color', async () => {
			const { editorId } = await setupWithSelectedContent();
			// The color pickers are aria-hidden native inputs co-located with their
			// toolbar buttons, so there is no accessible query for them.
			// eslint-disable-next-line testing-library/no-node-access
			const [textColorInput] = document.querySelectorAll<HTMLInputElement>('input[type="color"]');

			// eslint-disable-next-line testing-library/prefer-user-event -- native color input has no user-event equivalent
			fireEvent.change(textColorInput, { target: { value: '#ff0000' } });

			await waitFor(() => {
				expect(richTextOf(editorId)).toContain('color: rgb(255, 0, 0)');
			});
		});

		it('applies the selected background color', async () => {
			const { editorId } = await setupWithSelectedContent();
			// eslint-disable-next-line testing-library/no-node-access
			const colorInputs = document.querySelectorAll<HTMLInputElement>('input[type="color"]');
			const backgroundColorInput = colorInputs[1];

			// eslint-disable-next-line testing-library/prefer-user-event -- native color input has no user-event equivalent
			fireEvent.change(backgroundColorInput, { target: { value: '#00ff00' } });

			await waitFor(() => {
				expect(richTextOf(editorId)).toContain('background-color: rgb(0, 255, 0)');
			});
		});
	});

	describe('links and images', () => {
		it('wraps the selection in a link from the prompted URL', async () => {
			const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('https://example.com');
			const { editorId, editorElement, user } = await setupWithSelectedContent();

			await user.click(screen.getByRole('button', { name: LINK_LABEL }));

			expect(await within(editorElement).findByRole('link')).toBeInTheDocument();
			expect(richTextOf(editorId)).toContain('href="https://example.com"');
			promptSpy.mockRestore();
		});

		it('inserts an image from the prompted URL', async () => {
			const promptSpy = vi
				.spyOn(window, 'prompt')
				.mockReturnValue('https://example.com/picture.png');
			const { editorElement, user } = await setupWithSelectedContent();

			await user.click(screen.getByRole('button', { name: 'label.insert_image_url' }));

			const image = await within(editorElement).findByRole('img');
			expect(image).toHaveAttribute('src', 'https://example.com/picture.png');
			promptSpy.mockRestore();
		});

		it('does not insert an image when the URL prompt is dismissed', async () => {
			const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null);
			const { editorElement, user } = await setupWithSelectedContent();

			await user.click(screen.getByRole('button', { name: 'label.insert_image_url' }));

			expect(within(editorElement).queryByRole('img')).not.toBeInTheDocument();
			promptSpy.mockRestore();
		});

		it('shows the image alignment control only while an image is selected', async () => {
			const { user } = setupEditor('<p><img src="https://example.com/inline.png" alt="pic" /></p>');
			const editorElement = screen.getByTestId(EDITOR_TESTID);
			const image = await within(editorElement).findByRole('img');

			expect(screen.queryByRole('button', { name: 'label.image_align' })).not.toBeInTheDocument();

			await user.click(image);

			expect(await screen.findByRole('button', { name: 'label.image_align' })).toBeInTheDocument();
		});
	});

	describe('active option highlighting', () => {
		it('marks left alignment and ltr direction active by default', () => {
			setupEditor();

			expect(
				screen.getByRole('button', { name: ALIGN_LEFT_LABEL, pressed: true })
			).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'label.ltr', pressed: true })).toBeInTheDocument();
			// Other alignments are not active.
			expect(
				screen.getByRole('button', { name: ALIGN_CENTER_LABEL, pressed: false })
			).toBeInTheDocument();
			expect(
				screen.getByRole('button', { name: 'label.align_right', pressed: false })
			).toBeInTheDocument();
		});

		it('does not expose a pressed state on plain action buttons', () => {
			setupEditor();

			// Action buttons (not toggles) carry no aria-pressed.
			expect(screen.getByRole('button', { name: LINK_LABEL })).not.toHaveAttribute('aria-pressed');
			expect(screen.getByRole('button', { name: 'label.image' })).not.toHaveAttribute(
				'aria-pressed'
			);
		});

		it('activates the bold control when the selection is bold', async () => {
			const { user } = await setupWithSelectedContent();

			expect(screen.getByRole('button', { name: BOLD_LABEL, pressed: false })).toBeInTheDocument();

			await user.click(screen.getByRole('button', { name: BOLD_LABEL }));

			expect(
				await screen.findByRole('button', { name: BOLD_LABEL, pressed: true })
			).toBeInTheDocument();
		});

		it('moves the active alignment when the paragraph is re-aligned', async () => {
			const { user } = await setupWithSelectedContent();

			await user.click(screen.getByRole('button', { name: ALIGN_CENTER_LABEL }));

			expect(
				await screen.findByRole('button', { name: ALIGN_CENTER_LABEL, pressed: true })
			).toBeInTheDocument();
			expect(
				screen.getByRole('button', { name: ALIGN_LEFT_LABEL, pressed: false })
			).toBeInTheDocument();
		});
	});
});
