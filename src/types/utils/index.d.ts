/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { TextProps } from '@zextras/carbonio-design-system';

import type { Folder } from '../../carbonio-ui-commons/types/folder';

export type ModalProps = {
	folder: Folder;
	onClose: () => void;
};

export type Crumb = {
	label: string;
	tooltip: string;
};

export type TextReadValuesProps = {
	color: string;
	weight: TextProps['weight'];
	badge: 'unread' | 'read';
};

export type ServicesCatalog = Array<string>;
export type AppContext = {
	isMessageView: boolean;
	count: number;
	setCount: (arg: number | ((prevState: number) => number)) => void;
	catalog: ServicesCatalog;
};

export type ThemeObj = {
	windowObj: Window;
	breakpoints: {
		width: number;
		aspectRatio: number;
	};
	borderRadius: string;
	fonts: {
		default: string;
		weight: { light: number; regular: number; medium: number; bold: number };
	};
	sizes: {
		font: ThemeSizeObjExtended;
		icon: ThemeSizeObj;
		avatar: Omit<ThemeSizeObjExtended<{ diameter: string; font: string }>, 'extrasmall'>;
		padding: ThemeSizeObjExtended;
	};
	icons: Record<string, IconComponent>;
	loginBackground: string;
	logo: {
		svg: IconComponent;
		size: ThemeSizeObj;
	};
	palette: Record<
		| 'currentColor'
		| 'transparent'
		| 'primary'
		| 'secondary'
		| 'header'
		| 'highlight'
		| 'gray0'
		| 'gray1'
		| 'gray2'
		| 'gray3'
		| 'gray4'
		| 'gray5'
		| 'gray6'
		| 'warning'
		| 'error'
		| 'success'
		| 'info'
		| 'text',
		ThemeColorObj
	>;
	avatarColors: Record<`avatar_${number}`, string>;
};

export type GetAttachmentsDownloadLinkProps = {
	messageId: string;
	messageSubject: string;
	attachments: Array<string | undefined>;
};

export type DragItemWrapperProps = {
	item: MailMessage | Conversation;
	selectedIds: Array<string>;
	selectedItems: Record<string, boolean>;
	setDraggedIds: (ids: Record<string, boolean>) => void;
	dragImageRef: React.RefObject<HTMLElement> | undefined;
	dragAndDropIsDisabled: boolean;
	deselectAll: () => void;
};
