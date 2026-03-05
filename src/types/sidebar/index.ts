/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ReactElement, SyntheticEvent } from 'react';

import type { Folder, Folders, ResFolder } from '@zextras/carbonio-ui-commons';
import { Grant } from '@zextras/carbonio-ui-soap-lib';
import { Dictionary } from 'lodash';

import { ModalProps } from 'types/utils';

export type ActionType = {
	id: string;
	label: string;
	icon: string;
	onClick: (ev: React.SyntheticEvent) => void;
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

export type SidebarComponentProps = {
	accordions: Array<Folder>;
};

export type SidebarCustomItem = {
	item: {
		id: string;
		label: string;
		open: boolean;
		items: Folders;
		ownerName: string;
		ownerId: string;
		checked: boolean;
		folderId: string;
		setLinks: (arg: any) => void;
		links: Folder[];
		CustomComponent: ReactElement;
	};
};

export type ShareModalProps = {
	folders: Array<ResFolder>;
	onClose: () => void;
	goBack?: () => void;
};

export type SharedObject = {
	id: string;
	label: string;
	open: boolean;
	items: [];
	ownerName: string;
	ownerId: string;
	checked: boolean;
	folderId: string;
	setLinks: (links: Array<SharedObject>) => void;
	links: Array<SharedObject>;
	CustomComponent: any;
};

export type GroupedShare = Dictionary<SharedObject[]>;

export type EditPermissionsModalProps = ModalProps & {
	editMode?: boolean;
	goBack?: () => void;
	grant: any; // TODO FIX Grant type
};

export type FolderActionsProps = {
	id: string;
	icon: string;
	label: string;
	onClick: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent) => void;
	disabled?: boolean;
};

export type ShareRevokeModalType = {
	folder: Folder;
	onClose?: () => void;
	grant: Grant;
	goBack: () => void;
};

export type RetentionPoliciesProps = {
	showPolicy: boolean;
	setShowPolicy: (arg: boolean) => void;
	emptyRtnValue: boolean;
	setEmptyRtnValue: (arg: boolean) => void;
	dsblMsgRet: boolean;
	setDsblMsgRet: (arg: boolean) => void;
	rtnValue: string | number;
	setRtnValue: (arg: string | number) => void;
	retentionPeriod: Array<{
		label: string;
		value: string;
	}>;
	rtnYear: string | null;
	setRtnYear: (arg: string | null) => void;
	dsblMsgDis: boolean;
	setDsblMsgDis: (arg: boolean) => void;
	emptyDisValue: boolean;
	setEmptyDisValue: (arg: boolean) => void;
	purgeValue: number | string;
	setPurgeValue: (arg: string) => void;
	dspYear: string | null;
	setDspYear: (arg: string | null) => void;
	rtnRange: string;
	dspRange: string;
};

export type NameInputRowProps = {
	setInputValue: (value: string) => void;
	inputValue: string;
	showWarning: boolean;
	inpDisable: boolean;
	folderColor: string | undefined;
	setFolderColor: (value: string) => void;
};

export type MainEditModalPropType = ModalProps & {
	setActiveModal: (modal: string) => void;
};
