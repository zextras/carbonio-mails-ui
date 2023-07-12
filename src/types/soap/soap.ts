/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { AccountSettingsPrefs } from '@zextras/carbonio-shell-ui';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui/types/network/soap';
import { Folder } from '../../carbonio-ui-commons/types/folder';
import { MailsEditor, MailsEditorV2 } from '../editor';
import { PrefsType } from '../settings';
import { EmailAddresses } from './redirect-message-action';
import { SaveDraftResponse } from './save-draft';

export type IFolderView =
	| 'search folder'
	| 'tag'
	| 'conversation'
	| 'message'
	| 'contact'
	| 'document'
	| 'appointment'
	| 'virtual conversation'
	| 'remote folder'
	| 'wiki'
	| 'task'
	| 'chat';

type mapContactIds = {
	ids: string;
};

export type ISoapFolderObj = {
	absFolderPath: string;
	activesyncdisabled: boolean;
	deletable: boolean;
	folder?: Array<ISoapFolderObj>;
	i4ms: number;
	i4next: number;
	id: string;
	color: string;
	rgb: string;
	/** Parent ID */ l: string;
	luuid: string;
	ms: number;
	/** Count of non-folder-panel items */ n: number;
	name: string;
	rev: number;
	/** Size */ s: number;
	/** Count of unread messages */ u?: number;
	uuid: string;
	absParent?: string;
	view: IFolderView;
	cn: Array<mapContactIds>;
	webOfflineSyncDays: number;
};

export type ISoapSyncFolderObj = {
	folder: Array<ISoapSyncFolderObj>;
	absFolderPath: string;
	acl: unknown;
	activesyncdisabled: boolean;
	color: number;
	deletable: boolean;
	f: string;
	i4ms: number;
	i4next: number;
	id: string;
	l: string;
	luuid: string;
	md: number;
	mdver: number;
	meta: Array<unknown>;
	ms: number;
	n: number;
	name: string;
	retentionPolicy: Array<unknown>;
	rev: number;
	s: number;
	u: number;
	url: string;
	uuid: string;
	view: IFolderView;
	webOfflineSyncDays: number;
	rgb: string;
	rid: string;
	zid: string;
	perm: string;
	owner: string;
};

export type SoapContact = {
	d: number;
	fileAsStr: string;
	id: string;
	l: string;
	rev: number;
	_attrs: {
		type?: string;
		firstName?: string;
		fullName?: string;
		lastName?: string;
		jobTitle?: string;
		middleName?: string;
		nickname?: string;
		nameSuffix?: string;
		namePrefix?: string;
		mobilePhone?: string;
		workPhone?: string;
		otherPhone?: string;
		department?: string;
		email?: string;
		notes?: string;
		company?: string;
		otherStreet?: string;
		otherPostalCode?: string;
		otherCity?: string;
		otherState?: string;
		otherCountry?: string;
		image?: {
			part: string;
			ct: string;
			s: number;
			filename: string;
		};
	};
};

export type SyncResponseContactFolder = ISoapSyncFolderObj & {
	cn: Array<{
		ids: string; // Comma-separated values
	}>;
	folder: Array<SyncResponseContactFolder>;
};

export type SyncResponseContact = {
	d: number;
	id: string;
	l: string;
	md: number;
	ms: number;
	rev: number;
};

type FolderActionRename = {
	op: 'rename';
	id: string;
	name: string;
};

type FolderActionMove = {
	op: 'move';
	id: string;
	l: string;
};

type FolderActionDelete = {
	op: 'delete';
	id: string;
};

export type FolderActionRequest = {
	action: FolderActionRename | FolderActionMove | FolderActionDelete;
};

export type FolderActionResponse = {
	folder: Array<ISoapFolderObj> | ErrorSoapBodyResponse;
};

export type CreateFolderRequest = unknown;

export type CreateFolderResponse = Promise<
	{ folder: Array<Partial<Folder>> } | ErrorSoapBodyResponse
>;

export type CreateContactRequestAttr =
	| { n: 'firstName'; _content: string }
	| { n: 'lastName'; _content: string }
	| { n: 'fullName'; _content: string }
	| { n: 'nameSuffix'; _content: string }
	| { n: 'image'; aid?: string }
	| { n: 'jobTitle'; _content: string }
	| { n: 'department'; _content: string }
	| { n: 'company'; _content: string }
	| { n: 'notes'; _content: string }
	| { n: 'email'; _content: string };

export type CreateContactRequest = {
	cn: {
		m: unknown[];
		l: string;
		a: Array<CreateContactRequestAttr>;
	};
};

export type ModifyContactRequestAttr = CreateContactRequestAttr;

export type ModifyContactRequest = {
	force: '0' | '1'; // Default to '1'
	replace: '0' | '1'; // Default to '0'
	cn: {
		a: Array<ModifyContactRequestAttr>;
		id: string;
		m: unknown[];
	};
};

type ContactActionMove = {
	op: 'move';
	id: string;
	l: string;
};

type ContactActionDelete = {
	op: 'delete';
	id: string;
};

export type ContactActionRequest = {
	action: ContactActionMove | ContactActionDelete;
};

export type CreateContactResponse = {
	cn: Array<SoapContact>;
};

export type BatchedRequest = {
	_jsns: 'urn:zimbraMail';
	requestId: string;
};

export type BatchedResponse = {
	requestId: string;
};

export type BatchRequest = {
	_jsns: 'urn:zimbra';
	onerror: 'continue';
	CreateFolderRequest?: Array<BatchedRequest & CreateFolderRequest>;
	FolderActionRequest?: Array<BatchedRequest & FolderActionRequest>;
	CreateContactRequest?: Array<BatchedRequest & CreateContactRequest>;
	ModifyContactRequest?: Array<BatchedRequest & ModifyContactRequest>;
	ContactActionRequest?: Array<BatchedRequest & ContactActionRequest>;
};

export type BatchResponse = {
	CreateFolderResponse?: Array<BatchedResponse & CreateFolderResponse>;
	CreateContactResponse?: Array<BatchedResponse & CreateContactResponse>;
};

export type GetContactRequest = {
	_jsns: 'urn:zimbraMail';
	cn: Array<{
		id: string;
	}>;
};

export type GetContactsResponse = {
	cn: Array<SoapContact>;
};

export type GetConvParameters = {
	conversationId: string;
	fetch?: string;
	folderId?: string;
};

export type RedirectActionParameters = {
	id: string;
	e: EmailAddresses[];
};

export type SaveDraftNewParameters = {
	data: MailsEditor;
	prefs?: Partial<AccountSettingsPrefs>;
	signal?: AbortSignal;
};

export type saveDraftNewResult = {
	resp: SaveDraftResponse;
};

export type SaveDraftParameters = {
	editor: MailsEditorV2;
	signal?: AbortSignal;
};

export type saveDraftResult = {
	resp: SaveDraftResponse;
};
