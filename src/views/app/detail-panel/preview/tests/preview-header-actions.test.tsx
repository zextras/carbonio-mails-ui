/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, within } from '@testing-library/react';
import { useTagStore } from '@zextras/carbonio-ui-commons';

import { PreviewHeaderActions } from '../parts/preview-header-actions';
import { setupTest } from '@test-setup';
import { TESTID_SELECTORS } from '__test__/constants';
import { generateMessage } from '__test__/generators/generateMessage';

const COLLAPSED_TAGS = 'collapsed-card-tags';

describe('PreviewHeaderActions', () => {
	beforeEach(() => {
		useTagStore.setState({
			tags: {
				'tag-1': { id: 'tag-1', name: 'Important', color: 1 },
				'tag-2': { id: 'tag-2', name: 'Work', color: 2 },
				'tag-3': { id: 'tag-3', name: 'Personal', color: 3 }
			}
		});
	});

	describe('Tags of a collapsed card', () => {
		it('should show nothing when the message has no tags', () => {
			const message = generateMessage({ tags: [] });

			setupTest(<PreviewHeaderActions message={message} open={false} isWide />);

			expect(screen.queryByTestId(COLLAPSED_TAGS)).not.toBeInTheDocument();
		});

		it('should show the only tag as a pill, without "+N"', () => {
			const message = generateMessage({ tags: ['tag-2'] });

			setupTest(<PreviewHeaderActions message={message} open={false} isWide />);

			const tags = screen.getByTestId(COLLAPSED_TAGS);
			expect(within(tags).getByTestId('tag-pill')).toHaveTextContent('Work');
			expect(within(tags).queryByText(/^\+/)).not.toBeInTheDocument();
		});

		it('should show the first tag in alphabetical order and "+N" for the others', () => {
			const message = generateMessage({ tags: ['tag-2', 'tag-1', 'tag-3'] });

			setupTest(<PreviewHeaderActions message={message} open={false} isWide />);

			const tags = screen.getByTestId(COLLAPSED_TAGS);
			expect(within(tags).getByTestId('tag-pill')).toHaveTextContent('Important');
			expect(within(tags).getByText('+2')).toBeInTheDocument();
		});

		it('should not be interactive', () => {
			const message = generateMessage({ tags: ['tag-1', 'tag-2'] });

			setupTest(<PreviewHeaderActions message={message} open={false} isWide />);

			const tags = screen.getByTestId(COLLAPSED_TAGS);
			expect(within(tags).queryByRole('button')).not.toBeInTheDocument();
		});

		it('should name every tag for screen readers', () => {
			const message = generateMessage({ tags: ['tag-2', 'tag-1', 'tag-3'] });

			setupTest(<PreviewHeaderActions message={message} open={false} isWide />);

			expect(screen.getByText('Tags: Important, Personal, Work')).toBeInTheDocument();
		});

		it('should not show the tags when the card is open: they are under the header', () => {
			const message = generateMessage({ tags: ['tag-1'] });

			setupTest(<PreviewHeaderActions message={message} open isWide />);

			expect(screen.queryByTestId(COLLAPSED_TAGS)).not.toBeInTheDocument();
		});

		it('should display the flag icon along with the tags', () => {
			const message = generateMessage({ isFlagged: true, tags: ['tag-1'] });

			setupTest(<PreviewHeaderActions message={message} open={false} isWide />);

			expect(screen.getByTestId(COLLAPSED_TAGS)).toBeInTheDocument();
			expect(screen.getByTestId(TESTID_SELECTORS.icons.flag)).toBeVisible();
		});
	});
});
