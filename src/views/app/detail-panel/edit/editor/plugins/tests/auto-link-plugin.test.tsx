/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { $isAutoLinkNode, type AutoLinkNode } from '@lexical/link';
import { $dfs } from '@lexical/utils';
import { act, cleanup, waitFor } from '@testing-library/react';
import { $getSelection, type LexicalEditor } from 'lexical';

import { BOLD_LABEL } from './rich-toolbar-plugin-test-utils';
import { setupTest, screen, within } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

// jsdom's `Range` doesn't implement `getBoundingClientRect`, which Lexical's
// reconciler calls (to scroll the caret into view) whenever a collapsed
// selection commits while the editor root has focus — a path only exercised
// by tests that actually type into the editor while it's focused.
beforeAll(() => {
	if (typeof Range.prototype.getBoundingClientRect !== 'function') {
		Range.prototype.getBoundingClientRect = (): DOMRect =>
			({
				bottom: 0,
				height: 0,
				left: 0,
				right: 0,
				top: 0,
				width: 0,
				x: 0,
				y: 0,
				toJSON: () => ({})
			}) as DOMRect;
	}
});

const EDITOR_TESTID = 'edit-view-editor';
const ZEXTRAS_URL = 'https://www.zextras.com';
const LINK_URL = 'https://custom-link.com';
const LINK_EMAIL = 'someone@custom-link.com';
const OTHER_URL = 'https://other-link.com';
const REMOVE_LINK_LABEL = 'lexical-label.remove_link';
const UNLINKED_AUTO_LINK_CLASS = 'mails-unlinked-auto-link';

type TestUser = ReturnType<typeof setupTest>['user'];

function richTextOf(editorId: string): string {
	return useEditorsStore.getState().editors[editorId]?.text.richText ?? '';
}

function setupEditor(richText?: string): { editorId: string; user: TestUser } {
	const editor = generateNewMessageEditor();
	if (richText !== undefined) {
		editor.text = { plainText: '', richText };
	}
	setupEditorStore({ editors: [editor] });
	const { user } = setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);
	return { editorId: editor.id, user };
}

/** Removes the auto-detected link with the given text from its floating card. */
async function removeAutoLink(
	user: TestUser,
	editorElement: HTMLElement,
	text: string
): Promise<void> {
	await user.click(await within(editorElement).findByRole('link', { name: text }));
	await user.click(await screen.findByRole('button', { name: REMOVE_LINK_LABEL }));
	await waitFor(() => {
		expect(within(editorElement).queryByRole('link')).not.toBeInTheDocument();
	});
}

/**
 * Types `text` with the caret at the end of the removed link, through the same
 * selection insertion the editor runs for typed text (jsdom cannot place the caret
 * there with the pointer).
 */
function typeRightAfterRemovedLink(editorElement: HTMLElement, text: string): void {
	const editor = (editorElement as HTMLElement & { __lexicalEditor: LexicalEditor })
		.__lexicalEditor;
	act(() => {
		editor.update(
			() => {
				$dfs()
					.map(({ node }) => node)
					.find((node): node is AutoLinkNode => $isAutoLinkNode(node) && node.getIsUnlinked())
					?.selectEnd();
				$getSelection()?.insertText(text);
			},
			{ discrete: true }
		);
	});
}

describe('AutoLinkPlugin', () => {
	it.each([
		['a typed URL, once a space is typed after it', `${ZEXTRAS_URL} `, ZEXTRAS_URL],
		['a typed URL, once a new line is created after it', `${ZEXTRAS_URL}{Enter}`, ZEXTRAS_URL],
		['a scheme-less www. URL, prefixing it with https://', 'www.zextras.com ', ZEXTRAS_URL]
	])('turns %s into a link with href %s', async (_case, typed, expectedHref) => {
		const { editorId, user } = setupEditor();
		const editorElement = screen.getByTestId(EDITOR_TESTID);

		await user.click(editorElement);
		await user.type(editorElement, typed);

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain(`href="${expectedHref}"`);
		});
	});

	it.each([
		['a single-label domain', 'someone@zextras.com'],
		['a hyphenated domain', 'someone@my-domain.com'],
		['a multi-label domain', 'someone@domain.domain.fr'],
		['a deeply nested multi-label domain', 'someone@mail.sub.domain.co.uk']
	])('turns a typed email address with %s into a mailto link', async (_case, email) => {
		const { editorId, user } = setupEditor();
		const editorElement = screen.getByTestId(EDITOR_TESTID);

		await user.click(editorElement);
		await user.type(editorElement, `${email} `);

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain(`href="mailto:${email}"`);
		});
		// The whole address, including the last domain label, is inside the link.
		const doc = new DOMParser().parseFromString(richTextOf(editorId), 'text/html');
		// eslint-disable-next-line testing-library/no-node-access -- parsing the exported HTML string, not the rendered DOM
		expect(doc.querySelector('a')?.textContent).toBe(email);
	});

	describe('a removed auto-detected link', () => {
		it.each([
			['a path typed right after a URL', LINK_URL, '/docs'],
			['a letter typed right after an email address', LINK_EMAIL, 'x']
		])(
			'stays plain text with %s, also once the saved HTML is loaded again',
			async (_case, linkText, typed) => {
				const { editorId, user } = setupEditor(`<p>See ${linkText}</p>`);
				const editorElement = screen.getByTestId(EDITOR_TESTID);
				await removeAutoLink(user, editorElement, linkText);

				typeRightAfterRemovedLink(editorElement, typed);

				await waitFor(() => {
					expect(richTextOf(editorId)).toContain(typed);
				});
				expect(within(editorElement).queryByRole('link')).not.toBeInTheDocument();
				const savedHtml = richTextOf(editorId);
				cleanup();

				setupEditor(savedHtml);
				const reloadedEditor = screen.getByTestId(EDITOR_TESTID);
				expect(await within(reloadedEditor).findByText(`${linkText}${typed}`)).toBeVisible();
				expect(within(reloadedEditor).queryByRole('link')).not.toBeInTheDocument();
			}
		);

		it('stays plain text when the text typed right after it is formatted', async () => {
			const { user } = setupEditor(`<p>See ${LINK_URL}</p>`);
			const editorElement = screen.getByTestId(EDITOR_TESTID);
			await removeAutoLink(user, editorElement, LINK_URL);
			typeRightAfterRemovedLink(editorElement, '/docs');

			await user.click(editorElement);
			await user.keyboard('{Control>}a{/Control}');
			await user.click(screen.getByRole('button', { name: BOLD_LABEL }));

			expect(await within(editorElement).findByText(`${LINK_URL}/docs`)).toHaveClass(
				'mails-lexical-bold'
			);
			expect(within(editorElement).queryByRole('link')).not.toBeInTheDocument();
		});

		it.each([
			['text glued to it', `<span class="${UNLINKED_AUTO_LINK_CLASS}">${LINK_URL}</span>/docs`],
			[
				'text in two formats glued to it',
				`<span class="${UNLINKED_AUTO_LINK_CLASS}">${LINK_URL}</span>/do<b>cs</b>`
			],
			[
				'an email address glued to it',
				`<span class="${UNLINKED_AUTO_LINK_CLASS}">${LINK_URL}</span>b@custom-link.com`
			],
			[
				'another removed link glued to it',
				`<span class="${UNLINKED_AUTO_LINK_CLASS}">${LINK_URL}</span><span class="${UNLINKED_AUTO_LINK_CLASS}">${LINK_EMAIL}</span>`
			]
		])('stays plain text when it is loaded from HTML with %s', async (_case, html) => {
			setupEditor(`<p>${html} and ${OTHER_URL}</p>`);
			const editorElement = screen.getByTestId(EDITOR_TESTID);

			// The URL after a space was never removed: it is still auto-linked.
			const otherLink = await within(editorElement).findByRole('link', { name: OTHER_URL });
			expect(within(editorElement).getAllByRole('link')).toEqual([otherLink]);
		});
	});
});
