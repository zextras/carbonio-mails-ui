/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Conversation } from '../conversations';
import { MailMessage } from '../messages';
import { SearchesStateType } from '../state';

export type SearchResults = {
	messages?: Array<MailMessage>;
	conversations?: Array<Conversation>;
	more: boolean;
	offset: number;
	sortBy: 'dateDesc' | 'dateAsc';
	query: Array<{
		label: string;
		value?: string;
		isGeneric?: boolean;
		isQueryFilter?: boolean;
		hasAvatar?: boolean;
	}>;
};

export type SearchListProps = {
	searchResults: SearchesStateType;
	search: (query: string, loadMore: boolean) => void;
	query: string;
	loading: boolean;
	filterCount: number;
	setShowAdvanceFilters: (show: boolean) => void;
	isInvalidQuery: boolean;
	searchDisabled: boolean;
};
