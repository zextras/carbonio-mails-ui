/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { TFunction } from 'i18next';

import { FOLDERS } from '../carbonio-ui-commons/constants/folders';

export const MAILS_ROUTE = 'mails';

export const MAILS_BOARD_VIEW_ID = 'mails_editor_board_view';

export const BACKUP_SEARCH_ROUTE = 'backup-search';

export const MAIL_APP_ID = 'carbonio-mails-ui';

export const NO_ACCOUNT_NAME = 'No account';

export const RECOVER_MESSAGES_INTERVAL = 3;

export const LOCAL_STORAGE_VIEW_SIZES = 'carbonio-mails-ui-list-view-sizes';

export const LOCAL_STORAGE_LAYOUT = 'carbonio-mails-ui-layout';

export const LOCAL_STORAGE_SPLIT_LAYOUT_ORIENTATION = 'carbonio-mails-ui-split-layout_orientation';

export const MAILS_VIEW_LAYOUTS = {
	NO_SPLIT: 'no-split',
	SPLIT: 'split'
} as const;

export const MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS = {
	VERTICAL: 'vertical',
	HORIZONTAL: 'horizontal'
} as const;

export const BORDERS = {
	EAST: 'e',
	SOUTH: 's',
	NORTH: 'n',
	WEST: 'w'
} as const;

type AttachmentTypeItemsConstantProps = {
	id: string;
	label: string;
	icon: string;
	searchString: string;
};

export const attachmentTypeItemsConstant = (
	t: TFunction
): Array<AttachmentTypeItemsConstantProps> => [
	{
		id: 'application',
		label: t('attachment_type.application', 'Application'),
		icon: 'Code',
		searchString: 'attachment:application/*'
	},
	{
		id: 'email',
		label: t('attachment_type.email', 'Email'),
		icon: 'Email',
		searchString: 'attachment:message/rfc822'
	},
	{
		id: 'excel',
		label: t('attachment_type.excel', 'Excel'),
		icon: 'FileCalc',
		searchString: 'attachment:application/vnd.ms-excel'
	},
	{
		id: 'html',
		label: t('attachment_type.html', 'HTML'),
		icon: 'FileHtml',
		searchString: 'attachment:text/html'
	},
	{
		id: 'image',
		label: t('attachment_type.image', 'Image'),
		icon: 'Image',
		searchString: 'attachment:image'
	},
	{
		id: 'pdf',
		label: t('attachment_type.pdf', 'PDF'),
		icon: 'FilePdf',
		searchString: 'attachment:application/pdf'
	},
	{
		id: 'power-point',
		label: t('attachment_type.powerpoint', 'Powerpoint'),
		icon: 'FilePresentation',
		searchString: 'attachment:application/vnd.ms-powerpoint'
	},
	{
		id: 'text-document',
		label: t('attachment_type.text_document', 'Text Document'),
		icon: 'FileText',
		searchString: 'attachment:text'
	},
	{
		id: 'video',
		label: t('attachment_type.video', 'Video'),
		icon: 'Video',
		searchString: 'attachment:video'
	},
	{
		id: 'word',
		label: t('attachment_type.word', 'Word'),
		icon: 'FileText',
		searchString: 'attachment:word'
	},
	{
		id: 'zipped-file',
		label: t('attachment_type.zipped_file', 'Zipped File'),
		icon: 'FileZip',
		searchString: 'attachment:application/zip OR attachment:application/x-zip-compressed'
	}
];

type EmailStatusItemsConstantProps = {
	id: string;
	label: string;
	searchString: string;
};

export const emailStatusItemsConstant = (t: TFunction): Array<EmailStatusItemsConstantProps> => [
	{
		id: 'read',
		label: t('email_status.read', 'read'),
		searchString: 'is:read'
	},
	{
		id: 'unread',
		label: t('email_status.unread', 'unread'),
		searchString: 'is:unread'
	},
	{
		id: 'flagged',
		label: t('email_status.flagged', 'flagged'),
		searchString: 'is:flagged'
	},
	{
		id: 'not-flagged',
		label: t('email_status.unflagged', 'not flagged'),
		searchString: 'is:unflagged'
	},
	{
		id: 'draft',
		label: t('email_status.draft', 'draft'),
		searchString: 'is:draft'
	},
	{
		id: 'send-by-me',
		label: t('email_status.sent', 'sent by me'),
		searchString: 'is:sent'
	},
	{
		id: 'received-by-me',
		label: t('email_status.received', 'received by me'),
		searchString: 'is:recevided'
	},
	{
		id: 'answered-by-me',
		label: t('email_status.replied', 'answered by me'),
		searchString: 'is:replied'
	},
	{
		id: 'not-answered-by-me',
		label: t('email_status.unreplied', 'not answered by me'),
		searchString: 'is:unreplied'
	},
	{
		id: 'forwarded',
		label: t('email_status.forwarded', 'forwarded'),
		searchString: 'is:forwarded'
	},
	{
		id: 'not-forwarded',
		label: t('email_status.unforwarded', 'not forwarded'),
		searchString: 'is:unforwarded'
	},
	{
		id: 'invitations',
		label: t('email_status.invitations', 'invitations'),
		searchString: 'is:invite'
	},
	{
		id: 'conv-with-a-single-msg',
		label: t('email_status.solo', 'conversations with a single message'),
		searchString: 'is:solo'
	},
	{
		id: 'from-me',
		label: t('email_status.fromme', 'from me'),
		searchString: 'is:fromme'
	},
	{
		id: 'to-me',
		label: t('email_status.tome', 'to me'),
		searchString: 'is:tome'
	},
	{
		id: 'in-copy-to-me',
		label: t('email_status.ccme', 'in copy to me'),
		searchString: 'is:ccme'
	},
	{
		id: 'to-me-or-from-me',
		label: t('email_status.tofromme', 'to me or from me'),
		searchString: 'is:tofromme'
	},
	{
		id: 'to-me-or-in-copy',
		label: t('email_status.toccme', 'to me or in copy to me'),
		searchString: 'is:toccme'
	},
	{
		id: 'from-me-or-in-copy',
		label: t('email_status.fromccme', 'from me or in copy to me'),
		searchString: 'is:fromccme'
	},
	{
		id: 'to-me-from-me',
		label: t('email_status.tofromccme', 'to me, from me or in copy to me'),
		searchString: 'is:tofromccme'
	},
	{
		id: 'on-my-folders',
		label: t('email_status.local', 'on my folders'),
		searchString: 'is:local'
	},
	{
		id: 'on-a-folder-shared-by-me',
		label: t('email_status.remote', 'on a folder shared by me'),
		searchString: 'is:remote'
	},
	{
		id: 'in-all-the-folder',
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
	},
	PREVIEW_ON_SEPARATED_WINDOW: {
		id: 'preview-on-separated-window',
		desc: 'Preview the message on a separated window'
	},
	DOWNLOAD_EML: {
		id: 'download-eml',
		desc: 'Download EML'
	},
	CREATE_APPOINTMENT: {
		id: 'create-appointment',
		desc: 'Create Appointment'
	},
	APPLY_TAG: {
		id: 'apply-tag',
		desc: 'Apply tag'
	}
} as const;

export const ConversationActionsDescriptors = {
	PREVIEW_ON_SEPARATED_WINDOW: {
		id: 'preview-on-separated-window',
		desc: 'Preview the conversation on a separated window'
	},
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
	},
	DELETE_PERMANENTLY: {
		id: 'delete-permanently',
		desc: 'Delete permanently'
	},
	MARK_AS_SPAM: {
		id: 'conversation-mark_as_spam',
		desc: 'Mark as spam'
	},
	MARK_AS_NOT_SPAM: {
		id: 'conversation-mark_as_not_spam',
		desc: 'Not spam'
	},
	APPLY_TAG: {
		id: 'conversation-apply-tag',
		desc: 'Apply tag'
	},
	MOVE: {
		id: 'conversation-move',
		desc: 'Move'
	},
	RESTORE: {
		id: 'conversation-restore',
		desc: 'Restore'
	},
	PRINT: {
		id: 'conversation-print',
		desc: 'Print'
	},
	SHOW_SOURCE: {
		id: 'conversation-show_original',
		desc: 'Show original'
	}
} as const;

export const GenericActionDescriptors = {
	SELECT_FOLDERS: {
		id: 'select-folders',
		desc: 'Select folders'
	}
};

export const FilterActionsDescriptors = {
	APPLY: {
		id: 'apply-filter-on-folder',
		desc: 'Apply filter to a folder'
	}
} as const;

export const FOLDERS_DESCRIPTORS = {
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
export const DEFAULT_API_DEBOUNCE_TIME = 200;

export const TIMEOUTS = {
	SNACKBAR_DEFAULT_TIMEOUT,
	DRAFT_SAVE_DELAY: 2000,
	SET_AS_SPAM: SNACKBAR_DEFAULT_TIMEOUT,
	REDIRECT: SNACKBAR_DEFAULT_TIMEOUT,
	DRAFT_INFO_HIDING_DELAY: 3000,
	COMPLETED_UPLOAD_NOTIFICATION_VISIBILITY: 3000
};

export const LIST_LIMIT = {
	INITIAL_LIMIT: 100,
	LOAD_MORE_LIMIT: 50
};

export const LOCAL_STORAGES = {
	EXPANDED_FOLDERS: 'open_mails_folders'
};

export const EditViewActions = {
	NEW: 'new',
	EDIT_AS_DRAFT: 'editAsDraft',
	EDIT_AS_NEW: 'editAsNew',
	REPLY: 'reply',
	REPLY_ALL: 'replyAll',
	FORWARD: 'forward',
	MAIL_TO: 'mailTo',
	COMPOSE: 'compose',
	PREFILL_COMPOSE: 'prefillCompose',
	RESUME: 'resume'
} as const;

export const PROCESS_STATUS = {
	RUNNING: 'running',
	COMPLETED: 'completed',
	ABORTED: 'aborted'
} as const;

export const EDIT_VIEW_CLOSING_REASONS = {
	EXTERNAL_CLOSE_REQUEST: 'externalRequest',
	MESSAGE_SENT: 'send',
	MESSAGE_SEND_SCHEDULED: 'sendLater'
} as const;

export const SORTING_OPTIONS = {
	unread: { label: 'unread', value: 'read' },
	important: { label: 'important', value: 'priority' },
	flagged: { label: 'flagged', value: 'flag' },
	attachment: { label: 'attachment', value: 'attach' },
	from: { label: 'from', value: 'name' },
	to: { label: 'to', value: 'rcpt' },
	date: { label: 'date', value: 'date' },
	subject: { label: 'subject', value: 'subj' },
	size: { label: 'size', value: 'size' }
} as const;

export const SORTING_DIRECTION = {
	ASCENDING: 'Asc',
	DESCENDING: 'Desc'
} as const;

export const SORT_ICONS = {
	ASCENDING: 'ZaListOutline',
	DESCENDING: 'AzListOutline'
} as const;

export const API_REQUEST_STATUS = {
	pending: 'pending',
	error: 'error',
	fulfilled: 'fulfilled'
} as const;

export const SEARCHED_FOLDER_STATE_STATUS = {
	empty: 'empty',
	pending: 'pending',
	complete: 'complete',
	hasMore: 'hasMore',
	hasChange: 'hasChange',
	error: 'error',
	incomplete: 'incomplete'
} as const;

export const EXTRA_WINDOW_ACTION_ID = 'extraWindowActions';

export const BACKUP_SEARCH_STATUS = {
	empty: 'empty',
	loading: 'loading',
	completed: 'completed'
} as const;

export const MAIL_VERIFICATION_HEADERS = {
	from: 'From',
	authenticatorHeaders: 'Authentication-Results',
	sensitivity: 'Sensitivity',
	listId: 'List-ID',
	listUnsubscribe: 'List-Unsubscribe',
	zimbraDL: 'X-Zimbra-DL',
	messageId: 'Message-Id',
	creationDate: 'Date'
} as const;

export const MAIL_SENSITIVITY_HEADER = {
	personal: 'Personal',
	private: 'Private',
	companyConfidential: 'Company-Confidential'
} as const;

export const MAIL_INFO_HEADERS = {
	messageId: 'Message-Id',
	creationDate: 'Date'
} as const;

export const VALID_MAIL_AUTHENTICATION_HEADERS = ['dkim', 'spf', 'dmarc'] as const;
export const PRIVATE_SENSITIVITY_HEADERS = ['Private', 'Company-Confidential'] as const;
