/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { DropdownItem } from '@zextras/carbonio-design-system';
import { filter, intersection, map, some } from 'lodash';

import { MultipleSelectionActionsComponent } from './multiple-selection-actions-component';
import { normalizeDropdownActionItem } from '../helpers/actions';
import { useConvApplyTagDescriptor } from '../hooks/actions/use-conv-apply-tag';
import { useConvDeletePermanentlyDescriptor } from '../hooks/actions/use-conv-delete-permanently';
import { useConvMarkAsNotSpamDescriptor } from '../hooks/actions/use-conv-mark-as-not-spam';
import { useConvMarkAsSpamDescriptor } from '../hooks/actions/use-conv-mark-as-spam';
import { useConvMoveToFolderDescriptor } from '../hooks/actions/use-conv-move-to-folder';
import { useConvMoveToTrashDescriptor } from '../hooks/actions/use-conv-move-to-trash';
import { useConvSetAsRead } from '../hooks/actions/use-conv-set-as-read';
import { useConvSetAsUnread } from '../hooks/actions/use-conv-set-as-unread';
import { useConvSetFlagDescriptor } from '../hooks/actions/use-conv-set-flag';
import { useConvUnsetFlagDescriptor } from '../hooks/actions/use-conv-unset-flag';
import { useTagDropdownItem } from '../hooks/use-tag-dropdown-item';
import type { Conversation } from '../types';

export const ConversationsMultipleSelectionActions = ({
	ids,
	deselectAll,
	items,
	folderId
}: {
	items: Array<Conversation>;
	ids: Array<string>;
	deselectAll: () => void;
	folderId: string;
}): React.JSX.Element => {
	const selectedItems = filter(items, (item) => ids.includes(item.id));
	const conversationstags: Array<Array<string>> = map(selectedItems, (item) => item.tags);
	const atLeastOneConvIsUnread = some(selectedItems, (item) => !item.read);
	const atLeastOneConvIsUnflagged = some(selectedItems, (item) => !item.flagged);
	const tagsInCommon = intersection(...conversationstags);
	const setAsRead = useConvSetAsRead({
		ids,
		deselectAll,
		folderId,
		isConversationRead: !atLeastOneConvIsUnread
	});
	const setAsUnread = useConvSetAsUnread({
		ids,
		deselectAll,
		folderId,
		isConversationRead: !atLeastOneConvIsUnread
	});
	const moveToTrash = useConvMoveToTrashDescriptor({ ids, deselectAll, folderId });
	const deletePermanently = useConvDeletePermanentlyDescriptor({ ids, deselectAll, folderId });
	const applyTagDescriptor = useConvApplyTagDescriptor({
		ids,
		conversationTags: tagsInCommon,
		folderId
	});
	const tagItem = useTagDropdownItem(applyTagDescriptor, tagsInCommon);

	const flagDescriptor = useConvSetFlagDescriptor(ids, !atLeastOneConvIsUnflagged);
	const unflagDescriptor = useConvUnsetFlagDescriptor(ids, !atLeastOneConvIsUnflagged);
	const moveToFolderDescriptor = useConvMoveToFolderDescriptor({ folderId, deselectAll, ids });
	const setAsSpam = useConvMarkAsSpamDescriptor({ ids, shouldReplaceHistory: false, folderId });
	const setAsNotSpam = useConvMarkAsNotSpamDescriptor({
		ids,
		shouldReplaceHistory: false,
		folderId
	});
	const actions = [
		setAsRead,
		setAsUnread,
		moveToTrash,
		deletePermanently,
		{
			id: 'More',
			icon: 'MoreVertical',
			label: 'More actions',
			items: [
				normalizeDropdownActionItem(flagDescriptor),
				normalizeDropdownActionItem(unflagDescriptor),
				normalizeDropdownActionItem(moveToFolderDescriptor),
				tagItem,
				normalizeDropdownActionItem(setAsSpam),
				normalizeDropdownActionItem(setAsNotSpam)
			]
		} as DropdownItem
	];
	return <MultipleSelectionActionsComponent actions={actions} />;
};
