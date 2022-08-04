/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getBridgedFunctions } from '@zextras/carbonio-shell-ui';

type ReturnType = Array<{ title: string; description: string }>;
export const EmptyListMessages = (): ReturnType => [
	{
		title: getBridgedFunctions()?.t(
			'displayer.title1',
			'Compose a new e-mail by clicking the "NEW"button'
		),
		description: ''
	},
	{
		title: getBridgedFunctions()?.t('displayer.title2', 'Click the “NEW” button'),
		description: getBridgedFunctions()?.t(
			'displayer.description2',
			'Send documents, images and more by composing a new e-mail.'
		)
	},
	{
		title: getBridgedFunctions()?.t('displayer.title3', 'Stay in touch with other users.'),
		description: getBridgedFunctions()?.t(
			'displayer.title1',
			'Compose a new e-mail by clicking the "NEW" button'
		)
	}
];

export const EmptyFieldMessages = (): ReturnType => [
	{
		title: getBridgedFunctions()?.t('displayer.title4', 'Select an e-mail to read it'),
		description: getBridgedFunctions()?.t(
			'displayer.description4',
			'You can flag it, reply or forward it to other users.'
		)
	},
	{
		title: getBridgedFunctions()?.t('displayer.title4', 'Select an e-mail to read it'),
		description: getBridgedFunctions()?.t(
			'displayer.description5',
			'Check out what other users want to talk with you about.'
		)
	},
	{
		title: getBridgedFunctions()?.t('displayer.title4', 'Select an e-mail to read it'),
		description: getBridgedFunctions()?.t(
			'displayer.description6',
			'Reply to this e-mail or forward it to other users.'
		)
	},
	{
		title: getBridgedFunctions()?.t('displayer.title3', 'Stay in touch with other users'),
		description: getBridgedFunctions()?.t('displayer.description7', 'Select an e-mail to reply.')
	},
	{
		title: getBridgedFunctions()?.t('displayer.title8', 'Select an e-mail to read or delete it.'),
		description: ''
	}
];

export const SpamMessages = (): ReturnType => [
	{
		title: getBridgedFunctions()?.t(
			'displayer.spam_title1',
			'How lucky! There are no spam e-mails you have to worry about'
		),
		description: ''
	},
	{
		title: getBridgedFunctions()?.t(
			'displayer.spam_title2',
			'Click the trash icon to delete a spam e-mail.'
		),
		description: ''
	}
];

export const SentMessages = (): ReturnType => [
	{
		title: getBridgedFunctions()?.t('displayer.title3', 'Stay in touch with other users.'),
		description: getBridgedFunctions()?.t(
			'displayer.title1',
			'Compose a new e-mail by clicking the "NEW" button'
		)
	},
	{
		title: getBridgedFunctions()?.t(
			'displayer.sent_title2',
			"Select an e-mail to display what you've sent."
		),
		description: ''
	}
];

export const DraftMessages = (): ReturnType => [
	{
		title: getBridgedFunctions()?.t(
			'displayer.draft_title1',
			"Saving an e-mail ad a draft allows you to keep the messages that you'd like to send later."
		),
		description: ''
	},
	{
		title: getBridgedFunctions()?.t(
			'displayer.draft_title2',
			'Select and edit an e-mail to send it to other users.'
		),
		description: ''
	}
];

export const TrashMessages = (): ReturnType => [
	{
		title: getBridgedFunctions()?.t(
			'displayer.trash_title1',
			'Click the trash icon to delete an e-mail'
		),
		description: ''
	},
	{
		title: getBridgedFunctions()?.t(
			'displayer.trash_title2',
			'Select and restore e-mails from the trash.'
		),
		description: ''
	}
];

export const ArchiveMessages = (): ReturnType => [
	{
		title: getBridgedFunctions()?.t(
			'displayer.archive_title1',
			'Save an e-mail to archive so you can review it later.'
		),
		description: ''
	},
	{
		title: getBridgedFunctions()?.t(
			'displayer.archive_title2',
			'Select an archived e-mail to review it.'
		),
		description: ''
	}
];
