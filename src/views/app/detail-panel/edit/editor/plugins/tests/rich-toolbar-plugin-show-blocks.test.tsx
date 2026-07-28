/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { installRangeRectPolyfill, setupEditor } from './rich-toolbar-plugin-test-utils';
import { screen } from '@test-setup';

beforeAll(() => {
	installRangeRectPolyfill();
});

describe('RichToolbarPlugin - show blocks', () => {
	it('renders the show blocks toggle inactive by default', () => {
		setupEditor();

		expect(
			screen.getByRole('button', { name: 'lexical-label.show_blocks', pressed: false })
		).toBeInTheDocument();
		expect(document.querySelector('.mails-lexical-show-blocks')).not.toBeInTheDocument();
	});

	it('toggles the block outlines view aid on and off', async () => {
		const { user } = setupEditor();
		const button = screen.getByRole('button', { name: 'lexical-label.show_blocks' });

		await user.click(button);

		expect(
			await screen.findByRole('button', { name: 'lexical-label.show_blocks', pressed: true })
		).toBeInTheDocument();
		expect(document.querySelector('.mails-lexical-show-blocks')).toBeInTheDocument();

		await user.click(button);

		expect(
			await screen.findByRole('button', { name: 'lexical-label.show_blocks', pressed: false })
		).toBeInTheDocument();
		expect(document.querySelector('.mails-lexical-show-blocks')).not.toBeInTheDocument();
	});
});
