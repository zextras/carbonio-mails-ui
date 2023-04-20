/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type RegisterActionType = {
	id: string;
	label: string;
	icon: string;
	onClick: (ev: React.SyntheticEvent) => void;
	disabled: boolean;
};

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
	accordions: Array<AccordionFolder>;
};

export type SidebarProps = {
	expanded: boolean;
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
};

export type FolderActionsProps = {
	id: string;
	icon: string;
	label: string;
	onClick: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent) => void;
	disabled?: boolean;
};

export type DragEnterAction =
	| undefined
	| {
			success: false;
	  };

export type OnDropActionProps = {
	event: React.DragEvent;
	type: string;
	data: DataProps;
};

export type ShareRevokeModalType = {
	folder: Folder;
	onClose?: () => void;
	grant: GrantType;
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
