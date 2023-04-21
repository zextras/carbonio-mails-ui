/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Grant } from '@zextras/carbonio-shell-ui';
import type { AppDispatch } from '../../store/redux';
import { Participant } from '../participant';

export type ShareCalendarModalProps = {
	openModal: () => void;
	setModal: (a: any) => void;
	dispatch: AppDispatch;
	t: (...args: any[]) => string;
	toggleSnackbar: () => void;
	folder: string;
	folders: any;
	allCalendars: any;
};

export type ResponseActionsProps = {
	dispatch: AppDispatch;
	t: (...args: any[]) => string;
	zid: string;
	view: string;
	rid: string;
	msgId: string;
	sharedCalendarName: string;
	grantee: string;
	owner: string;
	role: string;
	allowedActions: string;
	participants: Participant[s];
};

export type ReplyShareParameters = {
	data: any;
};

export type GranteeInfoProps = {
	grant: Grant;
	shareCalendarRoleOptions: ShareCalendarRoleOptions;
	hovered?: boolean;
};

export type GranteeProps = {
	grant: Grant;
	folder: FolderType;
	onMouseLeave?: () => void;
	onMouseEnter?: () => void;
	setActiveModal: (modal: string) => void;
	shareCalendarRoleOptions: ShareCalendarRoleOptions;
};

export type ShareFolderPropertiesProps = {
	folder: FolderType | Folder;
	setActiveModal;
};

export type ShareCalendarRoleOptions = {
	label: string;
	value: string;
};
