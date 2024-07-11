/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FC } from 'react';

import { ChipProps, ChipItem } from '@zextras/carbonio-design-system';
import { QueryChip } from '@zextras/carbonio-shell-ui';

import { SortBy } from '../../carbonio-ui-commons/types/folder';
import { Conversation } from '../conversations';
import { KeywordState } from '../filters';
import { MailMessage } from '../messages';
import { ErrorType, SearchesStateType, SearchRequestStatus } from '../state';

export type SearchResults = {
	messages?: Record<string, MailMessage>;
	conversations?: Record<string, Conversation>;
	more: boolean;
	offset: number;
	sortBy: SortBy;
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
	query: string;
	loading: boolean;
	filterCount: number;
	setShowAdvanceFilters: (show: boolean) => void;
	isInvalidQuery: boolean;
	searchDisabled: boolean;
	invalidQueryTooltip?: string;
};

export type SearchChipItem = ChipItem & {
	isGeneric?: boolean;
	isQueryFilter?: boolean;
	hasError?: boolean;
};

type SearchProps = {
	useDisableSearch: () => [boolean, (arg: any, invalidQueryTooltip: string) => void];
	useQuery: () => [Array<QueryChip>, (arg: any) => void];
	ResultsHeader: FC<{ label: string; labelType?: string }>;
};

export type SearchPanelProps = {
	searchResults: SearchesStateType;
	query: Array<QueryChip>;
};

export type SearchConversationListItemProps = {
	itemId?: string;
	item: Conversation;
	selected: boolean;
	selecting: boolean;
	toggle?: (arg: string) => void;
	active: boolean;
};

export type SearchQueryItem = {
	id: string;
	label: string;
	value?: string;
	isGeneric?: boolean;
	isQueryFilter?: boolean;
};

export type Query = Array<SearchQueryItem>;

export type AdvancedFilterModalProps = {
	open: boolean;
	onClose: () => void;
	query: Query;
	updateQuery: (arg: Array<QueryChip>) => void;
	isSharedFolderIncluded: boolean;
	setIsSharedFolderIncluded: (arg: boolean) => void;
};

export type AdvancedFilterButtonProps = {
	searchDisabled: boolean;
	filterCount: number;
	setShowAdvanceFilters: (arg: boolean) => void;
	invalidQueryTooltip?: string;
};

export type AttachTypeEmailStatusRowPropType = {
	compProps: {
		attachmentType: KeywordState;
		setAttachmentType: (arg: any) => void;
		emailStatus: KeywordState;
		setEmailStatus: (arg: any) => void;
	};
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
	address: ContactAddressMap;
	company: string;
	department: string;
	email: ContactEmailMap;
	image: string;
	jobTitle: string;
	notes: string;
	phone: ContactPhoneMap;
	nameSuffix: string;
	namePrefix: string;
	URL: ContactUrlMap;
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
export type RcvdSentAddressRowPropType = {
	compProps: {
		receivedFromAddress: Array<any>;
		setReceivedFromAddress: (arg: any) => void;
		sentToAddress: Array<any>;
		setSentToAddress: (arg: any) => void;
	};
};

export type SendReceivedDateRowPropType = {
	compProps: {
		sentBefore: Array<any>;
		setSentBefore: (arg: any) => void;
		sentAfter: Array<any>;
		setSentAfter: (arg: any) => void;
		sentOn: Array<any>;
		setSentOn: (arg: any) => void;
	};
};
export type SizeLargerSizeSmallerRowProps = {
	compProps: {
		sizeSmaller: any;
		setSizeSmaller: (arg: any) => any;
		sizeLarger: any;
		setSizeLarger: (arg: any) => any;
	};
};
export type SubjectKeywordRowProps = {
	compProps: {
		otherKeywords: Array<any>;
		setOtherKeywords: (arg: any) => void;
		subject: Array<any>;
		setSubject: (arg: any) => void;
	};
};

export type TagFolderRowProps = {
	compProps: {
		folder: Folder;
		setFolder: (arg: any) => void;
		tagOptions: Array<any>;
		tag: Array<any>;
		setTag: (arg: any) => void;
	};
};

export type ToggleFilters = Array<{
	id: string;
	avatarIcon?: string;
	label: string;
	value: string;
	isQueryFilter?: boolean;
	isGeneric?: boolean;
	avatarBackground?: ChipProps['background'];
}>;
export type ToggleFiltersProps = {
	compProps: {
		query: Array<QueryChip>;
		setUnreadFilter: (arg: ToggleFilters) => void;
		setFlaggedFilter: (arg: ToggleFilters) => void;
		setAttachmentFilter: (arg: ToggleFilters) => void;
		isSharedFolderIncludedTobe: boolean;
		setIsSharedFolderIncludedTobe: (arg: boolean) => void;
	};
};

export type UseDisabledPropType = {
	queryToBe: Array<QueryChip>;
	query: Array<QueryChip>;
	isSharedFolderIncluded: boolean;
	isSharedFolderIncludedTobe: boolean;
};

export type UseSecondaryDisabledType = {
	attachmentFilter: KeywordState;
	attachmentType: KeywordState;
	emailStatus: KeywordState;
	flaggedFilter: KeywordState;
	folder: KeywordState;
	receivedFromAddress: KeywordState;
	sentAfter: KeywordState;
	sentBefore: KeywordState;
	sentFromAddress: KeywordState;
	sentOn: KeywordState;
	sizeLarger: KeywordState;
	sizeSmaller: KeywordState;
	subject: KeywordState;
	tag: KeywordState;
	totalKeywords: number;
	unreadFilter: KeywordState;
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

export type SearchStoreState = {
	conversations: Record<string, { id: string }>;
	messages: Set<string>;
	more: boolean;
	offset: number;
	sortBy?: SortBy;
	query?: string;
	status: SearchRequestStatus;
	parent?: string;
	tagName?: string;
	error?: ErrorType;
	addConversation: (conversation: Conversation) => void;
	setStatus: (status: SearchRequestStatus) => void;
	getConversation: (conversationId: string) => Conversation;
};
