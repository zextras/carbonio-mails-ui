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
import { screen } from '@test-setup';

beforeAll(() => {
	installRangeRectPolyfill();
});

describe('RichToolbarPlugin - font and size selectors', () => {
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
