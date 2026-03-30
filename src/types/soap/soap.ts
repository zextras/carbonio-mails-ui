/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { Folder } from '@zextras/carbonio-ui-commons';

import { MAIL_VERIFICATION_HEADERS } from 'constants/index';
import { MailAttachment, SoapDraftMessageObj } from 'types/soap/save-draft';

export type MailVerificationHeader =
	(typeof MAIL_VERIFICATION_HEADERS)[keyof typeof MAIL_VERIFICATION_HEADERS];

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

export type FolderActionGrant = {
	op: 'grant';
	id: string;
	grant: {
		gt: 'usr';
		d: string;
		perm: string;
		pw: string;
		inh?: '0' | '1';
	};
};
export type FolderActionRequest = {
	action: FolderActionRename | FolderActionMove | FolderActionDelete | FolderActionGrant;
};

export type FolderActionResponse =
	| {
			folder: Array<ISoapFolderObj>;
	  }
	| ErrorSoapBodyResponse;

export type CreateFolderRequest = unknown;

export type CreateFolderResponse = { folder: Array<Partial<Folder>> } | ErrorSoapBodyResponse;

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

export type BatchedRequest = {
	_jsns: 'urn:zimbraMail';
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

export type GetConvParameters = {
	conversationId: string;
	fetch?: string;
	folderId?: string;
	html: boolean;
	onConversationIdChange?: (newConversationId: string) => void;
};

export type SaveDraftParameters = {
	soapDraftMessageObj: SoapDraftMessageObj;
	signal?: AbortSignal;
	attach?: MailAttachment;
};
