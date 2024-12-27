/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { TFunction } from 'i18next';
import { find, forEach } from 'lodash';

import { FilterActions } from '../../../../types';

type Option = {
	label: string;
	value: string;
};

export const domainOptions = (t: TFunction): Option[] => [
	{ label: t('label.all', 'all'), value: 'all' },
	{ label: t('settings.localpart', 'localpart'), value: 'localpart' },
	{ label: t('settings.domain', 'domain'), value: 'domain' }
];

type ConditionStatements = {
	label: string;
	value: { stringComparison: string; negative?: string };
};
export const getConditionStatements = (t: TFunction): ConditionStatements[] => [
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

export const getFieldOptions = (t: TFunction): Option[] => [
	{
		label: t('label.any', 'any'),
		value: 'anyof'
	},
	{
		label: t('label.all', 'all'),
		value: 'allof'
	}
];

export const getIsOptions = (t: TFunction): Option[] => [
	{
		label: t('settings.is', 'is'),
		value: 'TRUE'
	},
	{
		label: t('settings.is_not', 'is not'),
		value: 'FALSE'
	}
];

type MessageOption = {
	label: string;
	value: {
		value?: {
			where?: string;
			flagName?: string;
		};
		key: string;
	};
};
export const getMessageOptions = (t: TFunction): MessageOption[] => [
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

type SizeOption = {
	label: string;
	value: {
		numberComparison: string;
		negative?: string;
	};
};
export const getSizeOptions = (t: TFunction): SizeOption[] => [
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

export const getSizeUnit = (t: TFunction): Option[] => [
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

type DateOption = {
	label: string;
	value: {
		dateComparison: 'before' | 'after';
		negative?: '1';
	};
};

export const getDateOptions = (t: TFunction): DateOption[] => [
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

type BodyOption = {
	label: string;
	value: {
		negative?: '1';
	};
};
export const getBodyOptions = (t: TFunction): BodyOption[] => [
	{ label: t('settings.contains', 'contains'), value: {} },
	{
		label: t('settings.does_not_contain', 'does not contain'),
		value: { negative: '1' }
	}
];

type ExistsOption = {
	label: string;
	value: {
		negative?: '1';
	};
};

export const getExistOptions = (t: TFunction): ExistsOption[] => [
	{
		label: t('settings.exists', 'exists'),
		value: {}
	},
	{
		label: t('settings.does_not_exists', 'does not exist'),
		value: { negative: '1' }
	}
];

type ReadReceiptOption = {
	label: string;
	value: {
		header: string;
		stringComparison: string;
		value: string;
		negative?: string;
	};
};

export const getReadReceiptOptions = (t: TFunction): ReadReceiptOption[] => [
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

export const getFromOptions = (t: TFunction): Option[] => [
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

export const getInOptions = (t: TFunction): InOption[] => [
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

type InOption = {
	label: string;
	value: {
		key: string;
		value: {
			negative?: string;
		};
	};
};

export const getFolderOptions = (t: TFunction): Option[] => [
	{
		label: t('settings.contacts', 'contacts'),
		value: 'addressBookTest'
	},
	{
		label: t('settings.my_frequent_emails', 'my frequent e-mails'),
		value: 'contactRankingTest'
	}
];

type InviteRspOption = {
	label: string;
	value: {
		method: { _content: string }[];
		negative?: string;
	};
};

export const getInviteRspOptions = (t: TFunction): InviteRspOption[] => [
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

type SocialOption = {
	label: string;
	value: {
		linkedinTest?: object[];
		twitterTest?: object[];
		facebookTest?: object[];
	};
};

export const getSocialOptions = (t: TFunction): SocialOption[] => [
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

const getConditionAction = (
	t: TFunction,
	zimbraFeatureMailForwardingInFiltersEnabled: string
): Option[] => {
	if (zimbraFeatureMailForwardingInFiltersEnabled === 'TRUE') {
		return [
			{
				label: t('settings.redirect_to_address', 'Redirect to address'),
				value: 'redirectToAddress'
			}
		];
	}
	return [];
};

export const getActionOptions = (
	t: TFunction,
	zimbraFeatureMailForwardingInFiltersEnabled: string,
	isIncoming = true
): Option[] => [
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
	...getConditionAction(t, zimbraFeatureMailForwardingInFiltersEnabled)
];

type MarkOption = {
	label: string;
	value: {
		actionFlag: { flagName: string }[];
	};
};
export const getMarkAsOptions = (t: TFunction): MarkOption[] => [
	{
		label: t('label.read', 'Read'),
		value: { actionFlag: [{ flagName: 'read' }] }
	},
	{
		label: t('label.flagged', 'Flagged'),
		value: { actionFlag: [{ flagName: 'flagged' }] }
	}
];

export const getDomainOptions = (t: TFunction): Option[] => [
	{ label: t('label.all', 'all'), value: 'all' },
	{ label: t('settings.localpart', 'localpart'), value: 'localpart' },
	{ label: t('settings.domain', 'domain'), value: 'domain' }
];

export const getStatusOptions = (t: TFunction): Option[] => [
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
		value: 'address in'
	},
	{ label: t('settings.calendar', 'Calendar'), value: 'calendar' },
	{ label: t('settings.social', 'Social'), value: 'social' },
	{
		label: t('settings.header_name', 'Header Named'),
		value: 'header named'
	}
];

export const findDefaultValue = (list: Option[], key: string): Option | undefined =>
	find(list, { value: key });
export const findDefaultObjectValue = (list: Option[], key: string): Option | undefined =>
	find(list, { value: key });

type Filters = {
	filterActions: FilterActions[];
	active: boolean;
	name: string;
	filterTests: {
		condition: string;
	}[];
};
export const getButtonInfo = (
	filterName: string,
	filters: Filters,
	t: TFunction,
	isCreate = true
): [boolean, string] => {
	const keys = Object.keys(filters.filterActions[0]);
	const actions = filters.filterActions[0];
	if (filterName.length === 0) {
		return [true, t('settings.label.filter_name_required', 'Filter name is required')];
	}
	if (keys.includes('actionTag')) {
		let isEmpty = false;
		forEach(actions.actionTag, (action) => {
			if (action.tagName === '') isEmpty = true;
		});
		if (isEmpty) {
			return [
				true,
				t(
					'settings.tag_name_required',
					'Fill in the "Tag" field in order to complete the action "Tag with".'
				)
			];
		}
	}
	if (keys.includes('actionFileInto')) {
		let isEmpty = false;
		forEach(actions.actionFileInto, (files) => {
			if (files.folderPath === '') isEmpty = true;
		});
		if (isEmpty) {
			return [
				true,
				t(
					'settings.folder_path_required',
					'Select a destination folder in order to complete the action "Move into folder".'
				)
			];
		}
	}
	if (keys.includes('actionRedirect')) {
		let isEmpty = false;
		forEach(actions.actionRedirect, (address) => {
			if (address.a === '') isEmpty = true;
		});
		if (isEmpty) {
			return [
				true,
				t(
					'settings.address_required',
					'Fill in the "Address" field in order to complete the action "Redirect to Address".'
				)
			];
		}
	}
	return [false, isCreate ? t('label.create', 'Create') : t('label.save', 'Save')];
};
