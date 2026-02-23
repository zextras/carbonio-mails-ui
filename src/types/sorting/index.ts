/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Sort direction literal types
 */
export type SortDirection = 'Asc' | 'Desc';

/**
 * Represents a sorting option for messages/conversations
 */
export type SortOption = {
	label: string;
	value: string;
};

/**
 * Represents a filter option for messages/conversations
 */
export type FilterOption = {
	label: string;
	value: string | undefined;
};

/**
 * Represents the folder sort order returned from parsing preferences
 */
export type FolderSortOrder = {
	sortType: string;
	sortDirection: SortDirection;
	filterType?: string;
};

/**
 * Represents the complete sort and filter state for a folder
 * Used in UI components for managing folder view preferences
 */
export type SortAndFilterState = {
	sortType: string;
	sortDirection: SortDirection;
	filterType: string | undefined;
};
