/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import { DropdownItem } from '@zextras/carbonio-design-system';
import { filter, intersection, map, some } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { normalizeDropdownActionItem } from 'helpers/actions';
import { useConvApplyTagDescriptor } from 'hooks/actions/use-conv-apply-tag';
import { useConvArchiveDescriptor } from 'hooks/actions/use-conv-archive';
import { useConvDeletePermanentlyDescriptor } from 'hooks/actions/use-conv-delete-permanently';
import { useConvMoveToFolderDescriptor } from 'hooks/actions/use-conv-move-to-folder';
import { useConvMoveToTrashDescriptor } from 'hooks/actions/use-conv-move-to-trash';
import { useConvSetFlagDescriptor } from 'hooks/actions/use-conv-set-flag';
import { useConvSetNotSpamDescriptor } from 'hooks/actions/use-conv-set-not-spam';
import { useConvSetReadDescriptor } from 'hooks/actions/use-conv-set-read';
import { useConvSetSpamDescriptor } from 'hooks/actions/use-conv-set-spam';
import { useConvSetUnflagDescriptor } from 'hooks/actions/use-conv-set-unflag';
import { useConvSetUnreadDescriptor } from 'hooks/actions/use-conv-set-unread';
import { useMsgApplyTagDescriptor } from 'hooks/actions/use-msg-apply-tag';
import { useMsgArchiveDescriptor } from 'hooks/actions/use-msg-archive';
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
import { useMessagesByIds, useConversationsByIds } from 'store/emails/store';
import { NormalizedConversation } from 'types/conversations';
import { MailMessage } from 'types/messages';
import { MultipleSelectionActionsComponent } from 'views/app/folder-panel/parts/multiple-selection-actions-component';

type MultipleSelectionActionsProps =
	| {
			type: 'message';
			ids: Array<string>;
			folderId: string;
			onItemsMoved?: (ids: Array<string>) => void;
	  }
	| {
			type: 'conversation';
			ids: Array<string>;
			folderId: string;
			onItemsMoved?: (ids: Array<string>) => void;
	  };

type SelectableItem = Pick<MailMessage | NormalizedConversation, 'tags' | 'read' | 'flagged'>;

export const MultipleSelectionActions = ({
	type,
	ids,
	folderId,
	onItemsMoved
}: MultipleSelectionActionsProps): React.JSX.Element => {
	const [t] = useTranslation();
	const { folderId: routeFolderId } = useParams();

	const onActionComplete = useCallback(
		(itemIds: Array<string>): void => {
			onItemsMoved?.(itemIds);
		},
		[onItemsMoved]
	);

	const messages = useMessagesByIds(type === 'message' ? ids : []);
	const conversations = useConversationsByIds(type === 'conversation' ? ids : []);

	const selectedItems: Array<SelectableItem> =
		type === 'message'
			? filter(messages, (item): item is MailMessage => ids.includes(item.id))
			: conversations;

	const tags: Array<Array<string>> = map(selectedItems, (item) => item.tags);
	const atLeastOneIsUnread = some(selectedItems, (item) => !item.read);
	const atLeastOneIsUnflagged = some(selectedItems, (item) => !item.flagged);
	const tagsInCommon = intersection(...tags);

	const msgSetAsRead = useMsgSetReadDescriptor({
		ids,
		folderId,
		isMessageRead: !atLeastOneIsUnread
	});
	const msgSetAsUnread = useMsgSetUnreadDescriptor({
		ids,
		folderId,
		isMessageRead: !atLeastOneIsUnread
	});
	const msgMoveToTrash = useMsgMoveToTrashDescriptor({
		ids,
		messageFolderId: folderId,
		routeFolderId,
		onActionComplete
	});
	const msgMoveToArchive = useMsgArchiveDescriptor({
		messagesIds: ids,
		folderId,
		onActionComplete
	});
	const msgDeletePermanently = useMsgDeletePermanentlyDescriptor({
		ids,
		folderId,
		onActionComplete
	});
	const msgApplyTagDescriptor = useMsgApplyTagDescriptor({
		ids,
		messageTags: tagsInCommon,
		folderId
	});
	const msgTagItem = useTagDropdownItem(msgApplyTagDescriptor, tagsInCommon);
	const msgFlag = useMsgSetFlagDescriptor(ids, !atLeastOneIsUnflagged);
	const msgUnflag = useMsgSetUnflagDescriptor(ids, !atLeastOneIsUnflagged);
	const msgMoveToFolder = useMsgMoveToFolderDescriptor({ folderId, ids, onActionComplete });
	const msgSetAsSpam = useMsgSetSpamDescriptor({
		ids,
		shouldReplaceHistory: false,
		folderId,
		onActionComplete
	});
	const msgSetAsNotSpam = useMsgSetNotSpamDescriptor({
		ids,
		shouldReplaceHistory: false,
		folderId,
		onActionComplete
	});
	const msgForwardAsAttachment = useMsgForwardAsAttachmentDescriptor(ids, folderId);

	const convSetAsRead = useConvSetReadDescriptor({
		ids,
		folderId,
		isConversationRead: !atLeastOneIsUnread
	});
	const convSetAsUnread = useConvSetUnreadDescriptor({
		ids,
		folderId,
		isConversationRead: !atLeastOneIsUnread
	});
	const convMoveToTrash = useConvMoveToTrashDescriptor({ ids, folderId, onActionComplete });
	const convMoveToArchive = useConvArchiveDescriptor({
		conversationIds: ids,
		folderId,
		onActionComplete
	});
	const convDeletePermanently = useConvDeletePermanentlyDescriptor({
		ids,
		folderId,
		onActionComplete
	});
	const convApplyTagDescriptor = useConvApplyTagDescriptor({
		ids,
		conversationTags: tagsInCommon,
		folderId
	});
	const convTagItem = useTagDropdownItem(convApplyTagDescriptor, tagsInCommon);
	const convFlag = useConvSetFlagDescriptor(ids, !atLeastOneIsUnflagged);
	const convUnflag = useConvSetUnflagDescriptor(ids, !atLeastOneIsUnflagged);
	const convMoveToFolder = useConvMoveToFolderDescriptor({ folderId, ids, onActionComplete });
	const convSetAsSpam = useConvSetSpamDescriptor({ ids, folderId, onActionComplete });
	const convSetAsNotSpam = useConvSetNotSpamDescriptor({ ids, folderId, onActionComplete });

	const isMessage = type === 'message';

	const actions = [
		isMessage ? msgSetAsRead : convSetAsRead,
		isMessage ? msgSetAsUnread : convSetAsUnread,
		isMessage ? msgMoveToArchive : convMoveToArchive,
		isMessage ? msgMoveToTrash : convMoveToTrash,
		isMessage ? msgDeletePermanently : convDeletePermanently,
		{
			id: 'More',
			icon: 'MoreVertical',
			label: t('tooltip.moreActions', 'More actions'),
			items: [
				normalizeDropdownActionItem(isMessage ? msgFlag : convFlag),
				normalizeDropdownActionItem(isMessage ? msgUnflag : convUnflag),
				normalizeDropdownActionItem(isMessage ? msgMoveToFolder : convMoveToFolder),
				isMessage ? msgTagItem : convTagItem,
				normalizeDropdownActionItem(isMessage ? msgSetAsSpam : convSetAsSpam),
				normalizeDropdownActionItem(isMessage ? msgSetAsNotSpam : convSetAsNotSpam),
				...(isMessage ? [normalizeDropdownActionItem(msgForwardAsAttachment)] : [])
			]
		} as DropdownItem
	];

	return <MultipleSelectionActionsComponent actions={actions} />;
};
