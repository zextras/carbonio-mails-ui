/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ChipProps, ChipItem } from '@zextras/carbonio-design-system';
import type { QueryChip } from '@zextras/carbonio-search-ui';
import { SortBy } from '@zextras/carbonio-ui-commons';
import API_REQUEST_STATUS from 'constants';

import { NormalizedConversation } from 'types/conversations';
import { IncompleteMessage, MailMessage } from 'types/messages';
import type { Query } from 'views/search/types/types';

type ApiRequestStatusKey = keyof typeof API_REQUEST_STATUS;
export type SearchRequestStatus = (typeof API_REQUEST_STATUS)[ApiRequestStatusKey] | null;

export type SearchListProps = {
	searchResults: Array<string>;
	query: string;
	loading: boolean;
	isInvalidQuery: boolean;
	hasMore?: boolean;
	searchResultsStatus?: SearchRequestStatus;
};

export type SearchChipItem = ChipItem & {
	isGeneric?: boolean;
	isQueryFilter?: boolean;
	hasError?: boolean;
};

export type SearchPanelProps = {
	searchResults: SearchIndexSliceState['searchIndexSlice'];
	query: Array<QueryChip>;
};

export type AdvancedFilterButtonProps = {
	query: Query;
	isSharedFolderIncluded: boolean;
	onSearchConfirm: (options: { query: Query; includeSharedFolders: boolean }) => void;
	invalidQueryTooltip?: string;
};

export type ChipOnAddItem = {
	label: string;
	icon?: string;
	searchString: string;
};

export type ChipOnAddProps = {
	items: Array<{
		label: string;
		icon?: string;
		searchString: string;
	}>;
	label: string;
	preText: string;
	hasAvatar: boolean;
	isGeneric: boolean;
	isQueryFilter: boolean;
};

export type Contact = {
	_id?: string;
	/* Zimbra ID */ id: string;
	tags?: string[];
	firstName: string;
	middleName: string;
	lastName: string;
	nickName: string;
	parent: string;
	address: unknown;
	company: string;
	department: string;
	email: unknown;
	image: string;
	jobTitle: string;
	notes: string;
	phone: unknown;
	nameSuffix: string;
	namePrefix: string;
	URL: unknown;
	fileAsStr: string;
	avatarBackground?: ChipProps['background'];
};

export type ContactInputContact = Partial<Omit<Contact, 'email'>> & { email?: string };

export type ContactInputItem = ChipItem &
	ContactInputContact & {
		email?: Contact['email'];
		address?: string | Contact['address'];
		fullName?: string;
		name?: string;
		display?: string;
		isGroup?: boolean;
		groupId?: string;
	};

export type ChipOnAdd = ChipItem & {
	label: string;
	hasAvatar: boolean;
	isGeneric: boolean;
	isQueryFilter: boolean;
	value: string;
	avatarIcon: string;
};

export type ChipType = {
	label: string;
	hasAvatar?: boolean;
	value?: string;
	isQueryFilter?: boolean;
	isGeneric?: boolean;
	avatarIcon?: string;
	avatarBackground?: ChipProps['background'];
	hasError?: boolean;
};

export type ErrorType = {
	code: string;
	description?: string;
};

export type SearchIndexSliceState = {
	searchIndexSlice: {
		conversationListIndex: Array<string>;
		messageListIndex: Array<string>;
		more: boolean;
		offset: number;
		sortBy?: SortBy;
		query?: string;
		status: SearchRequestStatus;
		parent?: string;
		tagName?: string;
		error?: ErrorType;
	};
};

export type MessageIndexSliceState = {
	messageIndexSlice: {
		messageListIndex: Array<string>;
		more: boolean;
		offset: number;
		status: SearchRequestStatus;
	};
};

export type ConversationIndexSliceState = {
	conversationIndexSlice: {
		conversationListIndex: Array<string>;
		more: boolean;
		offset: number;
		status: SearchRequestStatus;
	};
};
export type PopulatedItemsSliceState = {
	populatedItemsSlice: {
		messages: Record<string, MailMessage | IncompleteMessage>;
		messagesStatus: Record<string, SearchRequestStatus>;
		conversations: Record<string, NormalizedConversation>;
		conversationsStatus: Record<string, SearchRequestStatus>;
	};
};

export type EmailsStoreState = PopulatedItemsSliceState &
	SearchIndexSliceState &
	MessageIndexSliceState &
	ConversationIndexSliceState;
