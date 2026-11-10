/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { cleanup, waitFor } from '@testing-library/react';

import { installRangeRectPolyfill, LINK_LABEL } from './rich-toolbar-plugin-test-utils';
import { setupTest, screen, within } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

const LINK_URL = 'https://custom-link.com';
const LINK_TEXT = 'lexical';
const EDITOR_TESTID = 'edit-view-editor';
const EDIT_LINK_LABEL = 'lexical-label.edit_link';
const REMOVE_LINK_LABEL = 'lexical-label.remove_link';
const RESTORE_LINK_LABEL = 'lexical-label.restore_link';
const LINK_EMAIL = 'someone@custom-link.com';
const UNLINKED_AUTO_LINK_CLASS = 'mails-unlinked-auto-link';
const URL_LABEL = 'lexical-label.url';
const TEXT_TO_DISPLAY_LABEL = 'lexical-label.text_to_display';
const SAVE_LABEL = 'label.save';
const NEW_LINK_TEXT = 'test';
// Built at runtime so the source holds no script URL literal.
const SCRIPT_URL = ['javascript', 'void(0)//'].join(':');
const UNSAFE_URL_REPLACEMENT = 'about:blank';

// Attributes the saved HTML can do without: the import relies only on these three.
const ATTRIBUTES_OTHER_THAN_CLASS_STYLE_HREF = /\s(?!(?:class|style|href)=)[\w-]+="[^"]*"/g;

type TestUser = ReturnType<typeof setupTest>['user'];

// jsdom's `Range` has no `getBoundingClientRect`, which Lexical calls to scroll the
// caret into view when a collapsed selection commits while the editor has focus.
beforeAll(() => {
	installRangeRectPolyfill();
});

function richTextOf(editorId: string): string {
	return useEditorsStore.getState().editors[editorId]?.text.richText ?? '';
}

/** Renders the editor on the given content, or on the default new message body when omitted. */
function setupEditor(richText?: string): { editorId: string; user: TestUser } {
	const editor = generateNewMessageEditor();
	if (richText !== undefined) {
		editor.text = { plainText: LINK_TEXT, richText };
	}
	setupEditorStore({ editors: [editor] });
	const { user } = setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);
	return { editorId: editor.id, user };
}

/** Renders the editor on a single-link paragraph and returns the rendered link element. */
async function setupWithLink(): Promise<{
	editorId: string;
	user: TestUser;
	link: HTMLElement;
}> {
	const { editorId, user } = setupEditor(`<p><a href="${LINK_URL}">${LINK_TEXT}</a></p>`);
	const editorElement = screen.getByTestId(EDITOR_TESTID);
	const link = await within(editorElement).findByText(LINK_TEXT);
	return { editorId, user, link };
}

/** Parses the exported rich text and returns its links as href/text pairs. */
function linksOf(editorId: string): Array<{ href: string | null; text: string | null }> {
	const doc = new DOMParser().parseFromString(richTextOf(editorId), 'text/html');
	return Array.from(doc.querySelectorAll('a')).map((anchor) => ({
		href: anchor.getAttribute('href'),
		text: anchor.textContent
	}));
}

/** Opens the edit modal from the floating card, replaces the text to display and saves. */
async function editLinkText(user: TestUser, link: HTMLElement, text: string): Promise<void> {
	await user.click(link);
	await user.click(await screen.findByRole('button', { name: EDIT_LINK_LABEL }));
	const textInput = await screen.findByRole('textbox', { name: TEXT_TO_DISPLAY_LABEL });
	await user.clear(textInput);
	await user.type(textInput, text);
	await user.click(screen.getByRole('button', { name: SAVE_LABEL }));
}

/** Renders the editor on a paragraph with the given text, auto-detected as a link, and removes the link. */
async function setupWithRemovedAutoLink(
	innerHtml: string,
	text: string
): Promise<{ editorId: string; user: TestUser; editorElement: HTMLElement }> {
	const { editorId, user } = setupEditor(`<p>${innerHtml}</p>`);
	const editorElement = screen.getByTestId(EDITOR_TESTID);
	await user.click(await within(editorElement).findByRole('link', { name: text }));
	await user.click(await screen.findByRole('button', { name: REMOVE_LINK_LABEL }));
	await waitFor(() => {
		expect(richTextOf(editorId)).not.toContain('<a');
	});
	return { editorId, user, editorElement };
}

describe('FloatingLinkEditorPlugin', () => {
	it('does not show the floating editor until the link is hovered or pressed', async () => {
		const { user } = await setupWithLink();
		const editorElement = screen.getByTestId(EDITOR_TESTID);

		// Selecting the content (without touching the link) must not reveal the card.
		await user.click(editorElement);
		await user.keyboard('{Control>}a{/Control}');

		expect(screen.queryByRole('button', { name: EDIT_LINK_LABEL })).not.toBeInTheDocument();
	});

	it('shows the floating editor with the URL when the link is hovered', async () => {
		const { user, link } = await setupWithLink();

		await user.hover(link);

		expect(await screen.findByRole('link', { name: LINK_URL })).toHaveAttribute('href', LINK_URL);
		expect(screen.getByRole('button', { name: EDIT_LINK_LABEL })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: REMOVE_LINK_LABEL })).toBeInTheDocument();
	});

	it('keeps the card visible for a grace period after the pointer leaves the link', async () => {
		const { user, link } = await setupWithLink();

		await user.hover(link);
		await screen.findByRole('button', { name: EDIT_LINK_LABEL });

		await user.unhover(link);

		// Right after leaving the link the card is still there: hiding is delayed
		// so the pointer can travel from the link to the card.
		expect(screen.getByRole('button', { name: EDIT_LINK_LABEL })).toBeInTheDocument();
		// Once the grace period expires without reaching the card, it hides.
		await waitFor(
			() => {
				expect(screen.queryByRole('button', { name: EDIT_LINK_LABEL })).not.toBeInTheDocument();
			},
			{ timeout: 2000 }
		);
	});

	it('does not hide the card while the pointer hovers the card itself', async () => {
		const { user, link } = await setupWithLink();

		await user.hover(link);
		const editButton = await screen.findByRole('button', { name: EDIT_LINK_LABEL });

		await user.unhover(link);
		await user.hover(editButton);

		// Wait well past the grace period: hovering the card cancels the hide.
		await new Promise((resolve) => {
			setTimeout(resolve, 800);
		});
		expect(screen.getByRole('button', { name: EDIT_LINK_LABEL })).toBeInTheDocument();
	});

	it('removes the link when the remove action is clicked', async () => {
		const { editorId, user, link } = await setupWithLink();

		await user.click(link);
		await user.click(await screen.findByRole('button', { name: REMOVE_LINK_LABEL }));

		await waitFor(() => {
			expect(richTextOf(editorId)).not.toContain('<a');
		});
		// The text content is preserved after the link is removed.
		expect(richTextOf(editorId)).toContain(LINK_TEXT);
	});

	it('opens the edit modal pre-filled when the edit action is clicked', async () => {
		const { user, link } = await setupWithLink();

		await user.click(link);
		await user.click(await screen.findByRole('button', { name: EDIT_LINK_LABEL }));

		expect(await screen.findByText('lexical-label.insert_edit_link')).toBeInTheDocument();
		expect(screen.getByRole('textbox', { name: URL_LABEL })).toHaveValue(LINK_URL);
		expect(screen.getByRole('textbox', { name: 'lexical-label.text_to_display' })).toHaveValue(
			LINK_TEXT
		);
	});

	it.each([
		['URL', LINK_URL],
		['email address', LINK_EMAIL]
	])(
		'keeps an auto-detected %s removed instead of re-creating the link from its text',
		async (_case, text) => {
			const { editorId, editorElement } = await setupWithRemovedAutoLink(text, text);

			expect(within(editorElement).queryByRole('link')).not.toBeInTheDocument();
			expect(richTextOf(editorId)).not.toContain('<a');
			expect(richTextOf(editorId)).toContain(text);
			expect(screen.queryByRole('button', { name: REMOVE_LINK_LABEL })).not.toBeInTheDocument();
		}
	);

	it('keeps an auto-detected link removed, with its formatting, after the saved HTML is loaded again', async () => {
		const { editorId } = await setupWithRemovedAutoLink(`<b>${LINK_URL}</b>`, LINK_URL);
		const savedHtml = richTextOf(editorId).replaceAll(ATTRIBUTES_OTHER_THAN_CLASS_STYLE_HREF, '');
		expect(savedHtml).toContain(UNLINKED_AUTO_LINK_CLASS);
		cleanup();

		const { editorId: reloadedEditorId } = setupEditor(savedHtml);
		const reloadedEditor = screen.getByTestId(EDITOR_TESTID);
		const text = await within(reloadedEditor).findByText(LINK_URL);
		expect(within(reloadedEditor).queryByRole('link')).not.toBeInTheDocument();
		expect(text).toHaveClass('mails-lexical-bold');
		expect(richTextOf(reloadedEditorId)).not.toContain('<a');
	});

	it('restores the link of an auto-detected URL that was removed', async () => {
		const { editorId, user, editorElement } = await setupWithRemovedAutoLink(LINK_URL, LINK_URL);

		// The removed link is plain text: pressing it offers only to restore the link.
		await user.click(within(editorElement).getByText(LINK_URL));
		const restoreButton = await screen.findByRole('button', { name: RESTORE_LINK_LABEL });
		expect(screen.queryByRole('button', { name: EDIT_LINK_LABEL })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: REMOVE_LINK_LABEL })).not.toBeInTheDocument();
		await user.click(restoreButton);

		expect(await within(editorElement).findByRole('link', { name: LINK_URL })).toBeInTheDocument();
		await waitFor(() => {
			expect(richTextOf(editorId)).toContain(`href="${LINK_URL}"`);
		});
		expect(richTextOf(editorId)).not.toContain(UNLINKED_AUTO_LINK_CLASS);
	});

	it('imports a marked span whose text is not a link as plain content, not as a removed link', async () => {
		const { editorId, user } = setupEditor(
			`<p><span class="${UNLINKED_AUTO_LINK_CLASS}"><a href="${LINK_URL}">${SCRIPT_URL}</a></span></p>`
		);
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		const innerLink = await within(editorElement).findByRole('link', { name: SCRIPT_URL });

		// The element around the inner link is where a removed link would be.
		// eslint-disable-next-line testing-library/no-node-access -- the outer element has no role or text of its own
		await user.hover(innerLink.parentElement ?? innerLink);
		expect(screen.queryByRole('button', { name: RESTORE_LINK_LABEL })).not.toBeInTheDocument();

		// Edit the body so the content is exported again.
		await user.click(editorElement);
		await user.keyboard('x');
		await waitFor(() => {
			expect(linksOf(editorId)).toEqual([expect.objectContaining({ href: LINK_URL })]);
		});
		expect(richTextOf(editorId)).not.toContain(UNLINKED_AUTO_LINK_CLASS);
	});

	it('restores a removed link loaded from HTML with the URL derived from its text', async () => {
		const linkText = 'www.custom-link.com';
		const { editorId, user } = setupEditor(
			`<p><span class="${UNLINKED_AUTO_LINK_CLASS}"><a href="${LINK_URL}">${linkText}</a></span></p>`
		);
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		const innerLink = await within(editorElement).findByRole('link', { name: linkText });

		// The text sits in an inner link: open the card of the removed link from its own element.
		// eslint-disable-next-line testing-library/no-node-access -- the outer element has no role or text of its own
		await user.hover(innerLink.parentElement ?? innerLink);
		await user.click(await screen.findByRole('button', { name: RESTORE_LINK_LABEL }));

		// The restored link wraps the inner one: HTML cannot nest links, so it is exported empty.
		await waitFor(() => {
			expect(linksOf(editorId)).toContainEqual(
				expect.objectContaining({ href: `https://${linkText}` })
			);
		});
		expect(richTextOf(editorId)).not.toContain(UNSAFE_URL_REPLACEMENT);
	});

	it('does not put an unsafe URL in the link of the floating card', async () => {
		const { user } = setupEditor(`<p><a href="${SCRIPT_URL}">${LINK_TEXT}</a></p>`);
		const editorElement = screen.getByTestId(EDITOR_TESTID);

		await user.hover(await within(editorElement).findByText(LINK_TEXT));

		// The card shows the URL as it is, but does not link it.
		expect(await screen.findByRole('link', { name: SCRIPT_URL })).toHaveAttribute(
			'href',
			UNSAFE_URL_REPLACEMENT
		);
	});

	it('shows the restore card while the pointer hovers the text of a removed auto-detected link', async () => {
		const { user, editorElement } = await setupWithRemovedAutoLink(LINK_URL, LINK_URL);

		await user.hover(within(editorElement).getByText(LINK_URL));

		expect(await screen.findByRole('button', { name: RESTORE_LINK_LABEL })).toBeInTheDocument();
	});

	it('keeps the link with its URL when the text to display is changed', async () => {
		const { editorId, user, link } = await setupWithLink();

		await editLinkText(user, link, NEW_LINK_TEXT);

		await waitFor(() => {
			expect(linksOf(editorId)).toEqual([{ href: LINK_URL, text: NEW_LINK_TEXT }]);
		});
	});

	it('keeps an auto-detected link with its URL when the text to display is changed', async () => {
		const { editorId, user } = setupEditor(`<p>${LINK_URL}</p>`);
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		const link = await within(editorElement).findByRole('link', { name: LINK_URL });

		await editLinkText(user, link, NEW_LINK_TEXT);

		await waitFor(() => {
			expect(linksOf(editorId)).toEqual([{ href: LINK_URL, text: NEW_LINK_TEXT }]);
		});
	});

	it('turns a removed auto-detected link into a link again when it is saved from the link modal', async () => {
		const { editorId, user, editorElement } = await setupWithRemovedAutoLink(LINK_URL, LINK_URL);

		// Put the caret inside the removed link and open the toolbar link modal.
		await user.click(editorElement);
		await user.keyboard('{Control>}a{/Control}');
		await user.click(screen.getByRole('button', { name: LINK_LABEL }));
		expect(await screen.findByRole('textbox', { name: URL_LABEL })).toHaveValue(LINK_URL);
		await user.click(screen.getByRole('button', { name: SAVE_LABEL }));

		expect(await within(editorElement).findByRole('link', { name: LINK_URL })).toBeInTheDocument();
		await waitFor(() => {
			expect(linksOf(editorId)).toEqual([{ href: LINK_URL, text: LINK_URL }]);
		});
		expect(richTextOf(editorId)).not.toContain(UNLINKED_AUTO_LINK_CLASS);
	});

	it('opens the edit modal pre-filled from a hovered link while the caret is elsewhere', async () => {
		const { user } = setupEditor(
			`<p>${LINK_TEXT}</p><p><a href="${LINK_URL}">${NEW_LINK_TEXT}</a></p>`
		);
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		const link = await within(editorElement).findByRole('link', { name: NEW_LINK_TEXT });
		// Put the caret in the first paragraph, outside the link.
		await user.click(within(editorElement).getByText(LINK_TEXT));

		await user.hover(link);
		await user.click(await screen.findByRole('button', { name: EDIT_LINK_LABEL }));

		expect(await screen.findByRole('textbox', { name: URL_LABEL })).toHaveValue(LINK_URL);
		expect(screen.getByRole('textbox', { name: TEXT_TO_DISPLAY_LABEL })).toHaveValue(NEW_LINK_TEXT);
	});

	it('keeps a link typed in the body with its URL when the text to display is changed', async () => {
		const { editorId, user } = setupEditor();
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		await user.click(editorElement);
		await user.type(editorElement, `${LINK_URL} `);
		const link = await within(editorElement).findByRole('link', { name: LINK_URL });

		await editLinkText(user, link, NEW_LINK_TEXT);

		await waitFor(() => {
			expect(linksOf(editorId)).toEqual([{ href: LINK_URL, text: NEW_LINK_TEXT }]);
		});
	});

	it('opens the edit modal of an auto-created link with the new window option selected', async () => {
		const { user } = setupEditor();
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		await user.click(editorElement);
		await user.type(editorElement, `${LINK_URL} `);
		const link = await within(editorElement).findByRole('link', { name: LINK_URL });

		await user.click(link);
		await user.click(await screen.findByRole('button', { name: EDIT_LINK_LABEL }));

		expect(await screen.findByText('lexical-label.new_window')).toBeInTheDocument();
		expect(screen.queryByText('lexical-label.current_window')).not.toBeInTheDocument();
	});
});
