/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';
import { ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-ui-commons';

import { setupHook, setupTest } from '@test-setup';
import { populateTagsStore } from '@test-utils/store/tags';
import { useGetTagsAccordion } from 'hooks/use-get-tags-accordions';

const mockRunSearch = vi.fn();

vi.mock('@zextras/carbonio-ui-commons', async () => ({
	...(await vi.importActual('@zextras/carbonio-ui-commons')),
	useRunSearchIntegration: (): typeof mockRunSearch => mockRunSearch
}));

const renderTagItem = (tag: {
	id: string;
	name: string;
	color?: number;
	rgb?: string;
}): ReturnType<typeof setupTest> => {
	populateTagsStore({ [tag.id]: tag });
	const {
		result: { current: accordion }
	} = setupHook(useGetTagsAccordion);
	const [item] = accordion.items;
	const { CustomComponent } = item;
	return setupTest(<CustomComponent item={item} />);
};

describe('useGetTagsAccordion', () => {
	it('keeps the custom color of the tag on the accordion item', () => {
		populateTagsStore({ t1: { id: 't1', name: 'custom', rgb: '#abcdef' } });

		const {
			result: { current: accordion }
		} = setupHook(useGetTagsAccordion);

		expect(accordion.items[0]).toEqual(expect.objectContaining({ id: 't1', rgb: '#abcdef' }));
	});

	it('colors the tag icon with the custom color of the tag', () => {
		renderTagItem({ id: 't1', name: 'custom', rgb: '#abcdef' });

		expect(screen.getByTestId('icon: Tag')).toHaveStyleRule('color', '#abcdef');
	});

	it('colors the tag icon with the standard color of the tag', () => {
		renderTagItem({ id: 't1', name: 'standard', color: 4 });

		expect(screen.getByTestId('icon: Tag')).toHaveStyleRule('color', ZIMBRA_STANDARD_COLORS[4].hex);
	});

	it('triggers the search with the custom color of the tag', async () => {
		const { user } = renderTagItem({ id: 't1', name: 'custom', rgb: '#abcdef' });

		await user.click(screen.getByText('custom'));

		expect(mockRunSearch).toHaveBeenCalledWith(
			[expect.objectContaining({ avatarBackground: '#abcdef', label: 'tag:custom' })],
			'mails'
		);
	});
});
