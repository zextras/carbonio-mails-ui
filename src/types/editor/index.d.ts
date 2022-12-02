/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export type EditorAttachmentFiles = {
	contentType: string;
	disposition: string;
	fileName?: string;
	filename: string;
	name: string;
	size: number;
};

export type InlineAttachedType =
	| Array<{
			ci: string;
			attach: { aid: string };
	  }>
	| Array[];
export type MailsEditor = {
	inline: InlineAttachedType;
	autoSendTime?: number;
	id: string | undefined;
	did?: string | undefined;
	oldId?: string | undefined;
	editorId: string;
	richText: boolean;
	text: [string, string];
	subject: string;
	original?: MailMessage;
	attach: mailAttachment;
	to: Array<Participant>;
	bcc: Array<Participant>;
	cc: Array<Participant>;
	participants?: Array<Participant> | undefined;
	from: Participant;
	sender?: Participant | any;
	urgent: boolean;
	requestReadReceipt?: boolean;
	attachmentFiles: Array<EditorAttachmentFiles>;
	rt?: string | undefined;
	origid?: string | undefined;
};

type IdentityType = {
	value: string;
	label: string;
	address: string;
	fullname: string;
	fullName?: string;
	type: string;
	identityName: string;
	displayName?: string;
};

type UseGetIdentitiesReturnType = {
	from: Partial<IdentityType> | undefined;
	activeFrom: IdentityType | undefined;
	identitiesList: Array<IdentityType>;
	hasIdentity: boolean | undefined;
};

type FindDefaultIdentityType = {
	list: Array<IdentityType>;
	allAccounts: Record<string, Folder & { owner: string }>;
	folderId: string;
};

type ThrottledSaveToDraftType = (data: Partial<MailsEditor>) => void;

type EditViewContextType =
	| {
			throttledSaveToDraft: ThrottledSaveToDraftType;
			editor: MailsEditor;
			setSendLater: (arg: boolean) => void;
	  }
	| Record<string, never>;
