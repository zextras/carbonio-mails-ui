/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { waitFor, within } from '@testing-library/react';

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

	it('renders each font option in its own typeface', async () => {
		const { user } = await setupWithSelectedContent();

		await openSelect(user, SELECT_INDEX.font);

		expect(await screen.findByText('Tahoma')).toHaveStyle({
			fontFamily: 'tahoma, arial, helvetica, sans-serif'
		});
		expect(screen.getByText('Georgia')).toHaveStyle({ fontFamily: 'georgia, palatino' });
		expect(screen.getByText('Wingdings')).not.toHaveStyle({
			fontFamily: 'wingdings, zapf dingbats'
		});
		expect(screen.getByText('Webdings')).not.toHaveStyle({ fontFamily: 'webdings' });
	});

	it('marks only the current font as bold in the open dropdown', async () => {
		const { user } = await setupWithSelectedContent();

		await openSelect(user, SELECT_INDEX.font);
		await user.click(await screen.findByText('Tahoma'));
		await openSelect(user, SELECT_INDEX.font);

		const options = await screen.findAllByTestId('dropdown-item');
		const tahoma = options.find((option) => within(option).queryByText('Tahoma') !== null);
		const georgia = options.find((option) => within(option).queryByText('Georgia') !== null);
		expect(tahoma).toBeDefined();
		expect(georgia).toBeDefined();
		expect(within(tahoma as HTMLElement).getByText('Tahoma')).toHaveStyle({ fontWeight: 700 });
		expect(within(georgia as HTMLElement).getByText('Georgia')).not.toHaveStyle({
			fontWeight: 700
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
