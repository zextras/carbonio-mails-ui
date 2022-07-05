/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { TFunction } from 'react-i18next';
// TODO: update the shell constants with this and update the usages in other modules
export const CORRESPONDING_COLORS = [
	{ zValue: 0, uiRgb: '#000000', zLabel: 'black' },
	{ zValue: 1, uiRgb: '#2b73d2', zLabel: 'blue' },
	{ zValue: 2, uiRgb: '#2196d3', zLabel: 'cyan' },
	{ zValue: 3, uiRgb: '#639030', zLabel: 'green' },
	{ zValue: 4, uiRgb: '#1a75a7', zLabel: 'purple' },
	{ zValue: 5, uiRgb: '#d74942', zLabel: 'red' },
	{ zValue: 6, uiRgb: '#ffc107', zLabel: 'yellow' },
	{ zValue: 7, uiRgb: '#edaeab', zLabel: 'pink' },
	{ zValue: 8, uiRgb: '#828282', zLabel: 'gray' },
	{ zValue: 9, uiRgb: '#ba8b00', zLabel: 'orange' }
];

/*
reference: https://zextras.atlassian.net/wiki/spaces/IRIS/pages/223215854/UI+Guidelines+and+theming
*/

export const MAILS_ROUTE = 'mails';

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
		label: t('email_status.tofromme', 'to me, from me or in copy to me'),
		searchString: 'is:tofromme'
	},
	{
		label: t('email_status.toccme', 'to me or in copy to me'),
		searchString: 'is:toccme'
	},
	{
		label: t('email_status.fromccme', 'from me'),
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

export const MAIL_APP_ID = 'carbonio-mails-ui';

export const FOLDER_VIEW = {
	search_folder: 'search folder',
	tag: 'tag',
	conversation: 'conversation',
	message: 'message',
	contact: 'contact',
	document: 'document',
	appointment: 'appointment',
	virtual_conversation: 'virtual conversation',
	remote_folder: 'remote folder',
	wiki: 'wiki',
	task: 'task',
	chat: 'chat'
};
