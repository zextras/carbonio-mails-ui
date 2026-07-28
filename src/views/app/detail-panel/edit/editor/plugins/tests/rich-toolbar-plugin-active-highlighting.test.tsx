/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	ALIGN_CENTER_LABEL,
	ALIGN_LEFT_LABEL,
	BOLD_LABEL,
	installRangeRectPolyfill,
	LINK_LABEL,
	LTR_LABEL,
	setupEditor,
	setupWithSelectedContent
} from './rich-toolbar-plugin-test-utils';
import { screen } from '@test-setup';

beforeAll(() => {
	installRangeRectPolyfill();
});

describe('RichToolbarPlugin - active option highlighting', () => {
	it('marks left alignment and ltr direction active by default', () => {
		setupEditor();

		expect(
			screen.getByRole('button', { name: ALIGN_LEFT_LABEL, pressed: true })
		).toBeInTheDocument();
		expect(screen.getByRole('button', { name: LTR_LABEL, pressed: true })).toBeInTheDocument();
		// Other alignments are not active.
		expect(
			screen.getByRole('button', { name: ALIGN_CENTER_LABEL, pressed: false })
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: 'lexical-label.align_right', pressed: false })
		).toBeInTheDocument();
	});

	it('does not expose a pressed state on plain action buttons', () => {
		setupEditor();

		// Action buttons (not toggles) carry no aria-pressed.
		expect(screen.getByRole('button', { name: LINK_LABEL })).not.toHaveAttribute('aria-pressed');
		expect(screen.getByRole('button', { name: 'lexical-label.image' })).not.toHaveAttribute(
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
