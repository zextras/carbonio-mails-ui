/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { waitFor } from '@testing-library/react';

import {
	installRangeRectPolyfill,
	openSelect,
	richTextOf,
	SELECT_INDEX,
	setupWithSelectedContent
} from './rich-toolbar-plugin-test-utils';
import { screen, within } from '@test-setup';

beforeAll(() => {
	installRangeRectPolyfill();
});

export const headingSelector = (editorElement: HTMLElement, level: number) =>
	within(editorElement).getByRole('heading', { level });

describe('RichToolbarPlugin - block styles and lists', () => {
	it('turns the selection into a heading', async () => {
		const { editorElement, user } = await setupWithSelectedContent();

		await openSelect(user, SELECT_INDEX.paragraph);
		await user.click(await screen.findByText('lexical-label.heading_1'));

		expect(headingSelector(editorElement, 1)).toBeInTheDocument();
	});

	it('turns the selection into a blockquote', async () => {
		const { editorId, user } = await setupWithSelectedContent();

		await openSelect(user, SELECT_INDEX.paragraph);
		await user.click(await screen.findByText('lexical-label.blockquote'));

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('<blockquote');
		});
	});

	it('inserts a bulleted list', async () => {
		const { editorId, user } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: 'lexical-label.bullet_list' }));

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('<ul');
		});
	});

	it('inserts a numbered list', async () => {
		const { editorId, user } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: 'lexical-label.numbered_list' }));

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('<ol');
		});
	});
});
