/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { TFunction } from 'i18next';

export const MAILS_ROUTE = 'mails';

export const MAIL_APP_ID = 'carbonio-mails-ui';

type AttachmentTypeItemsConstantProps = {
	label: string;
	icon: string;
	searchString: string;
};

export const attachmentTypeItemsConstant = (
	t: TFunction
): Array<AttachmentTypeItemsConstantProps> => [
	{
		label: t('attachment_type.application', 'Application'),
		icon: 'Code',
		searchString: 'attachment:application/*'
	},
	{
		label: t('attachment_type.email', 'Email'),
		icon: 'Email',
		searchString: 'attachment:message/rfc822'
	},
	{
		label: t('attachment_type.excel', 'Excel'),
		icon: 'FileCalc',
		searchString: 'attachment:application/vnd.ms-excel'
	},
	{
		label: t('attachment_type.html', 'HTML'),
		icon: 'FileHtml',
		searchString: 'attachment:text/html'
	},
	{
		label: t('attachment_type.image', 'Image'),
		icon: 'Image',
		searchString: 'attachment:image'
	},
	{
		label: t('attachment_type.pdf', 'PDF'),
		icon: 'FilePdf',
		searchString: 'attachment:application/pdf'
	},
	{
		label: t('attachment_type.powerpoint', 'Powerpoint'),
		icon: 'FilePresentation',
		searchString: 'attachment:application/vnd.ms-powerpoint'
	},
	{
		label: t('attachment_type.text_document', 'Text Document'),
		icon: 'FileText',
		searchString: 'attachment:text'
	},
	{
		label: t('attachment_type.video', 'Video'),
		icon: 'Video',
		searchString: 'attachment:video'
	},
	{
		label: t('attachment_type.word', 'Word'),
		icon: 'FileText',
		searchString: 'attachment:word'
	},
	{
		label: t('attachment_type.zipped_file', 'Zipped File'),
		icon: 'FileZip',
		searchString: 'attachment:application/zip OR attachment:application/x-zip-compressed'
	}
];

type EmailStatusItemsConstantProps = {
	label: string;
	searchString: string;
};

export const emailStatusItemsConstant = (t: TFunction): Array<EmailStatusItemsConstantProps> => [
	{
		label: t('email_status.read', 'read'),
		searchString: 'is:read'
	},
	{
		label: t('email_status.unread', 'unread'),
		searchString: 'is:unread'
	},
	{
		label: t('email_status.flagged', 'flagged'),
		searchString: 'is:flagged'
	},
	{
		label: t('email_status.unflagged', 'not flagged'),
		searchString: 'is:unflagged'
	},
	{
		label: t('email_status.draft', 'draft'),
		searchString: 'is:draft'
	},
	{
		label: t('email_status.sent', 'sent by me'),
		searchString: 'is:sent'
	},
	{
		label: t('email_status.received', 'received by me'),
		searchString: 'is:recevided'
	},
	{
		label: t('email_status.replied', 'answered by me'),
		searchString: 'is:replied'
	},
	{
		label: t('email_status.unreplied', 'not answered by me'),
		searchString: 'is:unreplied'
	},
	{
		label: t('email_status.forwarded', 'forwarded'),
		searchString: 'is:forwarded'
	},
	{
		label: t('email_status.unforwarded', 'not forwarded'),
		searchString: 'is:unforwarded'
	},
	{
		label: t('email_status.invitations', 'invitations'),
		searchString: 'is:invite'
	},
	{
		label: t('email_status.solo', 'conversations with a single message'),
		searchString: 'is:solo'
	},
	{
		label: t('email_status.fromme', 'from me'),
		searchString: 'is:fromme'
	},
	{
		label: t('email_status.tome', 'to me'),
		searchString: 'is:tome'
	},
	{
		label: t('email_status.ccme', 'in copy to me'),
		searchString: 'is:ccme'
	},
	{
		label: t('email_status.tofromme', 'to me or from me'),
		searchString: 'is:tofromme'
	},
	{
		label: t('email_status.toccme', 'to me or in copy to me'),
		searchString: 'is:toccme'
	},
	{
		label: t('email_status.fromccme', 'from me or in copy to me'),
		searchString: 'is:fromccme'
	},
	{
		label: t('email_status.tofromccme', 'to me, from me or in copy to me'),
		searchString: 'is:tofromccme'
	},
	{
		label: t('email_status.local', 'on my folders'),
		searchString: 'is:local'
	},
	{
		label: t('email_status.remote', 'on a folder shared by me'),
		searchString: 'is:remote'
	},
	{
		label: t('email_status.anywhere', 'in all the folders'),
		searchString: 'is:anywhere'
	}
];

export const MessageActionsDescriptors = {
	FLAG: {
		id: 'message-flag',
		desc: 'Add flag'
	},
	UNFLAG: {
		id: 'message-unflag',
		desc: 'Remove flag'
	},
	MARK_AS_READ: {
		id: 'message-mark_as_read',
		desc: 'Mark as read'
	},
	MARK_AS_UNREAD: {
		id: 'message-mark_as_unread',
		desc: 'Mark as unread'
	},
	MARK_AS_SPAM: {
		id: 'message-mark_as_spam',
		desc: 'Mark as spam'
	},
	MARK_AS_NOT_SPAM: {
		id: 'message-mark_as_not_spam',
		desc: 'Not spam'
	},
	PRINT: {
		id: 'message-print',
		desc: 'Print'
	},
	SHOW_SOURCE: {
		id: 'message-show_original',
		desc: 'Show original'
	},
	MOVE_TO_TRASH: {
		id: 'message-trash',
		desc: 'Move to trash'
	},
	DELETE: {
		id: 'message-delete',
		desc: 'Delete'
	},
	REPLY: {
		id: 'message-reply',
		desc: 'Reply'
	},
	REPLY_ALL: {
		id: 'message-reply_all',
		desc: 'Reply all'
	},
	FORWARD: {
		id: 'message-forward',
		desc: 'Forward'
	},
	EDIT_AS_NEW: {
		id: 'message-edit_as_new',
		desc: 'Edit as new'
	},
	EDIT_DRAFT: {
		id: 'message-edit_as_draft',
		desc: 'Edit'
	},
	SEND: {
		id: 'message-send',
		desc: 'Send'
	},
	REDIRECT: {
		id: 'message-redirect',
		desc: 'Redirect'
	},
	MOVE: {
		id: 'message-move',
		desc: 'Move'
	},
	RESTORE: {
		id: 'message-restore',
		desc: 'Restore'
	},
	DELETE_PERMANENTLY: {
		id: 'message-delete-permanently',
		desc: 'Delete Permanently'
	}
} as const;

export const ConversationActionsDescriptors = {
	FLAG: {
		id: 'flag-conversation',
		desc: 'Add flag'
	},
	UNFLAG: {
		id: 'unflag-conversation',
		desc: 'Remove flag'
	},
	MARK_AS_READ: {
		id: 'read-conversation',
		desc: 'Mark as read'
	},
	MARK_AS_UNREAD: {
		id: 'unread-conversation',
		desc: 'Mark as unread'
	},
	MOVE_TO_TRASH: {
		id: 'conversation-trash',
		desc: 'Move to trash'
	},
	REPLY: {
		id: 'conversation-reply',
		desc: 'Reply'
	},
	REPLY_ALL: {
		id: 'conversation-reply_all',
		desc: 'Reply all'
	},
	FORWARD: {
		id: 'conversation-forward',
		desc: 'Forward'
	}
} as const;

export const MSG_CONV_STATUS = {
	FLAGGED: {
		value: true,
		desc: 'flagged'
	},
	NOT_FLAGGED: {
		value: false,
		desc: 'not flagged'
	},
	READ: {
		value: true,
		desc: 'read'
	},
	NOT_READ: {
		value: false,
		desc: 'not read'
	}
};

export const ASSERTION = {
	CONTAIN: {
		value: true,
		desc: 'contain'
	},
	NOT_CONTAIN: {
		value: false,
		desc: 'not contain'
	}
};

export const FOLDERIDS = {
	INBOX: {
		id: FOLDERS.INBOX,
		desc: 'inbox'
	},
	SENT: {
		id: FOLDERS.SENT,
		desc: 'sent'
	},
	DRAFTS: {
		id: FOLDERS.DRAFTS,
		desc: 'drafts'
	},
	SPAM: {
		id: FOLDERS.SPAM,
		desc: 'junk'
	},
	TRASH: {
		id: FOLDERS.TRASH,
		desc: 'trash'
	},
	USER_DEFINED: {
		id: '1234567',
		desc: 'user defined'
	}
};

const SNACKBAR_DEFAULT_TIMEOUT = 3000;

export const TIMEOUTS = {
	SET_AS_SPAM: SNACKBAR_DEFAULT_TIMEOUT,
	REDIRECT: SNACKBAR_DEFAULT_TIMEOUT
};

export const LIST_LIMIT = {
	INITIAL_LIMIT: 100,
	LOAD_MORE_LIMIT: 50
};
