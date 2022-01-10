/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Dispatch } from 'redux';

export type ShareCalendarModalProps = {
	openModal: () => void;
	setModal: (a: any) => void;
	dispatch: Dispatch;
	t: (...args: any[]) => string;
	toggleSnackbar: () => void;
	folder: string;
	folders: any;
	allCalendars: any;
};

export type ShareFolderModalProps = {
	openModal: () => void;
	setModal: (a: any) => void;
	dispatch: Dispatch;
	t: (...args: any[]) => string;
	createSnackbar: (obj: any) => void;
	folder: any;
	folders: any;
	allFolders: any;
};

export type ResponseActionsProps = {
	dispatch: Dispatch;
	t: (...args: any[]) => string;
	createSnackbar: any;
	zid: string;
	view: string;
	rid: string;
	msgId: string;
	sharedCalendarName: string;
	grantee: string;
	owner: string;
	role: string;
	allowedActions: string;
	participants: any;
};
