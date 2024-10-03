/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { DropdownItem } from '@zextras/carbonio-design-system';
import { filter, intersection, map, some } from 'lodash';

import { normalizeDropdownActionItem } from '../../../../helpers/actions';
import { useMsgApplyTagDescriptor } from '../../../../hooks/actions/use-msg-apply-tag';
import { useMsgDeletePermanentlyDescriptor } from '../../../../hooks/actions/use-msg-delete-permanently';
import { useMsgMoveToFolderDescriptor } from '../../../../hooks/actions/use-msg-move-to-folder';
import { useMsgMoveToTrashDescriptor } from '../../../../hooks/actions/use-msg-move-to-trash';
import { useMsgSetFlagDescriptor } from '../../../../hooks/actions/use-msg-set-flag';
import { useMsgSetNotSpamDescriptor } from '../../../../hooks/actions/use-msg-set-not-spam';
import { useMsgSetReadDescriptor } from '../../../../hooks/actions/use-msg-set-read';
import { useMsgSetSpamDescriptor } from '../../../../hooks/actions/use-msg-set-spam';
import { useMsgSetUnflagDescriptor } from '../../../../hooks/actions/use-msg-set-unflag';
import { useMsgSetUnreadDescriptor } from '../../../../hooks/actions/use-msg-set-unread';
import { useTagDropdownItem } from '../../../../hooks/use-tag-dropdown-item';
import { MailMessage } from '../../../../types';
import { MultipleSelectionActionsComponent } from '../parts/multiple-selection-actions-component';

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
	const deletePermanently = useMsgDeletePermanentlyDescriptor({ ids, deselectAll, folderId });
	const applyTagDescriptor = useMsgApplyTagDescriptor({
		ids,
		messageTags: tagsInCommon,
		folderId
	});
	const tagItem = useTagDropdownItem(applyTagDescriptor, tagsInCommon);

	const flagDescriptor = useMsgSetFlagDescriptor(ids, !atLeastOneMsgIsUnflagged);
	const unflagDescriptor = useMsgSetUnflagDescriptor(ids, !atLeastOneMsgIsUnflagged);
	const moveToFolderDescriptor = useMsgMoveToFolderDescriptor({ folderId, deselectAll, ids });
	const setAsSpam = useMsgSetSpamDescriptor({ ids, shouldReplaceHistory: false, folderId });
	const setAsNotSpam = useMsgSetNotSpamDescriptor({
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
