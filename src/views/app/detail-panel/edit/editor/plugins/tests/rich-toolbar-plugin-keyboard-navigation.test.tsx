/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable testing-library/no-node-access -- the roving group is made of heterogeneous elements without a shared role */
import { waitFor } from '@testing-library/react';

import {
	BOLD_LABEL,
	EDITOR_TESTID,
	installRangeRectPolyfill,
	setupEditor,
	SELECTED_TEXT
} from './rich-toolbar-plugin-test-utils';
import { screen, within } from '@test-setup';

beforeAll(() => {
	installRangeRectPolyfill();
});

const getToolbar = (): HTMLElement =>
	screen.getByRole('toolbar', { name: 'lexical-label.formatting_toolbar' });

/** All the controls of the roving group, in DOM order. */
const getToolbarItems = (): HTMLElement[] => {
	const candidates = Array.from(
		getToolbar().querySelectorAll<HTMLElement>('button, [tabindex]:not([aria-hidden="true"])')
	);
	return candidates.filter(
		(element) => !candidates.some((other) => other !== element && other.contains(element))
	);
};

const getTabStops = (): HTMLElement[] =>
	getToolbarItems().filter((item) => item.getAttribute('tabindex') === '0');

describe('RichToolbarPlugin - keyboard navigation', () => {
	it('exposes the controls as a labelled horizontal toolbar', () => {
		setupEditor();

		expect(getToolbar()).toHaveAttribute('aria-orientation', 'horizontal');
	});

	it('keeps the toolbar controls out of the Tab sequence', () => {
		setupEditor();

		expect(getTabStops()).toHaveLength(0);
		expect(screen.getByRole('button', { name: BOLD_LABEL })).toHaveAttribute('tabindex', '-1');
	});

	it('moves from the header fields straight to the editor body with Tab', async () => {
		const { user } = setupEditor();
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		await within(editorElement).findByText(SELECTED_TEXT);
		const header = document.createElement('input');
		document.body.prepend(header);
		header.focus();

		await user.tab();

		expect(editorElement).toHaveFocus();
		header.remove();
	});

	it('does not move the focus into the toolbar with Shift+Tab from the body', async () => {
		const { user } = setupEditor();
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		await within(editorElement).findByText(SELECTED_TEXT);
		editorElement.focus();

		await user.tab({ shift: true });

		expect(getToolbar()).not.toContainElement(document.activeElement as HTMLElement);
	});

	it('describes the editor body with the toolbar shortcut hint', async () => {
		setupEditor();
		const editorElement = screen.getByTestId(EDITOR_TESTID);

		await waitFor(() =>
			expect(editorElement).toHaveAccessibleDescription('lexical-label.toolbar_shortcut_hint')
		);
	});

	it('moves between controls with the arrow keys, wrapping around', async () => {
		const { user } = setupEditor();
		const items = getToolbarItems();
		const [first] = items;
		const last = items[items.length - 1];

		first.focus();
		await user.keyboard('{ArrowRight}');
		expect(items[1]).toHaveFocus();

		await user.keyboard('{ArrowLeft}');
		expect(first).toHaveFocus();

		await user.keyboard('{ArrowLeft}');
		expect(last).toHaveFocus();

		await user.keyboard('{ArrowRight}');
		expect(first).toHaveFocus();
	});

	it('jumps to the first and last control with Home and End', async () => {
		const { user } = setupEditor();
		const items = getToolbarItems();

		items[3].focus();
		await user.keyboard('{End}');
		expect(items[items.length - 1]).toHaveFocus();

		await user.keyboard('{Home}');
		expect(items[0]).toHaveFocus();
	});

	it('focuses the toolbar with Alt+F10 from the editor body', async () => {
		const { user } = setupEditor();
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		await within(editorElement).findByText(SELECTED_TEXT);
		await user.click(editorElement);

		await user.keyboard('{Alt>}{F10}{/Alt}');

		expect(getToolbarItems()[0]).toHaveFocus();

		await user.keyboard('{ArrowRight}{Escape}');
		await waitFor(() => expect(editorElement).toHaveFocus());

		await user.keyboard('{Alt>}{F10}{/Alt}');

		expect(getToolbarItems()[1]).toHaveFocus();
	});

	it('returns the focus to the editor body with Escape', async () => {
		const { user } = setupEditor();
		const editorElement = screen.getByTestId(EDITOR_TESTID);
		await within(editorElement).findByText(SELECTED_TEXT);

		screen.getByRole('button', { name: BOLD_LABEL }).focus();
		await user.keyboard('{Escape}');

		await waitFor(() => expect(editorElement).toHaveFocus());
	});

	it('keeps the controls activatable with the keyboard', async () => {
		const { user } = setupEditor();
		const boldButton = screen.getByRole('button', { name: BOLD_LABEL });

		boldButton.focus();
		await user.keyboard('{Enter}');

		expect(boldButton).toHaveAttribute('aria-pressed', 'true');
	});
});
