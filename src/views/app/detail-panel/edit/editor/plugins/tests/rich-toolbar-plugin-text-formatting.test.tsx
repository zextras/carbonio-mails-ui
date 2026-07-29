/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act, waitFor } from '@testing-library/react';
import { $getRoot, $isTextNode, type LexicalEditor } from 'lexical';

import { headingSelector } from './rich-toolbar-plugin-block-styles.test';
import {
	BOLD_LABEL,
	EDITOR_TESTID,
	installRangeRectPolyfill,
	openSelect,
	richTextOf,
	SELECT_INDEX,
	setupEditor,
	setupWithSelectedContent
} from './rich-toolbar-plugin-test-utils';
import { screen, within } from '@test-setup';

beforeAll(() => {
	installRangeRectPolyfill();
});

describe('RichToolbarPlugin - inline text formatting', () => {
	it('applies bold to the selection', async () => {
		const { editorId, user } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: BOLD_LABEL }));

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('font-weight: bold');
		});
	});

	it('applies italic to the selection', async () => {
		const { editorId, user } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: 'lexical-label.italic' }));

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('font-style: italic');
		});
	});

	it('applies underline to the selection', async () => {
		const { editorId, user } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: 'lexical-label.underline' }));

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('text-decoration: underline');
		});
	});

	it('applies strikethrough to the selection', async () => {
		const { editorId, user } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: 'lexical-label.strikethrough' }));

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
		await user.click(screen.getByRole('button', { name: 'lexical-label.remove_format' }));

		await waitFor(() => {
			expect(richTextOf(editorId)).not.toContain('tahoma');
		});
	});

	it('clears active bold/italic/underline/strikethrough with the remove-formatting control', async () => {
		const { editorId, user } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: BOLD_LABEL }));
		await user.click(screen.getByRole('button', { name: 'lexical-label.italic' }));
		await user.click(screen.getByRole('button', { name: 'lexical-label.underline' }));
		await user.click(screen.getByRole('button', { name: 'lexical-label.strikethrough' }));
		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('font-weight: bold');
		});
		expect(richTextOf(editorId)).toContain('font-style: italic');
		expect(richTextOf(editorId)).toContain('text-decoration');

		await user.click(screen.getByTestId(EDITOR_TESTID));
		await user.keyboard('{Control>}a{/Control}');
		await user.click(screen.getByRole('button', { name: 'lexical-label.remove_format' }));

		await waitFor(() => {
			expect(richTextOf(editorId)).not.toContain('font-weight: bold');
		});
		expect(richTextOf(editorId)).not.toContain('font-style: italic');
		expect(richTextOf(editorId)).not.toContain('text-decoration');
	});

	it('clears bold from a selection that only covers part of an already-bold node', async () => {
		const { editorId, user, editorElement } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: BOLD_LABEL }));
		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('font-weight: bold');
		});

		const editorWithInstance = editorElement as HTMLElement & {
			__lexicalEditor: LexicalEditor;
		};
		act(() => {
			editorWithInstance.__lexicalEditor.update(() => {
				const textNode = $getRoot().getFirstDescendant();
				if ($isTextNode(textNode)) {
					// Selects only "world" out of the fully-bold "hello world" node.
					textNode.select(6, 11);
				}
			});
		});

		await user.click(screen.getByRole('button', { name: 'lexical-label.remove_format' }));

		await waitFor(() => {
			expect(screen.getByText('world')).not.toHaveStyle({ fontWeight: 'bold' });
		});
		expect(screen.getByText('hello')).toHaveStyle({ fontWeight: 'bold' });
	});

	it('clears formatting across a selection spanning lines with different formats', async () => {
		const richText = '<p><strong>hello</strong></p><p><em>world</em></p><p>plain</p>';
		const { editorId, user } = setupEditor(richText);
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		await within(editorElement).findByText('plain');
		await user.click(editorElement);
		await user.keyboard('{Control>}a{/Control}');

		await user.click(screen.getByRole('button', { name: 'lexical-label.remove_format' }));

		await waitFor(() => {
			expect(richTextOf(editorId)).not.toContain('font-weight: bold');
		});
		expect(richTextOf(editorId)).not.toContain('<strong');
		expect(richTextOf(editorId)).not.toContain('font-style: italic');
		expect(richTextOf(editorId)).not.toContain('<em>');
	});

	it('resets a heading back to a paragraph with the remove-formatting control', async () => {
		const { editorId, editorElement, user } = await setupWithSelectedContent();

		await openSelect(user, SELECT_INDEX.paragraph);
		await user.click(await screen.findByText('lexical-label.heading_1'));
		headingSelector(editorElement, 1);

		await user.click(screen.getByTestId(EDITOR_TESTID));
		await user.keyboard('{Control>}a{/Control}');
		await user.click(screen.getByRole('button', { name: 'lexical-label.remove_format' }));

		expect(within(editorElement).queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
		expect(richTextOf(editorId)).not.toContain('<h1');
		expect(richTextOf(editorId)).toContain('<p ');
	});

	it('resets a blockquote back to a paragraph with the remove-formatting control', async () => {
		const { editorId, user } = await setupWithSelectedContent();

		await openSelect(user, SELECT_INDEX.paragraph);
		await user.click(await screen.findByText('lexical-label.blockquote'));
		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('<blockquote');
		});

		await user.click(screen.getByTestId(EDITOR_TESTID));
		await user.keyboard('{Control>}a{/Control}');
		await user.click(screen.getByRole('button', { name: 'lexical-label.remove_format' }));

		await waitFor(() => {
			expect(richTextOf(editorId)).not.toContain('<blockquote');
		});
		expect(richTextOf(editorId)).toContain('<p ');
	});
});
