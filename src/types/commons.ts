/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { AccordionFolder } from '@zextras/carbonio-shell-ui';
import { TFunction } from 'react-i18next';

export type ModalFooterProps = {
	mainAlignment?: string | undefined;
	crossAlignment?: string | undefined;
	padding?: Record<string, string> | undefined;
	onConfirm: (a: string) => void;
	secondaryAction?: () => void | undefined;
	label: string;
	secondaryLabel?: string | undefined;
	disabled?: boolean | undefined;
	secondaryDisabled?: boolean | undefined;
	background?: string | undefined;
	secondarybackground?: string | undefined;
	color?: string | undefined;
	secondaryColor?: string | undefined;
	size?: string | undefined;
	primaryBtnType?: string | undefined;
	secondaryBtnType?: string | undefined;
	showDivider?: boolean;
	tooltip?: string;
	secondaryTooltip?: string;
	paddingTop?: string;
};

export type SnackbarArgumentType = {
	key: string;
	replace: boolean;
	type: string;
	label: string;
	autoHideTimeout: number;
	hideButton?: boolean;
	actionLabel?: string;
	onActionClick?: TFunction;
};

export type ModalProps = {
	folder: AccordionFolder;
	onClose: () => void;
};

export type Crumb = {
	label: string;
	tooltip: string;
};

export type ResFolder = AccordionFolder &
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
