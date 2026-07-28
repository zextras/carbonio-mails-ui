/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	BOLD_LABEL,
	installRangeRectPolyfill,
	LINK_LABEL,
	PARAGRAPH_LABEL,
	setupEditor
} from './rich-toolbar-plugin-test-utils';
import { screen } from '@test-setup';

beforeAll(() => {
	installRangeRectPolyfill();
});

describe('RichToolbarPlugin - rendering', () => {
	it('renders the formatting controls', () => {
		setupEditor();

		expect(screen.getByRole('button', { name: BOLD_LABEL })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'lexical-label.italic' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'lexical-label.underline' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'lexical-label.strikethrough' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'lexical-label.align_left' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'lexical-label.bullet_list' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'lexical-label.numbered_list' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: LINK_LABEL })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'lexical-label.table' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'lexical-label.image' })).toBeInTheDocument();
	});

	it('renders the font, size and paragraph selectors', () => {
		setupEditor();

		// The three selects each render a chevron trigger...
		expect(screen.getAllByTestId('icon: ArrowDown')).toHaveLength(3);
		// ...and the paragraph selector shows its current block value.
		expect(screen.getAllByText(PARAGRAPH_LABEL).length).toBeGreaterThan(0);
	});
});
