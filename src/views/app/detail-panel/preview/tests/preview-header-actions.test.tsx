/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';
import { Tag, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-ui-commons';

import { PreviewHeaderActions } from '../parts/preview-header-actions';
import { setupTest } from '@test-setup';
import { TESTID_SELECTORS } from '__test__/constants';
import { generateMessage } from '__test__/generators/generateMessage';

describe('PreviewHeaderActions', () => {
	const mockTags: Tag[] = [
		{
			id: 'tag-1',
			name: 'Important',
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			color: ZIMBRA_STANDARD_COLORS[1].hex
		},
		{
			id: 'tag-2',
			name: 'Work',
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			color: ZIMBRA_STANDARD_COLORS[2].hex
		},
		{
			id: 'tag-3',
			name: 'Personal',
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			color: ZIMBRA_STANDARD_COLORS[3].hex
		}
	];

	describe('Tag Icon Display', () => {
		it('should not display tag icon when there are no tags', () => {
			const message = generateMessage();

			setupTest(<PreviewHeaderActions message={message} tags={[]} open={false} isWide />);

			expect(screen.queryByTestId(TESTID_SELECTORS.icons.tag)).not.toBeInTheDocument();
		});

		it('should display tag icon when there is one tag', () => {
			const message = generateMessage();
			const singleTag = [mockTags[0]];

			setupTest(<PreviewHeaderActions message={message} tags={singleTag} open={false} isWide />);

			expect(screen.getByTestId(TESTID_SELECTORS.icons.tag)).toBeVisible();
		});

		it('should display multiple tags icon when there are multiple tags', () => {
			const message = generateMessage();

			setupTest(<PreviewHeaderActions message={message} tags={mockTags} open={false} isWide />);

			expect(screen.getByTestId(TESTID_SELECTORS.icons.tagsMore)).toBeVisible();
		});

		it('should display flag icon when message is flagged', () => {
			const message = generateMessage({ isFlagged: true });

			setupTest(<PreviewHeaderActions message={message} tags={[]} open={false} isWide />);

			expect(screen.getByTestId(TESTID_SELECTORS.icons.flag)).toBeVisible();
		});

		it('should display tag icon along with flag icon', () => {
			const message = generateMessage({ isFlagged: true });

			setupTest(
				<PreviewHeaderActions message={message} tags={[mockTags[0]]} open={false} isWide />
			);

			expect(screen.getByTestId(TESTID_SELECTORS.icons.tag)).toBeVisible();
			expect(screen.getByTestId(TESTID_SELECTORS.icons.flag)).toBeVisible();
		});
	});
});
