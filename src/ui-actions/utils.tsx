/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ItemType } from '@zextras/carbonio-design-system';
import { FOLDERS } from '@zextras/carbonio-shell-ui';

import { deleteMessagePermanently, moveMsgToTrash, setMsgRead } from './message-actions';
import { AppDispatch } from '../store/redux';
import type { Conversation, MailMessage, MessageActionReturnType } from '../types';

type GetPimaryActionsProps = {
	folderIds: Array<string>;
	showReadConvo: boolean;
	showUnreadConvo: boolean;
	ids: Array<string>;
	dispatch: AppDispatch;
	deselectAll: () => void;
};

type GetPrimaryActionsReturnType = (
	| false
	| MessageActionReturnType
	| {
			id: string;
			items: ItemType[];
			customComponent: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
	  }
)[];

const getPrimaryActionsSingleFolder = ({
	folderIds,
	showReadConvo,
	showUnreadConvo,
	ids,
	dispatch,
	deselectAll
}: GetPimaryActionsProps): GetPrimaryActionsReturnType => {
	switch (folderIds[0]) {
		case FOLDERS.SPAM:
		case FOLDERS.INBOX:
			return [
				showReadConvo &&
					setMsgRead({ ids, value: true, dispatch, folderId: folderIds[0], deselectAll }),
				showUnreadConvo &&
					setMsgRead({ ids, value: false, dispatch, folderId: folderIds[0], deselectAll }),
				moveMsgToTrash({
					ids,
					dispatch,
					deselectAll,
					folderId: folderIds[0]
				})
			];
		case FOLDERS.SENT:
			return [moveMsgToTrash({ ids, dispatch, deselectAll, folderId: folderIds[0] })];

		case FOLDERS.DRAFTS:
			return [moveMsgToTrash({ ids, dispatch, deselectAll, folderId: folderIds[0] })];

		case FOLDERS.TRASH:
			return [deleteMessagePermanently({ ids, dispatch, deselectAll })];

		default:
			return [moveMsgToTrash({ ids, dispatch, deselectAll, folderId: folderIds[0] })];
	}
};

const getPrimaryActionsMultipleFolder = ({
	folderIds,
	showReadConvo,
	showUnreadConvo,
	ids,
	dispatch,
	deselectAll
}: GetPimaryActionsProps): GetPrimaryActionsReturnType => {
	switch (folderIds[0]) {
		case FOLDERS.SPAM:
		case FOLDERS.INBOX:
			return [
				showReadConvo &&
					setMsgRead({ ids, value: true, dispatch, folderId: folderIds[0], deselectAll }),
				showUnreadConvo &&
					setMsgRead({ ids, value: false, dispatch, folderId: folderIds[0], deselectAll }),
				moveMsgToTrash({
					ids,
					dispatch,
					deselectAll,
					folderId: folderIds[0]
				})
			];
		case FOLDERS.SENT:
			return [moveMsgToTrash({ ids, dispatch, deselectAll, folderId: folderIds[0] })];

		case FOLDERS.DRAFTS:
			return [moveMsgToTrash({ ids, dispatch, deselectAll, folderId: folderIds[0] })];

		case FOLDERS.TRASH:
			return [deleteMessagePermanently({ ids, dispatch, deselectAll })];

		default:
			return [moveMsgToTrash({ ids, dispatch, deselectAll, folderId: folderIds[0] })];
	}
};

export const getPrimaryActions = ({
	folderIds,
	showReadConvo,
	ids,
	dispatch,
	deselectAll,
	showUnreadConvo
}: GetPimaryActionsProps): GetPrimaryActionsReturnType => {
	if (folderIds.length === 1) {
		return getPrimaryActionsSingleFolder({
			folderIds,
			showReadConvo,
			showUnreadConvo,
			ids,
			dispatch,
			deselectAll
		});
	}
	if (folderIds.length > 1) {
		return getPrimaryActionsMultipleFolder({
			folderIds,
			showReadConvo,
			showUnreadConvo,
			ids,
			dispatch,
			deselectAll
		});
	}

	return [];
};

type GetFolderParentIdProps = {
	folderId: string;
	isConversation: boolean;
	items: Array<Partial<MailMessage> & Pick<MailMessage, 'id'>> | Array<Conversation>;
};

export function getFolderParentId({
	folderId,
	isConversation,
	items
}: GetFolderParentIdProps): string {
	if (folderId) return folderId;
	if (isConversation) return (items as Conversation[])?.[0]?.messages?.[0]?.parent;
	return (items as MailMessage[])?.[0]?.parent;
}
