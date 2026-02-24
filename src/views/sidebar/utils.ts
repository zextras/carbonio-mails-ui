/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { type AccordionItemType } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import {
	DragEnterAction,
	Folder,
	FOLDERS,
	isSystemFolder,
	OnDropActionProps,
	ROOT_NAME,
	ZIMBRA_STANDARD_COLORS
} from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import { getFolderIdParts, isDraft, isSpam } from 'helpers/folders';

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

/**
 * Get the icon name for a folder
 * @param folder - The folder object
 * @param withNotificationDot - Whether to add a notification dot to the icon name
 *
 * NOTE: Icons with dots are not available in the design system, they are provided by the
 * {@link StyledWrapper} component.
 */
export const getFolderIconName = (
	folder: Folder | AccordionItemType,
	withNotificationDot = false
): string | null => {
	const { id } = getFolderIdParts(folder.id);

	if (
		id === FOLDERS.USER_ROOT ||
		('isLink' in folder && folder.isLink && folder.oname === ROOT_NAME)
	) {
		return null;
	}

	let iconName: string;

	if (id && isSystemFolder(id)) {
		switch (id) {
			case FOLDERS.INBOX:
				iconName = 'InboxOutline';
				break;
			case FOLDERS.DRAFTS:
				iconName = 'FileOutline';
				break;
			case FOLDERS.SENT:
				iconName = 'PaperPlaneOutline';
				break;
			case FOLDERS.SPAM:
				iconName = 'SlashOutline';
				break;
			case FOLDERS.TRASH:
				iconName = 'Trash2Outline';
				break;
			case FOLDERS.ARCHIVE:
				iconName = 'ArchiveOutline';
				break;
			default:
				iconName = 'FolderOutline';
		}
	} else {
		iconName = 'FolderOutline';
	}

	return withNotificationDot ? `${iconName}WithDot` : iconName;
};

export const useTranslatedSystemFolders = (): Array<string> => {
	const [translate] = useTranslation();
	return useMemo(
		() => [
			translate('folders.inbox', 'Inbox'),
			translate('folders.sent', 'Sent'),
			translate('folders.drafts', 'Drafts'),
			translate('folders.trash', 'Trash'),
			translate('folders.spam', 'Spam'),
			translate('folders.junk', 'Junk'),
			translate('folders.archive', 'Archive')
		],
		[translate]
	);
};

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
			case 'Archive':
				return t('folders.archive', 'Archive');
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
		const restrictedDestinations = new Set<string>([FOLDERS.USER_ROOT]);
		const restrictedInboxTargets = new Set<string>([FOLDERS.SENT, FOLDERS.DRAFTS]);
		const restrictedDraftTargets = new Set<string>([FOLDERS.TRASH]);

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

export function getTotalUnreadCount(folder: Folder): number {
	let count = folder.u ?? 0;

	folder.children?.forEach((subfolder) => {
		count += getTotalUnreadCount(subfolder);
	});

	return count;
}

export function getTotalUnreadCountInSubfolders(folder: Folder): number {
	let count = 0;
	if (folder.children?.length) {
		folder.children.forEach((subfolder) => {
			count += getTotalUnreadCount(subfolder);
		});
	}
	return count;
}

export function folderHasChildren(folder: Folder): boolean {
	return folder.children?.length > 0;
}
