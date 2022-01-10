/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { find } from 'lodash';

export const domainOptions = (t) => [
	{ label: t('label.all', 'all'), value: 'all' },
	{ label: t('settings.localpart', 'localpart'), value: 'localpart' },
	{ label: t('settings.domain', 'domain'), value: 'domain' }
];
export const getConditionStatements = (t) => [
	{
		label: t('settings.matches_exactly', 'matches exactly'),
		value: { stringComparison: 'is' }
	},
	{
		label: t('settings.does_not_match_exactly', 'does not match exactly'),
		value: { stringComparison: 'is', negative: '1' }
	},
	{
		label: t('settings.contains', 'contains'),
		value: { stringComparison: 'contains' }
	},
	{
		label: t('settings.does_not_contain', 'does not contain'),
		value: { negative: '1', stringComparison: 'contains' }
	},
	{
		label: t('settings.matches_wildcard_condition', 'matches wildcard condition'),
		value: { stringComparison: 'matches' }
	},
	{
		label: t('settings.does_not_match_wildcard_condition', 'does not match wildcard condition'),
		value: { stringComparison: 'matches', negative: '1' }
	}
];

export const getFieldOptions = (t) => [
	{
		label: t('label.any', 'any'),
		value: 'anyof'
	},
	{
		label: t('label.all', 'all'),
		value: 'allof'
	}
];

export const getHeaderConditionStatements = (t) => [
	...getConditionStatements(t),
	{
		label: t('settings.does_not_match_wildcard_condition', 'does not match wildcard condition'),
		value: 'does not matche wildcard condition'
	},
	{
		label: t('settings.exists', 'exists'),
		value: 'exists'
	},
	{
		label: t('settings.does_not_exists', 'does not exist'),
		value: 'does not exist'
	}
];

export const getIsOptions = (t) => [
	{
		label: t('settings.is', 'is'),
		value: 'TRUE'
	},
	{
		label: t('settings.is_not', 'is not'),
		value: 'FALSE'
	}
];

export const getMessageOptions = (t) => [
	{
		label: t('settings.conv_is_started', 'in conversation I started'),
		value: { value: { where: 'started' }, key: 'conversationTest' }
	},
	{
		label: t('settings.conv_is_participated', 'in conversations I participated'),
		value: { value: { where: 'participated' }, key: 'conversationTest' }
	},
	{
		label: t('settings.mass_marketing', 'mass marketing (bulk)'),
		value: { key: 'bulkTest', value: {} }
	},
	{
		label: t('settings.from_distribution_list', 'from distribution list'),
		value: { key: 'listTest', value: {} }
	},
	{
		label: t('label.flagged', 'flagged'),
		value: { value: { flagName: 'flagged' }, key: 'flaggedTest' }
	}
];

export const getSizeOptions = (t) => [
	{ label: t('settings.under', 'under'), value: { numberComparison: 'under' } },
	{
		label: t('settings.not_under', 'not under'),
		value: { numberComparison: 'under', negative: '1' }
	},
	{ label: t('settings.over', 'over'), value: { numberComparison: 'over' } },
	{
		label: t('settings.not_over', 'not over'),
		value: { numberComparison: 'over', negative: '1' }
	}
];

export const getSizeUnit = (t) => [
	{ label: t('settings.b', 'B'), value: '' },
	{
		label: t('settings.kb', 'KB'),
		value: 'K'
	},
	{ label: t('settings.mb', 'MB'), value: 'M' },
	{
		label: t('settings.gb', 'GB'),
		value: 'G'
	}
];

export const getDateOptions = (t) => [
	{ label: t('settings.before', 'before'), value: { dateComparison: 'before' } },
	{
		label: t('settings.not_before', 'not before'),
		value: { dateComparison: 'before', negative: '1' }
	},
	{ label: t('settings.after', 'after'), value: { dateComparison: 'after' } },
	{
		label: t('settings.not_after', 'not after'),
		value: { dateComparison: 'after', negative: '1' }
	}
];

export const getBodyOptions = (t) => [
	{ label: t('settings.contains', 'contains'), value: {} },
	{
		label: t('settings.does_not_contain', 'does not contain'),
		value: { negative: '1' }
	}
];

export const getExistOptions = (t) => [
	{
		label: t('settings.exists', 'exists'),
		value: {}
	},
	{
		label: t('settings.does_not_exists', 'does not exist'),
		value: { negative: '1' }
	}
];

export const getReadReceiptOptions = (t) => [
	{
		label: t('settings.exists', 'exists'),
		value: {
			header: 'Content-Type',
			stringComparison: 'Contains',
			value: 'message/disposition-notification'
		}
	},
	{
		label: t('settings.does_not_exists', 'does not exist'),
		value: {
			negative: '1',
			header: 'Content-Type',
			stringComparison: 'Contains',
			value: 'message/disposition-notification'
		}
	}
];
export const getFromOptions = (t) => [
	{
		label: t('label.from', 'From'),
		value: 'FROM'
	},
	{
		label: t('label.to', 'To'),
		value: 'TO'
	},
	{
		label: t('label.cc', 'CC'),
		value: 'CC'
	},
	{
		label: t('settings.to_cc', 'To or Cc'),
		value: 'TO,CC'
	}
];

export const getInOptions = (t) => [
	{
		label: t('settings.in', 'in'),
		value: { key: 'in', value: {} }
	},
	{
		label: t('settings.not_in', 'not in'),
		value: { key: 'in', value: { negative: '1' } }
	},
	{
		label: t('settings.is_me', 'is me'),
		value: { key: 'myTest', value: {} }
	},
	{
		label: t('settings.is_not_me', 'is not me'),
		value: { key: 'myTest', value: { negative: '1' } }
	}
];

export const getFolderOptions = (t) => [
	{
		label: t('settings.contacts', 'contacts'),
		value: 'addressBookTest'
	},
	{
		label: t('settings.my_frequent_emails', 'my frequent e-mails'),
		value: 'contactRankingTest'
	}
];

export const getInviteRspOptions = (t) => [
	{
		label: t('settings.invite_requested', 'invite is requested'),
		value: { method: [{ _content: 'anyrequest' }] }
	},
	{
		label: t('settings.invite_not_requested', 'invite is not requested'),
		value: { negative: '1', method: [{ _content: 'anyrequest' }] }
	},
	{
		label: t('settings.invite_replied', 'invite is replied'),
		value: { method: [{ _content: 'anyreply' }] }
	},
	{
		label: t('settings.invite_not_replied', 'invite is not replied '),
		value: { negative: '1', method: [{ _content: 'anyreply' }] }
	}
];

export const getSocialOptions = (t) => [
	{
		label: t('settings.linkedin_msg', 'LinkedIn messages and connections'),
		value: { linkedinTest: [{}] }
	},
	{
		label: t('settings.twitter_notification', 'Twitter notifications'),
		value: { twitterTest: [{}] }
	},
	{
		label: t('settings.facebook_notification', 'Facebook notification'),
		value: { facebookTest: [{}] }
	}
];

export const getActionOptions = (t, isIncoming = true) => [
	{
		label: isIncoming
			? t('settings.keep_in_inbox', 'Keep in Inbox')
			: t('settings.keep_in_sent', 'Keep in Sent'),
		value: isIncoming ? 'inbox' : 'sent'
	},
	{
		label: t('settings.discard', 'Discard'),
		value: 'discard'
	},
	{
		label: t('settings.move_into_folder', 'Move Into Folder'),
		value: 'moveIntoFolder'
	},
	{
		label: t('settings.tag_with', 'Tag with'),
		value: 'tagWith'
	},
	{
		label: t('settings.mark_as', 'Mark as'),
		value: 'markAs'
	},
	{
		label: t('settings.redirect_to_address', 'Redirect to address'),
		value: 'redirectToAddress'
	}
];

export const getMarkAsOptions = (t) => [
	{
		label: t('label.read', 'Read'),
		value: { actionFlag: [{ flagName: 'read' }] }
	},
	{
		label: t('label.flagged', 'Flagged'),
		value: { actionFlag: [{ flagName: 'flagged' }] }
	}
];
export const getDomainOptions = (t) => [
	{ label: t('label.all', 'all'), value: 'all' },
	{ label: t('settings.localpart', 'localpart'), value: 'localpart' },
	{ label: t('settings.domain', 'domain'), value: 'domain' }
];

export const getStatusOptions = (t) => [
	{
		label: t('label.from', 'From'),
		value: 'from'
	},
	{
		label: t('label.to', 'To'),
		value: 'to'
	},
	{
		label: t('label.cc', 'CC'),
		value: 'cc'
	},
	{
		label: t('settings.to_cc', 'To or CC'),
		value: 'to,cc'
	},
	{
		label: t('label.subject', 'Subject'),
		value: 'subject'
	},
	{
		label: t('settings.message', 'Message'),
		value: 'message'
	},
	{
		label: t('label.size', 'Size'),
		value: 'size'
	},
	{ label: t('settings.date', 'Date'), value: 'date' },
	{ label: t('settings.body', 'Body'), value: 'body' },
	{
		label: t('label.attachment', 'Attachment'),
		value: 'attachment'
	},
	{
		label: t('settings.read_receipt', 'Read Receipt'),
		value: 'read receipt'
	},
	{
		label: t('settings.address_in', 'Address In'),
		value: 'address in',
		keyName: 'addressBookTest'
	},
	{ label: t('settings.calendar', 'Calendar'), value: 'calendar' },
	{ label: t('settings.social', 'Social'), value: 'social' },
	{
		label: t('settings.header_name', 'Header Named'),
		value: 'header named'
	}
];

export const findDefaultValue = (list, key) => find(list, { value: key });
export const findDefaultObjectValue = (list, key) => find(list, { value: key });
