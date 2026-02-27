/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Sort direction literal types
 */
export type SortDirection = 'Asc' | 'Desc';

export type SortOptions =
	| 'date'
	| 'subj'
	| 'name'
	| 'rcpt'
	| 'attach'
	| 'flag'
	| 'priority'
	| 'id'
	| 'read'
	| 'changeDate'
	| 'size';

// template literal type
export type SortBy = `${SortOptions}${SortDirection}` | 'none';

export const SORT_BY = {
	none: 'none',
	dateAsc: 'dateAsc',
	dateDesc: 'dateDesc',
	subjAsc: 'subjAsc',
	subjDesc: 'subjDesc',
	nameAsc: 'nameAsc',
	nameDesc: 'nameDesc',
	rcptAsc: 'rcptAsc',
	rcptDesc: 'rcptDesc',
	attachAsc: 'attachAsc',
	attachDesc: 'attachDesc',
	flagAsc: 'flagAsc',
	flagDesc: 'flagDesc',
	priorityAsc: 'priorityAsc',
	priorityDesc: 'priorityDesc',
	idAsc: 'idAsc',
	idDesc: 'idDesc',
	readAsc: 'readAsc',
	readDesc: 'readDesc',
	changeDateAsc: 'changeDateAsc',
	changeDateDesc: 'changeDateDesc',
	sizeAsc: 'sizeAsc',
	sizeDesc: 'sizeDesc'
} as const satisfies Record<string, SortBy>;

/**
 * Represents a sorting option for messages/conversations
 */
export type SortOption = {
	label: string;
	value: SortOptions;
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
	sortType: SortOptions;
	sortDirection: SortDirection;
	filterType?: string;
};

/**
 * Represents the complete sort and filter state for a folder
 * Used in UI components for managing folder view preferences
 */
export type SortAndFilterState = {
	sortType: SortOptions;
	sortDirection: SortDirection;
	filterType: string | undefined;
};
