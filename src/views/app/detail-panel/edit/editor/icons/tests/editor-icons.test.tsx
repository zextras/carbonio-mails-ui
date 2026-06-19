/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { EDITOR_ICON_CONTENTS } from '../editor-icon-contents';
import { editorIcon } from '../editor-icons';
import { setupTest, screen } from '@test-setup';

describe('editorIcon', () => {
	it('builds a CDS-compatible svg component for a known icon name', () => {
		const BoldIcon = editorIcon('bold');

		setupTest(<BoldIcon data-testid="bold-icon" />);

		const svg = screen.getByTestId('bold-icon');
		expect(svg.tagName.toLowerCase()).toBe('svg');
		expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
		// The glyph markup from the registry is injected as the svg content.
		expect(EDITOR_ICON_CONTENTS.bold).toContain('<path');
		expect(svg.innerHTML).toContain('<path');
	});

	it('forwards the props injected by the design system onto the svg', () => {
		const ItalicIcon = editorIcon('italic');

		setupTest(<ItalicIcon data-testid="italic-icon" className="custom-class" width={32} />);

		const svg = screen.getByTestId('italic-icon');
		expect(svg).toHaveClass('custom-class');
		expect(svg).toHaveAttribute('width', '32');
	});

	it('memoizes the component so the same name yields a stable reference', () => {
		expect(editorIcon('underline')).toBe(editorIcon('underline'));
		expect(editorIcon('bold')).not.toBe(editorIcon('italic'));
	});

	it('sets a descriptive displayName', () => {
		expect(editorIcon('table').displayName).toBe('EditorIcon(table)');
	});
});
