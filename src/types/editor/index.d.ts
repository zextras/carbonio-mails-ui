/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { Folder } from '../../carbonio-ui-commons/types/folder';
import { CLOSE_BOARD_REASON } from '../../constants';
import { type AppDispatch } from '../../store/redux';
import { SavedAttachment, UnsavedAttachment } from '../attachments';
import type { MailMessage } from '../messages';
import type { Participant } from '../participant';

/**
 * @deprecated
 */
export type EditorAttachmentFiles = {
	id: string;
	contentType: string;
	disposition?: string;
	filename?: string;
	name: string;
	size: number;
	uploadProgress: number;
	fileSize: number;
	uploadProcessStatus?: AttachmentUploadProcessStatus;
};

/**
 * @deprecated
 */
export type InlineAttachment = {
	ci: string;
	attach: { aid: string };
};

/**
 * @deprecated
 */
export type InlineAttachments =
	| Array<{
			ci: string;
			attach: { aid: string };
	  }>
	| Array[];

/**
 * @deprecated
 */
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

/**
 * The data that are allowed to be provided from outside the editor
 * to prefill it (e.g. from shared functions)
 * We keep as separate type (instead of a Partial<MailsEditorV2>)
 * to de-couple the inner logic and to hide internal implementation
 * details (e.g. editor status flags, stored callbacks, etc...)
 */
export type EditorPrefillData = {
	aid?: Array<string>;
	subject?: string;
	urgent?: boolean;
	recipients?: Array<Partial<Participant>>;
	/**
	 * @deprecated - added for backward compatibility
	 */
	text?: [string, string];
	/**
	 * @deprecated - added for backward compatibility
	 */
	to?: Array<Partial<Participant>>;
};

export type EditViewActionsType = (typeof EditViewActions)[keyof typeof EditViewActions];

export type AddEditorParams = {
	id: MailsEditorV2['id'];
	editor: MailsEditorV2;
};

export type MailsEditorV2 = {
	// the id of the editor (used to identify the editor in the store)
	id: string;
	// the type of action that generated the editor
	action: EditViewActionsType;
	// the id of the sender identity
	identityId: string;
	unsavedAttachments: Array<UnsavedAttachment>;
	savedAttachments: Array<SavedAttachment>;
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
	// value of the current signature
	signature?: string;
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

type ThrottledSaveToDraftType = (data: Partial<MailsEditorV2>) => void;

type EditViewContextType =
	| {
			throttledSaveToDraft: ThrottledSaveToDraftType;
			editor: MailsEditor;
			setSendLater: (arg: boolean) => void;
	  }
	| Record<string, never>;

type CloseBoardReasons = (typeof CLOSE_BOARD_REASON)[keyof typeof CLOSE_BOARD_REASON];
