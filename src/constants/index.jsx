/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
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

export const attachmentTypeItemsConstant = [
	{
		label: 'attachment_type.application',
		icon: 'Code',
		searchString: 'attachment:application/*',
		defaultTranslation: 'Application'
	},
	{
		label: 'attachment_type.email',
		icon: 'Email',
		searchString: 'attachment:message/rfc822',
		defaultTranslation: 'Email'
	},
	{
		label: 'attachment_type.excel',
		icon: 'FileCalc',
		searchString: 'attachment:application/vnd.ms-excel',
		defaultTranslation: 'Excel'
	},
	{
		label: 'attachment_type.html',
		icon: 'FileHtml',
		searchString: 'attachment:text/html',
		defaultTranslation: 'HTML'
	},
	{
		label: 'attachment_type.image',
		icon: 'Image',
		searchString: 'attachment:image',
		defaultTranslation: 'Image'
	},
	{
		label: 'attachment_type.pdf',
		icon: 'FilePdf',
		searchString: 'attachment:application/pdf',
		defaultTranslation: 'PDF'
	},
	{
		label: 'attachment_type.powerpoint',
		icon: 'FilePresentation',
		searchString: 'attachment:application/vnd.ms-powerpoint',
		defaultTranslation: 'Powerpoint'
	},
	{
		label: 'attachment_type.text_document',
		icon: 'FileText',
		searchString: 'attachment:text',
		defaultTranslation: 'Text Document'
	},
	{
		label: 'attachment_type.video',
		icon: 'Video',
		searchString: 'attachment:video',
		defaultTranslation: 'Video'
	},
	{
		label: 'attachment_type.word',
		icon: 'FileText',
		searchString: 'attachment:word',
		defaultTranslation: 'Word'
	},
	{
		label: 'attachment_type.zipped_file',
		icon: 'FileZip',
		searchString: 'attachment:application/zip OR attachment:application/x-zip-compressed',
		defaultTranslation: 'Zipped File'
	}
];

export const emailStatusItemsConstant = [
	{
		label: 'email_status.read',
		searchString: 'is:read',
		defaultTranslation: 'read'
	},
	{
		label: 'email_status.unread',
		searchString: 'is:unread',
		defaultTranslation: 'unread'
	},
	{
		label: 'email_status.flagged',
		searchString: 'is:flagged',
		defaultTranslation: 'flagged'
	},
	{
		label: 'email_status.unflagged',
		searchString: 'is:unflagged',
		defaultTranslation: 'not flagged'
	},
	{
		label: 'email_status.draft',
		searchString: 'is:draft',
		defaultTranslation: 'draft'
	},
	{
		label: 'email_status.sent',
		searchString: 'is:sent',
		defaultTranslation: 'sent by me'
	},
	{
		label: 'email_status.recevided',
		searchString: 'is:recevided',
		defaultTranslation: 'recevided by me'
	},
	{
		label: 'email_status.replied',
		searchString: 'is:replied',
		defaultTranslation: 'answered by me'
	},
	{
		label: 'email_status.unreplied',
		searchString: 'is:unreplied',
		defaultTranslation: 'not answered by me'
	},
	{
		label: 'email_status.forwarded',
		searchString: 'is:forwarded',
		defaultTranslation: 'forwarded'
	},
	{
		label: 'email_status.unforwarded',
		searchString: 'is:unforwarded',
		defaultTranslation: 'not forwarded'
	},
	{
		label: 'email_status.invitations',
		searchString: 'is:invite',
		defaultTranslation: 'invitations'
	},
	{
		label: 'email_status.solo',
		searchString: 'is:solo',
		defaultTranslation: 'conversations with a single message'
	},
	{
		label: 'email_status.fromme',
		searchString: 'is:fromme',
		defaultTranslation: 'from me'
	},
	{
		label: 'email_status.tome',
		searchString: 'is:tome',
		defaultTranslation: 'to me'
	},
	{
		label: 'email_status.ccme',
		searchString: 'is:ccme',
		defaultTranslation: 'in copy to me'
	},
	{
		label: 'email_status.tofromme',
		searchString: 'is:tofromme',
		defaultTranslation: 'to me, from me or in copy to me'
	},
	{
		label: 'email_status.toccme',
		searchString: 'is:toccme',
		defaultTranslation: 'to me or in copy to me'
	},
	{
		label: 'email_status.fromccme',
		searchString: 'is:fromccme',
		defaultTranslation: 'from me'
	},
	{
		label: 'email_status.tofromccme',
		searchString: 'is:tofromccme',
		defaultTranslation: 'to me, from me or in copy to me'
	},
	{
		label: 'email_status.local',
		searchString: 'is:local',
		defaultTranslation: 'on my folders'
	},
	{
		label: 'email_status.remote',
		searchString: 'is:remote',
		defaultTranslation: 'on a folder shared by me'
	},
	{
		label: 'email_status.anywhere',
		searchString: 'is:anywhere',
		defaultTranslation: 'in all the folders'
	}
];

export const MAIL_APP_ID = 'carbonio-mails-ui';
