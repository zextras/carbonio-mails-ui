/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { DropdownItem } from '@zextras/carbonio-design-system';
import { filter, intersection, map, some } from 'lodash';

import { normalizeDropdownActionItem } from '../../../../helpers/actions';
import { useConvApplyTagDescriptor } from '../../../../hooks/actions/use-conv-apply-tag';
import { useConvDeletePermanentlyDescriptor } from '../../../../hooks/actions/use-conv-delete-permanently';
import { useConvMoveToFolderDescriptor } from '../../../../hooks/actions/use-conv-move-to-folder';
import { useConvMoveToTrashDescriptor } from '../../../../hooks/actions/use-conv-move-to-trash';
import { useConvSetFlagDescriptor } from '../../../../hooks/actions/use-conv-set-flag';
import { useConvSetNotSpamDescriptor } from '../../../../hooks/actions/use-conv-set-not-spam';
import { useConvSetReadDescriptor } from '../../../../hooks/actions/use-conv-set-read';
import { useConvSetSpamDescriptor } from '../../../../hooks/actions/use-conv-set-spam';
import { useConvSetUnflagDescriptor } from '../../../../hooks/actions/use-conv-set-unflag';
import { useConvSetUnreadDescriptor } from '../../../../hooks/actions/use-conv-set-unread';
import { useTagDropdownItem } from '../../../../hooks/use-tag-dropdown-item';
import type { Conversation } from '../../../../types';
import { MultipleSelectionActionsComponent } from '../parts/multiple-selection-actions-component';

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
	const setAsRead = useConvSetReadDescriptor({
		ids,
		deselectAll,
		folderId,
		isConversationRead: !atLeastOneConvIsUnread
	});
	const setAsUnread = useConvSetUnreadDescriptor({
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
	const unflagDescriptor = useConvSetUnflagDescriptor(ids, !atLeastOneConvIsUnflagged);
	const moveToFolderDescriptor = useConvMoveToFolderDescriptor({ folderId, deselectAll, ids });
	const setAsSpam = useConvSetSpamDescriptor({ ids, shouldReplaceHistory: false, folderId });
	const setAsNotSpam = useConvSetNotSpamDescriptor({
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
