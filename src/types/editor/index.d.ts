/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { Folder } from '../../carbonio-ui-commons/types/folder';
import { EditViewActionsType } from '../../constants';
import { AppDispatch } from '../../store/redux';
import type { MailMessage } from '../messages';
import type { Participant } from '../participant';
import type { MailAttachment } from '../soap';

export type EditorAttachmentFiles = {
	contentType: string;
	disposition?: string;
	filename: string;
	name: string;
	size: number;
};

export type InlineAttachment = {
	ci: string;
	attach: { aid: string };
};

export type InlineAttachments =
	| Array<{
			ci: string;
			attach: { aid: string };
	  }>
	| Array[];

export type MailsEditor = {
	inline: InlineAttachments;
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

export type ReplyType = 'r' | 'w';

export type EditorRecipients = {
	to: Array<Participant>;
	cc: Array<Participant>;
	bcc: Array<Participant>;
};

export type EditorText = {
	plainText: string;
	richText: string;
};

export type EditorOperationAllowedStatus = {
	allowed: boolean;
	reason?: string;
};

export type DraftSaveProcessStatus = {
	status: 'completed' | 'running' | 'aborted';
	abortReason?: string;
	lastSaveTimestamp?: Date;
};

export type SendProcessStatus = {
	status: 'completed' | 'running' | 'aborted';
	abortReason?: string;
	cancel?: () => void;
};

export type MailsEditorV2 = {
	// the id of the editor (used to identify the editor in the store)
	id: string;
	// the type of action that generated the editor
	action: EditViewActionsType;
	// the id of the sender identity
	identityId: string;
	// the array of inline attachments
	// FIXME: InlineAttachments is not correctly defined, it should be properly typed once we start the refactor of the attachments
	inlineAttachments: Array<InlineAttachment>;
	// the array of non-inline attachments
	attachments: MailAttachment;
	// the array of attachment files
	attachmentFiles: Array<EditorAttachmentFiles>;
	// user defined delayed send timer
	autoSendTime?: number;
	// the saved draft id
	did?: string;
	// true if the message is rich text
	isRichText: boolean;
	// the text of the editor (html, plain)
	text: EditorText;
	// the subject of the message
	subject: string;
	// Message id of the message being replied to/forwarded (outbound messages only)
	originalId?: string;
	// the whole message being replied to/forwarded (outbound messages only)
	originalMessage?: MailMessage;
	// the recipients of the message being replied to/forwarded (outbound messages only)
	recipients: EditorRecipients;
	// flag to mark the message as urgent
	isUrgent: boolean;
	// flag to request a read receipt
	requestReadReceipt: boolean;
	// reply type
	replyType?: ReplyType;
	// allowed status of the draft save
	draftSaveAllowedStatus?: EditorOperationAllowedStatus;
	// status of the draft save
	draftSaveProcessStatus?: DraftSaveProcessStatus;
	// allowed status of the message send
	sendAllowedStatus?: EditorOperationAllowedStatus;
	// status of the message send
	sendProcessStatus?: SendProcessStatus;
	// dispatch function for the messages store
	messagesStoreDispatch: AppDispatch;
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
	zimbraPrefDefaultSignatureId?: string;
	zimbraPrefForwardReplySignatureId?: string;
};

type UseGetIdentitiesReturnType = {
	from: Partial<IdentityType> | undefined;
	activeFrom: IdentityType | undefined;
	identitiesList: Array<IdentityType>;
	hasIdentity: boolean | undefined;
};

type FindDefaultIdentityType = {
	list: Array<IdentityType>;
	allAccounts: Record<string, Folder>;
	folderId: string;
	currentMessage?: MailMessage;
	originalMessage?: MailMessage;
	account: Account;
	settings: AccountSettings;
};

type ThrottledSaveToDraftType = (data: Partial<MailsEditor>) => void;

type EditViewContextType =
	| {
			throttledSaveToDraft: ThrottledSaveToDraftType;
			editor: MailsEditor;
			setSendLater: (arg: boolean) => void;
	  }
	| Record<string, never>;
