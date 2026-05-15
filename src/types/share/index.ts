/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Folder, Grant } from '@zextras/carbonio-ui-commons';
import { TFunction } from 'i18next';

import type { Participant } from 'types/participant';

export type ResponseActionsProps = {
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

export type GranteeInfoProps = {
	grant: Grant;
	shareCalendarRoleOptions: ShareCalendarRoleOptions[];
	hovered?: boolean;
};

export type GranteeProps = {
	grant: Grant;
	folder: Folder;
	onEdit: (grant: Grant) => void;
	onRevoke: (grant: Grant) => void;
};

export type ShareFolderPropertiesProps = {
	folder: Folder;
	grants: Grant[];
	onEdit: (grant: Grant) => void;
	onRevoke: (grant: Grant) => void;
};

export type ShareCalendarRoleOptions = {
	label: string;
	value: string;
};
