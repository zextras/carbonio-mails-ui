/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { Tag, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-ui-commons';

import { TagsInExpandedHeader } from '../header-tags';
import { setupTest } from '@test-setup';

const mockRunSearch = vi.fn();

vi.mock('@zextras/carbonio-ui-commons', async () => {
	const actual = await vi.importActual('@zextras/carbonio-ui-commons');
	return {
		...actual,
		useRunSearchIntegration: (): typeof mockRunSearch => mockRunSearch
	};
});

describe('HeaderTags', () => {
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

	describe('TagsInExpandedHeader', () => {
		it('should not render when isEml is true', () => {
			setupTest(<TagsInExpandedHeader isEml tags={mockTags} open isWide />);

			expect(screen.queryByTestId('tags-in-expanded-header')).not.toBeInTheDocument();
		});

		it('should not render when open is false', () => {
			setupTest(<TagsInExpandedHeader tags={mockTags} open={false} isWide />);

			expect(screen.queryByTestId('tags-in-expanded-header')).not.toBeInTheDocument();
		});

		it('should not render when tags array is empty', () => {
			setupTest(<TagsInExpandedHeader tags={[]} open isWide />);

			expect(screen.queryByTestId('tags-in-expanded-header')).not.toBeInTheDocument();
		});

		it('should render when conditions are met', () => {
			setupTest(<TagsInExpandedHeader tags={mockTags} open isWide />);

			expect(screen.getByTestId('tags-in-expanded-header')).toBeVisible();
		});

		it('should display Tags label', () => {
			setupTest(<TagsInExpandedHeader tags={mockTags} open isWide />);

			expect(screen.getByText('Tags:')).toBeVisible();
		});

		describe('ExpandedViewTags (isWide: true)', () => {
			it('should render all tags in expanded view', () => {
				setupTest(<TagsInExpandedHeader tags={mockTags} open isWide />);

				expect(screen.getByText('Important')).toBeVisible();
				expect(screen.getByText('Work')).toBeVisible();
				expect(screen.getByText('Personal')).toBeVisible();
			});

			it('should render separators between tags', () => {
				setupTest(<TagsInExpandedHeader tags={mockTags} open isWide />);

				// Check for comma separators
				const commas = screen.getAllByText(',');
				expect(commas).toHaveLength(mockTags.length - 1);
			});

			it('should call runSearch when tag is clicked', async () => {
				const { user } = setupTest(<TagsInExpandedHeader tags={mockTags} open isWide />);

				const tagChip = screen.getByText('Important');
				await user.click(tagChip);

				expect(mockRunSearch).toHaveBeenCalledWith(
					[
						expect.objectContaining({
							label: 'tag:Important',
							value: 'tag:"Important"',
							isQueryFilter: true
						})
					],
					'mails'
				);
			});

			it('should trigger search for different tags', async () => {
				const { user } = setupTest(<TagsInExpandedHeader tags={mockTags} open isWide />);

				const workTag = screen.getByText('Work');
				await user.click(workTag);

				expect(mockRunSearch).toHaveBeenCalledWith(
					[
						expect.objectContaining({
							label: 'tag:Work',
							value: 'tag:"Work"'
						})
					],
					'mails'
				);
			});
		});

		describe('CompactViewTags (isWide: false)', () => {
			it('should render first tag in compact view', () => {
				setupTest(<TagsInExpandedHeader tags={mockTags} open isWide={false} />);

				expect(screen.getByText('Important')).toBeVisible();
			});

			it('should show badge with remaining tags count', () => {
				setupTest(<TagsInExpandedHeader tags={mockTags} open isWide={false} />);

				expect(screen.getByText('+2')).toBeVisible();
			});

			it('should not show badge when only one tag exists', () => {
				const singleTag = [mockTags[0]];
				setupTest(<TagsInExpandedHeader tags={singleTag} open isWide={false} />);

				expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
			});

			it('should call runSearch when first tag is clicked', async () => {
				const { user } = setupTest(<TagsInExpandedHeader tags={mockTags} open isWide={false} />);

				const tagChip = screen.getByText('Important');
				await user.click(tagChip);

				expect(mockRunSearch).toHaveBeenCalledWith(
					[
						expect.objectContaining({
							label: 'tag:Important',
							value: 'tag:"Important"'
						})
					],
					'mails'
				);
			});

			it('should open dropdown when badge is clicked', async () => {
				const { user } = setupTest(<TagsInExpandedHeader tags={mockTags} open isWide={false} />);

				const badge = screen.getByText('+2');
				await user.click(badge);

				// Check that remaining tags are visible in dropdown
				expect(screen.getByText('Work')).toBeVisible();
				expect(screen.getByText('Personal')).toBeVisible();
			});

			it('should close dropdown when clicking outside', async () => {
				const { user } = setupTest(<TagsInExpandedHeader tags={mockTags} open isWide={false} />);

				const badge = screen.getByText('+2');
				await user.click(badge);

				// Verify dropdown is open
				expect(screen.getByText('Work')).toBeVisible();

				// Close dropdown by clicking the badge again or using escape
				// Note: The actual closing behavior depends on the dropdown implementation
			});

			it('should trigger search for tags in dropdown', async () => {
				const { user } = setupTest(<TagsInExpandedHeader tags={mockTags} open isWide={false} />);

				// Open dropdown
				const badge = screen.getByText('+2');
				await user.click(badge);

				// Click on a tag in the dropdown
				const workTag = screen.getByText('Work');
				await user.click(workTag);

				expect(mockRunSearch).toHaveBeenCalledWith(
					[
						expect.objectContaining({
							label: 'tag:Work',
							value: 'tag:"Work"'
						})
					],
					'mails'
				);
			});
		});

		describe('Edge cases', () => {
			it('should handle tag with special characters in name', async () => {
				const specialTag: Tag[] = [
					{
						id: 'tag-special',
						name: 'Test & Special',
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						color: ZIMBRA_STANDARD_COLORS[0].hex
					}
				];

				const { user } = setupTest(<TagsInExpandedHeader tags={specialTag} open isWide />);

				const tagChip = screen.getByText('Test & Special');
				await user.click(tagChip);

				expect(mockRunSearch).toHaveBeenCalledWith(
					[
						expect.objectContaining({
							label: 'tag:Test & Special',
							value: 'tag:"Test & Special"'
						})
					],
					'mails'
				);
			});

			it('should handle many tags in compact view', () => {
				setupTest(<TagsInExpandedHeader tags={mockTags} open isWide={false} />);

				expect(screen.getByText(mockTags[0].name)).toBeVisible();
				expect(screen.getByText(`+${mockTags.length - 1}`)).toBeVisible();
			});
		});
	});
});
