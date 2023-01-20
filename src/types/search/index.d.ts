/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ChipProps } from '@zextras/carbonio-design-system';
import { QueryChip } from '@zextras/carbonio-shell-ui';
import { FC } from 'react';
import { Conversation } from '../conversations';
import { KeywordState } from '../filters';
import { IncompleteMessage, MailMessage } from '../messages';
import { SearchesStateType } from '../state';

export type SearchResults = {
	messages?: Record<string, MailMessage>;
	conversations?: Record<string, Conversation>;
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

export type SearchMessageListItemProps = {
	item: IncompleteMessage;
	isConvChildren?: boolean;
};

export type SearchConversationListItemProps = {
	itemId?: string;
	item: Conversation;
	selected: boolean;
	selecting: boolean;
	toggle?: (arg: string) => void;
};

export type AdvancedFilterModalProps = {
	id: string;
	open: boolean;
	onClose: () => void;
	query: Array<{
		id: string;
		label: string;
		value?: string;
		isGeneric?: boolean;
		isQueryFilter?: boolean;
	}>;
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

export type ChipOnAdd = ChipItem & {
	label: string;
	hasAvatar: boolean;
	isGeneric: boolean;
	isQueryFilter: boolean;
	value: string;
	avatarIcon: string;
	avatarColor: string;
};
export type RcvdSentAddressRowPropType = {
	compProps: {
		receivedFromAddress: Array<any>;
		setReceivedFromAddress: (arg: any) => void;
		sentFromAddress: Array<any>;
		setSentFromAddress: (arg: any) => void;
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
		folder: Array<any>;
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
	avatarBackground?: string;
	hasError?: boolean;
};
