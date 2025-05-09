/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContactInputItem } from '../../../carbonio-ui-commons/integrations/types';
import { KeywordState, Query } from '../../../types';

export type FormValues = {
	keywordInput: KeywordState;
	subjectInput: KeywordState;
	hasAttachment: boolean;
	isFlagged: boolean;
	isUnread: boolean;
	sentBefore: Date | null;
	sentAfter: Date | null;
	sentOn: Date | null;
	sizeSmaller: KeywordState;
	sizeLarger: KeywordState;
	receivedFrom: Array<ContactInputItem>;
	sentTo: Array<ContactInputItem>;
	attachmentType: KeywordState;
	emailStatus: KeywordState;
	tagInput: KeywordState;
	folderInput: KeywordState;
};

export type AdvancedFilterModalProps = {
	open: boolean;
	onClose: () => void;
	query: Query;
	isSharedFolderIncludedInitialValue: boolean;
	onSearchConfirm: (request: { query: Query; includeSharedFolders: boolean }) => void;
	includeSharedItemsInSearchPref: boolean;
};
