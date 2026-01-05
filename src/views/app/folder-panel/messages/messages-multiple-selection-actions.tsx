/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import { DropdownItem } from '@zextras/carbonio-design-system';
import { filter, intersection, map, some } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { normalizeDropdownActionItem } from 'helpers/actions';
import { useMsgApplyTagDescriptor } from 'hooks/actions/use-msg-apply-tag';
import { useMsgDeletePermanentlyDescriptor } from 'hooks/actions/use-msg-delete-permanently';
import { useMsgForwardAsAttachmentDescriptor } from 'hooks/actions/use-msg-forward-as-attachment';
import { useMsgMoveToFolderDescriptor } from 'hooks/actions/use-msg-move-to-folder';
import { useMsgMoveToTrashDescriptor } from 'hooks/actions/use-msg-move-to-trash';
import { useMsgSetFlagDescriptor } from 'hooks/actions/use-msg-set-flag';
import { useMsgSetNotSpamDescriptor } from 'hooks/actions/use-msg-set-not-spam';
import { useMsgSetReadDescriptor } from 'hooks/actions/use-msg-set-read';
import { useMsgSetSpamDescriptor } from 'hooks/actions/use-msg-set-spam';
import { useMsgSetUnflagDescriptor } from 'hooks/actions/use-msg-set-unflag';
import { useMsgSetUnreadDescriptor } from 'hooks/actions/use-msg-set-unread';
import { useTagDropdownItem } from 'hooks/use-tag-dropdown-item';
import { useMessagesByIds } from 'store/emails/store';
import { MultipleSelectionActionsComponent } from 'views/app/folder-panel/parts/multiple-selection-actions-component';

export const MessagesMultipleSelectionActions = ({
	ids,
	folderId,
	onMessagesMoved
}: {
	ids: Array<string>;
	folderId: string;
	onMessagesMoved?: (messagesIds: Array<string>) => void;
}): React.JSX.Element => {
	const [t] = useTranslation();
	const { folderId: routeFolderId } = useParams();

	/*
	 * Callback to be executed after any action that moves conversations (to trash, to folder, etc.)
	 */
	const onActionComplete = useCallback(
		(messagesIds: Array<string>): void => {
			onMessagesMoved && onMessagesMoved(messagesIds);
		},
		[onMessagesMoved]
	);

	const items = useMessagesByIds(ids);
	const selectedItems = filter(items, (item) => ids.includes(item.id));
	const messagesTags: Array<Array<string>> = map(selectedItems, (item) => item.tags);
	const atLeastOneMsgIsUnread = some(selectedItems, (item) => !item.read);
	const atLeastOneMsgIsUnflagged = some(selectedItems, (item) => !item.flagged);
	const tagsInCommon = intersection(...messagesTags);
	const setAsRead = useMsgSetReadDescriptor({
		ids,
		folderId,
		isMessageRead: !atLeastOneMsgIsUnread
	});
	const setAsUnread = useMsgSetUnreadDescriptor({
		ids,
		folderId,
		isMessageRead: !atLeastOneMsgIsUnread
	});
	const moveToTrash = useMsgMoveToTrashDescriptor({
		ids,
		messageFolderId: folderId,
		routeFolderId,
		onActionComplete
	});
	const deletePermanently = useMsgDeletePermanentlyDescriptor({ ids, folderId, onActionComplete });
	const applyTagDescriptor = useMsgApplyTagDescriptor({
		ids,
		messageTags: tagsInCommon,
		folderId
	});
	const tagItem = useTagDropdownItem(applyTagDescriptor, tagsInCommon);

	const flagDescriptor = useMsgSetFlagDescriptor(ids, !atLeastOneMsgIsUnflagged);
	const unflagDescriptor = useMsgSetUnflagDescriptor(ids, !atLeastOneMsgIsUnflagged);
	const moveToFolderDescriptor = useMsgMoveToFolderDescriptor({ folderId, ids, onActionComplete });
	const setAsSpam = useMsgSetSpamDescriptor({
		ids,
		shouldReplaceHistory: false,
		folderId,
		onActionComplete
	});
	const forwardAsAttachment = useMsgForwardAsAttachmentDescriptor(ids, folderId);
	const setAsNotSpam = useMsgSetNotSpamDescriptor({
		ids,
		shouldReplaceHistory: false,
		folderId,
		onActionComplete
	});
	const actions = [
		setAsRead,
		setAsUnread,
		moveToTrash,
		deletePermanently,
		{
			id: 'More',
			icon: 'MoreVertical',
			label: t('tooltip.moreActions', 'More actions'),
			items: [
				normalizeDropdownActionItem(flagDescriptor),
				normalizeDropdownActionItem(unflagDescriptor),
				normalizeDropdownActionItem(moveToFolderDescriptor),
				tagItem,
				normalizeDropdownActionItem(setAsSpam),
				normalizeDropdownActionItem(setAsNotSpam),
				normalizeDropdownActionItem(forwardAsAttachment)
			]
		} as DropdownItem
	];
	return <MultipleSelectionActionsComponent actions={actions} />;
};
