/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export const EmptyListMessages = (t) => [
	{
		title: t('displayer.title1', 'Compose a new e-mail by clicking the "NEW"button'),
		description: ''
	},
	{
		title: t('displayer.title2', 'Click the “NEW” button'),
		description: t(
			'displayer.description2',
			'Send documents, images and more by composing a new e-mail.'
		)
	},
	{
		title: t('displayer.title3', 'Stay in touch with other users.'),
		description: t('displayer.title1', 'Compose a new e-mail by clicking the "NEW" button')
	}
];

export const EmptyFieldMessages = (t) => [
	{
		title: t('displayer.title4', 'Select an e-mail to read it'),
		description: t('displayer.description4', 'You can flag it, reply or forward it to other users.')
	},
	{
		title: t('displayer.title4', 'Select an e-mail to read it'),
		description: t(
			'displayer.description5',
			'Check out what other users want to talk with you about.'
		)
	},
	{
		title: t('displayer.title4', 'Select an e-mail to read it'),
		description: t('displayer.description6', 'Reply to this e-mail or forward it to other users.')
	},
	{
		title: t('displayer.title3', 'Stay in touch with other users'),
		description: t('displayer.description7', 'Select an e-mail to reply.')
	},
	{
		title: t('displayer.title8', 'Select an e-mail to read or delete it.'),
		description: ''
	}
];

export const SpamMessages = (t) => [
	{
		title: t(
			'displayer.spam_title1',
			'How lucky! There are no spam e-mails you have to worry about'
		),
		description: ''
	},
	{
		title: t('displayer.spam_title2', 'Click the trash icon to delete a spam e-mail.'),
		description: ''
	}
];

export const SentMessages = (t) => [
	{
		title: t('displayer.title3', 'Stay in touch with other users.'),
		description: t('displayer.title1', 'Compose a new e-mail by clicking the "NEW" button')
	},
	{
		title: t('displayer.sent_title2', "Select an e-mail to display what you've sent."),
		description: ''
	}
];

export const DraftMessages = (t) => [
	{
		title: t(
			'displayer.draft_title1',
			"Saving an e-mail ad a draft allows you to keep the messages that you'd like to send later."
		),
		description: ''
	},
	{
		title: t('displayer.draft_title2', 'Select and edit an e-mail to send it to other users.'),
		description: ''
	}
];

export const TrashMessages = (t) => [
	{
		title: t('displayer.trash_title1', 'Click the trash icon to delete an e-mail'),
		description: ''
	},
	{
		title: t('displayer.trash_title2', 'Select and restore e-mails from the trash.'),
		description: ''
	}
];

export const ArchiveMessages = (t) => [
	{
		title: t('displayer.archive_title1', 'Save an e-mail to archive so you can review it later.'),
		description: ''
	},
	{
		title: t('displayer.archive_title2', 'Select an archived e-mail to review it.'),
		description: ''
	}
];
