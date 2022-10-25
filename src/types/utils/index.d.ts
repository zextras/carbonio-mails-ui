/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { TextProps } from '@zextras/carbonio-design-system';
import { Folder } from '@zextras/carbonio-shell-ui';

export type CreateSnackbar = (arg: {
	key: string;
	replace?: boolean;
	type: string;
	hideButton?: boolean;
	label: string;
	autoHideTimeout: number;
	actionLabel?: string;
	onActionClick?: () => void;
}) => void;

export type ModalProps = {
	folder: Folder;
	onClose: () => void;
};

export type Crumb = {
	label: string;
	tooltip: string;
};

export type ResFolder = Folder &
	Partial<{
		folderId: number;
		folderPath: string;
		folderUuid: string;
		granteeId: string;
		granteeName: string;
		granteeType: string;
		mid: string;
		ownerEmail: string;
		ownerId: string;
		ownerName: string;
		rights: string;
		view: string;
	}>;

export type DataProps = {
	id: string;
	date: number;
	msgCount: number;
	unreadMsgCount: number;
	messages: [
		{
			id: string;
			parent: string;
			date: number;
		}
	];
	participants: [
		{
			type: string;
			address: string;
			name: string;
			fullName: string;
		},
		{
			type: string;
			address: string;
			name: string;
		}
	];
	subject: string;
	fragment: string;
	read: false;
	attachment: false;
	flagged: false;
	urgent: false;
	parentFolderId: string;
	selectedIDs: Array<string>;
};

export type TextReadValuesProps = {
	color: string;
	weight: TextProps['weight'];
	badge: 'unread' | 'read';
};

export type AppContext = {
	isMessageView: boolean;
	count: number;
	setCount: (arg: number) => void;
};
