/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { type AccordionItemType } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { ROOT_NAME, ZIMBRA_STANDARD_COLORS } from '../../carbonio-ui-commons/constants';
import { FOLDERS } from '../../carbonio-ui-commons/constants/folders';
import { isSystemFolder } from '../../carbonio-ui-commons/helpers/folders';
import { type Folder } from '../../carbonio-ui-commons/types/folder';
import { DragEnterAction, OnDropActionProps } from '../../carbonio-ui-commons/types/sidebar';
import { getFolderIdParts, isDraft, isSpam } from '../../helpers/folders';

export const capitalise = (word: string): string => {
	const asciiRef = word?.charCodeAt(0);
	const newAsciiRef = asciiRef - 32;
	const newChar = String.fromCharCode(newAsciiRef);
	return word ? newChar + word.substring(1) : '';
};

export const getFolderIconColor = (f: Folder | AccordionItemType): string => {
	if ('color' in f && f?.color) {
		return Number(f.color) < 10
			? ZIMBRA_STANDARD_COLORS[Number(f.color)].hex
			: (f?.rgb ?? ZIMBRA_STANDARD_COLORS[0].hex);
	}
	return ZIMBRA_STANDARD_COLORS[0].hex;
};

export const getFolderIconName = (folder: Folder | AccordionItemType): string | null => {
	const { id } = getFolderIdParts(folder.id);
	if (
		id === FOLDERS.USER_ROOT ||
		('isLink' in folder && folder.isLink && folder.oname === ROOT_NAME)
	) {
		return null;
	}

	if (id && isSystemFolder(id)) {
		switch (id) {
			case FOLDERS.INBOX:
				return 'InboxOutline';
			case FOLDERS.DRAFTS:
				return 'FileOutline';
			case FOLDERS.SENT:
				return 'PaperPlaneOutline';
			case FOLDERS.SPAM:
				return 'SlashOutline';
			case FOLDERS.TRASH:
				return 'Trash2Outline';
			default:
				return 'FolderOutline';
		}
	}
	return 'FolderOutline';
};

export const translatedSystemFolders = (): Array<string> => [
	t('folders.inbox', 'Inbox'),
	t('folders.sent', 'Sent'),
	t('folders.drafts', 'Drafts'),
	t('folders.trash', 'Trash'),
	t('folders.spam', 'Spam'),
	t('folders.junk', 'Junk')
];

type GetSystemFolderProps = {
	folderId?: string;
	folderName: string;
};

export const getSystemFolderTranslatedName = ({ folderName }: GetSystemFolderProps): string => {
	if (folderName) {
		switch (folderName) {
			case 'Inbox':
				return t('folders.inbox', 'Inbox');
			case 'Sent':
				return t('folders.sent', 'Sent');
			case 'Drafts':
				return t('folders.drafts', 'Drafts');
			case 'Trash':
				return t('folders.trash', 'Trash');
			case 'Spam':
				return t('folders.spam', 'Spam');
			case 'Junk':
				return t('folders.junk', 'Junk');
			default:
				return folderName;
		}
	}
	return folderName;
};

export const getFolderTranslatedName = ({ folderId, folderName }: GetSystemFolderProps): string => {
	const { id } = getFolderIdParts(folderId ?? '');
	if (id && isSystemFolder(id)) {
		return getSystemFolderTranslatedName({ folderName });
	}

	return folderName;
};

export function handleDragEnter(data: OnDropActionProps, folder: Folder): DragEnterAction {
	const { type, data: itemData } = data;
	const { id, isLink, perm } = folder;

	const isInbox = itemData.parentFolderId === FOLDERS.INBOX;
	const isDrafts = itemData.parentFolderId === FOLDERS.DRAFTS;
	const isTrash = itemData.parentFolderId === FOLDERS.TRASH;

	if (type === 'conversation' || type === 'message') {
		const restrictedDestinations = new Set([FOLDERS.USER_ROOT]);
		const restrictedInboxTargets = new Set([FOLDERS.SENT, FOLDERS.DRAFTS]);
		const restrictedDraftTargets = new Set([FOLDERS.TRASH]);

		if (
			itemData.parentFolderId === id || // same folder not allowed
			(isInbox && restrictedInboxTargets.has(id)) || // Inbox to Draft/Sent not allowed
			(isDrafts && !restrictedDraftTargets.has(id)) || // Drafts only to Trash
			(id === FOLDERS.DRAFTS && !isTrash) || // Only Trash to Drafts
			(isLink && !perm?.includes('w')) || // Shared folder must have write permission
			restrictedDestinations.has(id) || // Root not allowed
			(isLink && folder.oname === ROOT_NAME) // Root link not allowed
		) {
			return { success: false };
		}
	}

	if (type === 'folder') {
		if (
			id === itemData.id || // Same folder not allowed
			isLink || // Shared folder not allowed
			isDraft(id) || // Drafts not allowed
			isSpam(id) // Spam not allowed
		) {
			return { success: false };
		}
	}

	return undefined;
}
