/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ChipItem } from '@zextras/carbonio-design-system';
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

export type SearchChipItem = ChipItem & {
	isGeneric?: boolean;
	isQueryFilter?: boolean;
	hasError?: boolean;
};

export type SearchProps = {
	useDisableSearch: () => [boolean, (arg: any) => void];
	useQuery: () => [Array<QueryChip>, (arg: any) => void];
	ResultsHeader: FC<{ label: string }>;
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
	toggle?: boolean;
	active: boolean;
};

export type AdvancedFilterModalProps = {
	open: boolean;
	onClose: () => void;
	t: TFunction;
	query: Array<{
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
		t: TFunction;
		receivedFromAddress: Array<any>;
		setReceivedFromAddress: (arg: any) => void;
		sentFromAddress: Array<any>;
		setSentFromAddress: (arg: any) => void;
	};
};

export type SendReceivedDateRowPropType = {
	compProps: {
		t: TFunction;
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
		t: TFunction;
		sizeSmaller: any;
		setSizeSmaller: (arg: any) => any;
		sizeLarger: any;
		setSizeLarger: (arg: any) => any;
	};
};
export type SubjectKeywordRowProps = {
	compProps: {
		t: TFunction;
		otherKeywords: Array<any>;
		setOtherKeywords: (arg: any) => void;
		subject: Array<any>;
		setSubject: (arg: any) => void;
	};
};

export type TagFolderRowProps = {
	compProps: {
		t: TFunction;
		folder: Array<any>;
		setFolder: (arg: any) => void;
		tagOptions: Array<any>;
		tag: Array<any>;
		setTag: (arg: any) => void;
	};
};

export type ToggleFilters = Array<{
	avatarIcon?: string;
	label: string;
	value: string;
	isQueryFilter?: boolean;
	isGeneric?: boolean;
	avatarBackground?: ChipProps['background'];
}>;
export type ToggleFiltersProps = {
	compProps: {
		t: TFunction;
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
