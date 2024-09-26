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
import { useMsgApplyTagDescriptor } from '../hooks/actions/use-msg-apply-tag';
import { useDeleteMsgPermanentlyDescriptor } from '../hooks/actions/use-msg-delete-permanently';
import { useMsgFlagDescriptor } from '../hooks/actions/use-msg-flag';
import { useMsgMarkAsNotSpamDescriptor } from '../hooks/actions/use-msg-mark-as-not-spam';
import { useMsgMarkAsSpamDescriptor } from '../hooks/actions/use-msg-mark-as-spam';
import { useMsgMoveToFolderDescriptor } from '../hooks/actions/use-msg-move-to-folder';
import { useMsgMoveToTrashDescriptor } from '../hooks/actions/use-msg-move-to-trash';
import { useMsgSetUnreadDescriptor } from '../hooks/actions/use-msg-set-unread';
import { useMsgUnflagDescriptor } from '../hooks/actions/use-msg-unflag';
import { useMsgSetReadDescriptor } from '../hooks/actions/use-set-msg-read';
import { useTagDropdownItem } from '../hooks/use-tag-dropdown-item';
import { MailMessage } from '../types';

export const MessagesMultipleSelectionActions = ({
	ids,
	deselectAll,
	items,
	folderId
}: {
	items: Array<MailMessage>;
	ids: Array<string>;
	deselectAll: () => void;
	folderId: string;
}): React.JSX.Element => {
	const selectedItems = filter(items, (item) => ids.includes(item.id));
	const messagesTags: Array<Array<string>> = map(selectedItems, (item) => item.tags);
	const atLeastOneMsgIsUnread = some(selectedItems, (item) => !item.read);
	const atLeastOneMsgIsUnflagged = some(selectedItems, (item) => !item.flagged);
	const tagsInCommon = intersection(...messagesTags);
	const setAsRead = useMsgSetReadDescriptor({
		ids,
		deselectAll,
		folderId,
		isMessageRead: !atLeastOneMsgIsUnread
	});
	const setAsUnread = useMsgSetUnreadDescriptor({
		ids,
		deselectAll,
		folderId,
		isMessageRead: !atLeastOneMsgIsUnread
	});
	const moveToTrash = useMsgMoveToTrashDescriptor({ ids, deselectAll, folderId });
	const deletePermanently = useDeleteMsgPermanentlyDescriptor({ ids, deselectAll, folderId });
	const applyTagDescriptor = useMsgApplyTagDescriptor({
		ids,
		messageTags: tagsInCommon,
		folderId
	});
	const tagItem = useTagDropdownItem(applyTagDescriptor, tagsInCommon);

	const flagDescriptor = useMsgFlagDescriptor(ids, !atLeastOneMsgIsUnflagged);
	const unflagDescriptor = useMsgUnflagDescriptor(ids, !atLeastOneMsgIsUnflagged);
	const moveToFolderDescriptor = useMsgMoveToFolderDescriptor({ folderId, deselectAll, ids });
	const setAsSpam = useMsgMarkAsSpamDescriptor({ ids, shouldReplaceHistory: false, folderId });
	const setAsNotSpam = useMsgMarkAsNotSpamDescriptor({
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
