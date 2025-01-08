/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Grant } from '@zextras/carbonio-shell-ui';
import { TFunction } from 'i18next';

import type { Folder } from '../../carbonio-ui-commons/types/folder';
import type { AppDispatch } from '../../store/redux';
import type { Participant } from '../participant';

export type ShareCalendarModalProps = {
	openModal: () => void;
	setModal: (a: any) => void;
	dispatch: AppDispatch;
	t: TFunction;
	toggleSnackbar: () => void;
	folder: string;
	folders: any;
	allCalendars: any;
};

export type ResponseActionsProps = {
	dispatch: AppDispatch;
	t: TFunction;
	zid: string;
	view: string;
	rid: string;
	msgId: string;
	sharedFolderName: string;
	grantee: string;
	owner: string;
	role: string;
	allowedActions: string;
	participants: Participant[];
};

export type ReplyShareParameters = {
	data: any;
};

export type GranteeInfoProps = {
	grant: Grant;
	shareCalendarRoleOptions: ShareCalendarRoleOptions[];
	hovered?: boolean;
};

export type GranteeProps = {
	grant: Grant;
	folder: Folder;
	onMouseLeave?: () => void;
	onMouseEnter?: () => void;
	setActiveModal: (modal: string) => void;
	shareCalendarRoleOptions: ShareCalendarRoleOptions[];
};

export type ShareFolderPropertiesProps = {
	folder: Folder;
	setActiveModal: (modal: string) => void;
};

export type ShareCalendarRoleOptions = {
	label: string;
	value: string;
};
