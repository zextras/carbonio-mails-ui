/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type RegisterActionType = {
	id: string;
	label: string;
	icon: string;
	click: (ev: React.SyntheticEvent) => void;
	disabled: boolean;
};

export type ActionType = {
	id: string;
	label: string;
	icon: string;
	click: (ev: React.SyntheticEvent) => void;
	type?: string;
	primary?: boolean;
	group?: string;
	disabled?: boolean;
	[key: string]: unknown;
};

export type Contact = {
	middleName: string;
	firstName: string;
	email: { email: { mail: string } };
	address: string;
};
