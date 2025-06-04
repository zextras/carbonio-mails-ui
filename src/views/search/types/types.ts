/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Theme } from '@zextras/carbonio-design-system';
import { ContactInputItem } from '@zextras/carbonio-ui-commons';
import { Control } from 'react-hook-form';

export type SearchQueryItem = {
	id: string;
	label: string;
	value?: string;
	isGeneric?: boolean;
	isQueryFilter?: boolean;
};

export type Query = Array<SearchQueryItem>;

export type KeywordState = Array<{
	id: string;
	label: string;
	hasAvatar?: boolean;
	value?: string;
	isQueryFilter?: boolean;
	isGeneric?: boolean;
	avatarIcon?: string;
	avatarBackground?: string;
	hasError?: boolean;
	error?: boolean;
	fullName?: string;
	maxWidth?: string;
	background?: keyof Theme['palette'];
}>;

export type AdvancedFilterModalFormValues = {
	keywordInput: KeywordState;
	subjectInput: KeywordState;
	hasAttachment: boolean;
	isSharedFolderIncluded: boolean;
	isFlagged: boolean;
	isUnread: boolean;
	sentBefore: Date | null;
	sentAfter: Date | null;
	sizeSmaller: KeywordState;
	sizeLarger: KeywordState;
	receivedFrom: Array<ContactInputItem>;
	sentTo: Array<ContactInputItem>;
	attachmentType: KeywordState;
	emailStatus: KeywordState;
	tagInput: KeywordState;
	folderInput: KeywordState;
};

export type FormValuesControlProps = {
	control: Control<AdvancedFilterModalFormValues>;
};

export type AdvancedFilterModalProps = {
	query: Query;
	isSharedFolderIncluded: boolean;
	onSearchConfirm: (options: { query: Query; includeSharedFolders: boolean }) => void;
	onClose: () => void;
};
