/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { DropdownItem } from '@zextras/carbonio-design-system';
import { intersection, map, some } from 'lodash';
import { useTranslation } from 'react-i18next';

import { normalizeDropdownActionItem } from 'helpers/actions';
import { useConvApplyTagDescriptor } from 'hooks/actions/use-conv-apply-tag';
import { useConvDeletePermanentlyDescriptor } from 'hooks/actions/use-conv-delete-permanently';
import { useConvMoveToFolderDescriptor } from 'hooks/actions/use-conv-move-to-folder';
import { useConvMoveToTrashDescriptor } from 'hooks/actions/use-conv-move-to-trash';
import { useConvSetFlagDescriptor } from 'hooks/actions/use-conv-set-flag';
import { useConvSetNotSpamDescriptor } from 'hooks/actions/use-conv-set-not-spam';
import { useConvSetReadDescriptor } from 'hooks/actions/use-conv-set-read';
import { useConvSetSpamDescriptor } from 'hooks/actions/use-conv-set-spam';
import { useConvSetUnflagDescriptor } from 'hooks/actions/use-conv-set-unflag';
import { useConvSetUnreadDescriptor } from 'hooks/actions/use-conv-set-unread';
import { useTagDropdownItem } from 'hooks/use-tag-dropdown-item';
import { useConversationsByIds } from 'store/emails/store';
import { MultipleSelectionActionsComponent } from 'views/app/folder-panel/parts/multiple-selection-actions-component';

export const ConversationsMultipleSelectionActions = ({
	selectedConversationsIds,
	folderId,
	onConversationsMoved
}: {
	selectedConversationsIds: Array<string>;
	folderId: string;
	onConversationsMoved?: (conversationsIds: Array<string>) => void;
}): React.JSX.Element => {
	const [t] = useTranslation();
	const selectedItems = useConversationsByIds(selectedConversationsIds);
	const conversationstags: Array<Array<string>> = map(selectedItems, (item) => item.tags);
	const atLeastOneConvIsUnread = some(selectedItems, (item) => !item.read);
	const atLeastOneConvIsUnflagged = some(selectedItems, (item) => !item.flagged);
	const tagsInCommon = intersection(...conversationstags);

	/*
	 * Callback to be executed after any action that moves conversations (to trash, to folder, etc.)
	 */
	const onActionComplete = useCallback(
		(conversationsIds: Array<string>): void => {
			onConversationsMoved && onConversationsMoved(conversationsIds);
		},
		[onConversationsMoved]
	);

	const setAsRead = useConvSetReadDescriptor({
		ids: selectedConversationsIds,
		folderId,
		isConversationRead: !atLeastOneConvIsUnread
	});
	const setAsUnread = useConvSetUnreadDescriptor({
		ids: selectedConversationsIds,
		folderId,
		isConversationRead: !atLeastOneConvIsUnread
	});
	const moveToTrash = useConvMoveToTrashDescriptor({
		ids: selectedConversationsIds,
		folderId,
		onActionComplete
	});
	const deletePermanently = useConvDeletePermanentlyDescriptor({
		ids: selectedConversationsIds,
		folderId,
		onActionComplete
	});
	const applyTagDescriptor = useConvApplyTagDescriptor({
		ids: selectedConversationsIds,
		conversationTags: tagsInCommon,
		folderId
	});
	const tagItem = useTagDropdownItem(applyTagDescriptor, tagsInCommon);

	const flagDescriptor = useConvSetFlagDescriptor(
		selectedConversationsIds,
		!atLeastOneConvIsUnflagged
	);
	const unflagDescriptor = useConvSetUnflagDescriptor(
		selectedConversationsIds,
		!atLeastOneConvIsUnflagged
	);
	const moveToFolderDescriptor = useConvMoveToFolderDescriptor({
		folderId,
		ids: selectedConversationsIds,
		onActionComplete
	});
	const setAsSpam = useConvSetSpamDescriptor({
		ids: selectedConversationsIds,
		folderId,
		onActionComplete
	});
	const setAsNotSpam = useConvSetNotSpamDescriptor({
		ids: selectedConversationsIds,
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
				normalizeDropdownActionItem(setAsNotSpam)
			]
		} as DropdownItem
	];
	return <MultipleSelectionActionsComponent actions={actions} />;
};
