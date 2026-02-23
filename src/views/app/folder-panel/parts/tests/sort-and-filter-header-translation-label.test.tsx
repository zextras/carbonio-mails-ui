/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import type { Mock } from 'vitest';

import { parseMessageSortingOptions } from '../../../../../helpers/parseMessageSortingOptions';
import { SortAndFilterHeaderComponent } from '../sort-and-filter-header-component';
import { screen, setupTest } from '@test-setup';
import { FILTER_OPTIONS, SORTING_OPTIONS } from 'constants/index';

const FOLDER_ID = 'test-folder';

vi.mock('helpers/sorting', async () => ({
	...(await vi.importActual('helpers/sorting')),
	updateSortAndFilterSettings: vi.fn()
}));
vi.mock('helpers/parseMessageSortingOptions');

describe('getTranslatedSortFilterLabel integration', () => {
	beforeAll(() => {
		// mock t to simply return the key for easier testing
		vi.mock('react-i18next', async () => ({
			...(await vi.importActual('react-i18next')),
			useTranslation: (): Array<(key: string) => string> => [
				(key: string): string => key // Return the translation key as the translation
			],
			Trans: ({ children }: { children: React.ReactNode }): React.ReactNode => children,
			I18nextProvider: ({ children }: { children: React.ReactNode }): React.ReactNode => children
		}));
	});

	it('should display translated sort label for changeDate option', () => {
		(parseMessageSortingOptions as Mock).mockReturnValue({
			sortType: SORTING_OPTIONS.changeDate.value,
			filterType: undefined
		});
		setupTest(<SortAndFilterHeaderComponent folderId={FOLDER_ID} />);

		expect(screen.getByText('label.sort_by: sorting_dropdown.last_modified')).toBeInTheDocument();
	});

	it('should display translated sort label for subject option', () => {
		(parseMessageSortingOptions as Mock).mockReturnValue({
			sortType: SORTING_OPTIONS.subject.value,
			filterType: undefined
		});
		setupTest(<SortAndFilterHeaderComponent folderId={FOLDER_ID} />);

		expect(screen.getByText('label.sort_by: sorting_dropdown.subject')).toBeInTheDocument();
	});

	it('should display translated filter label for unread option', () => {
		(parseMessageSortingOptions as Mock).mockReturnValue({
			sortType: SORTING_OPTIONS.date.value,
			filterType: FILTER_OPTIONS.unread.value
		});
		setupTest(<SortAndFilterHeaderComponent folderId={FOLDER_ID} />);

		expect(
			screen.getByText('label.sort_by: sorting_dropdown.date - label.show: sorting_dropdown.unread')
		).toBeInTheDocument();
	});

	it('should display both sort and filter labels separated by hyphen', () => {
		(parseMessageSortingOptions as Mock).mockReturnValue({
			sortType: SORTING_OPTIONS.subject.value,
			filterType: FILTER_OPTIONS.flagged.value
		});
		setupTest(<SortAndFilterHeaderComponent folderId={FOLDER_ID} />);

		expect(
			screen.getByText(
				'label.sort_by: sorting_dropdown.subject - label.show: sorting_dropdown.flagged'
			)
		).toBeInTheDocument();
	});

	it('should handle space-to-underscore conversion in translation keys', () => {
		(parseMessageSortingOptions as Mock).mockReturnValue({
			sortType: SORTING_OPTIONS.from.value,
			filterType: undefined
		});
		setupTest(<SortAndFilterHeaderComponent folderId={FOLDER_ID} />);

		expect(screen.getByText('label.sort_by: sorting_dropdown.from')).toBeInTheDocument();
	});

	it('should display translated labels for multiple filter options', () => {
		(parseMessageSortingOptions as Mock).mockReturnValue({
			sortType: SORTING_OPTIONS.date.value,
			filterType: FILTER_OPTIONS.unread.value
		});
		setupTest(<SortAndFilterHeaderComponent folderId={FOLDER_ID} />);

		expect(
			screen.getByText('label.sort_by: sorting_dropdown.date - label.show: sorting_dropdown.unread')
		).toBeInTheDocument();
	});

	it('should not display filter label when filter is undefined', () => {
		(parseMessageSortingOptions as Mock).mockReturnValue({
			sortType: SORTING_OPTIONS.subject.value,
			filterType: undefined
		});
		setupTest(<SortAndFilterHeaderComponent folderId={FOLDER_ID} />);

		expect(screen.queryByText(/Show:/i)).not.toBeInTheDocument();
		expect(screen.getByText('label.sort_by: sorting_dropdown.subject')).toBeInTheDocument();
	});

	describe('corner cases', () => {
		it('should handle empty string sortType gracefully', () => {
			(parseMessageSortingOptions as Mock).mockReturnValue({
				sortType: '',
				filterType: undefined
			});
			setupTest(<SortAndFilterHeaderComponent folderId={FOLDER_ID} />);

			expect(screen.queryByTestId('sorting-options-container')).not.toBeInTheDocument();
		});

		it('should handle null sortType gracefully', () => {
			(parseMessageSortingOptions as Mock).mockReturnValue({
				sortType: null,
				filterType: undefined
			});
			setupTest(<SortAndFilterHeaderComponent folderId={FOLDER_ID} />);

			expect(screen.queryByTestId('sorting-options-container')).not.toBeInTheDocument();
		});

		it('should handle undefined sortType gracefully', () => {
			(parseMessageSortingOptions as Mock).mockReturnValue({
				sortType: undefined,
				filterType: undefined
			});
			setupTest(<SortAndFilterHeaderComponent folderId={FOLDER_ID} />);

			expect(screen.queryByTestId('sorting-options-container')).not.toBeInTheDocument();
		});

		it('should handle unknown sortType value', () => {
			(parseMessageSortingOptions as Mock).mockReturnValue({
				sortType: 'unknown_sort_type',
				filterType: undefined
			});
			setupTest(<SortAndFilterHeaderComponent folderId={FOLDER_ID} />);

			expect(screen.queryByTestId('sorting-options-container')).not.toBeInTheDocument();
		});

		it('should handle unknown filterType value', () => {
			(parseMessageSortingOptions as Mock).mockReturnValue({
				sortType: SORTING_OPTIONS.subject.value,
				filterType: 'unknown_filter_type'
			});
			setupTest(<SortAndFilterHeaderComponent folderId={FOLDER_ID} />);

			// Should render with just sort label (filter is invalid so defaults to undefined)
			expect(screen.getByTestId('sorting-options-container')).toBeInTheDocument();
			expect(screen.getByText('label.sort_by: sorting_dropdown.subject')).toBeInTheDocument();
			expect(screen.queryByText(/label.show:/i)).not.toBeInTheDocument();
		});

		it('should handle labels with spaces correctly', () => {
			(parseMessageSortingOptions as Mock).mockReturnValue({
				sortType: SORTING_OPTIONS.changeDate.value, // 'last modified' has one space
				filterType: undefined
			});
			setupTest(<SortAndFilterHeaderComponent folderId={FOLDER_ID} />);

			// Should convert 'last modified' to 'last_modified'
			expect(screen.getByText('label.sort_by: sorting_dropdown.last_modified')).toBeInTheDocument();
		});
	});
});
