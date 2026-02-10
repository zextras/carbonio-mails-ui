/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { TFunction } from 'i18next';
import { find, forEach } from 'lodash';

import { FilterAction, FilterActions } from 'types/filters';
import { ACTION_OPTIONS } from 'views/settings/filters/constants';
import type { ACTION_OPTION_KEYS } from 'views/settings/filters/constants';
import { ActionMarkAsComponent } from 'views/settings/filters/parts/filter-actions/action-mark-as-component';
import { ActionMoveToFolderComponent } from 'views/settings/filters/parts/filter-actions/action-move-to-folder-component';
import { ActionRedirectToComponent } from 'views/settings/filters/parts/filter-actions/action-redirect-to-component';
import { ActionTagComponent } from 'views/settings/filters/parts/filter-actions/action-tag-component';
import { getMarkAsOptions } from 'views/settings/filters/parts/filter-actions/mark-as-utils';
import { OnFilterActionChange } from 'views/settings/filters/types';

type DomainOption = {
	label: string;
	value: string;
};

export const getDomainOptions = (t: TFunction): DomainOption[] => [
	{ label: t('label.all', 'all'), value: 'all' },
	{ label: t('settings.localpart', 'localpart'), value: 'localpart' },
	{ label: t('settings.domain', 'domain'), value: 'domain' }
];

type ConditionStatement = {
	label: string;
	value: { stringComparison: 'is' | 'contains' | 'matches'; negative?: string };
};

export const getConditionStatements = (t: TFunction): ConditionStatement[] => [
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

type FieldOption = {
	label: string;
	value: 'anyof' | 'allof';
};

export const getFieldOptions = (t: TFunction): FieldOption[] => [
	{
		label: t('label.any', 'any'),
		value: 'anyof'
	},
	{
		label: t('label.all', 'all'),
		value: 'allof'
	}
];

type IsOption = {
	label: string;
	value: 'TRUE' | 'FALSE';
};

export const getIsOptions = (t: TFunction): IsOption[] => [
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
		value: { where?: 'started' | 'participated'; flagName?: 'flagged' };
		key: 'conversationTest' | 'flaggedTest' | 'listTest' | 'bulkTest';
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

type SizeOption = { label: string; value: { numberComparison: 'under' | 'over'; negative?: '1' } };
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

type SizeUnit = { label: string; value: '' | 'K' | 'M' | 'G' };
export const getSizeUnit = (t: TFunction): SizeUnit[] => [
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

type DateOption = { label: string; value: { dateComparison: 'before' | 'after'; negative?: '1' } };
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

type BodyOption = { label: string; value: { negative?: '1' } };

export const getBodyOptions = (t: TFunction): BodyOption[] => [
	{ label: t('settings.contains', 'contains'), value: {} },
	{
		label: t('settings.does_not_contain', 'does not contain'),
		value: { negative: '1' }
	}
];

type ExistOption = { label: string; value: { negative?: '1' } };
export const getExistOptions = (t: TFunction): ExistOption[] => [
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
		header: 'Content-Type';
		stringComparison: 'Contains';
		value: 'message/disposition-notification';
		negative?: '1';
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

type FromOption = {
	label: string;
	value: 'FROM' | 'TO' | 'CC' | 'TO,CC';
};
export const getFromOptions = (t: TFunction): FromOption[] => [
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

type InOption = {
	label: string;
	value: {
		key: 'in' | 'myTest';
		value: {
			negative?: '1';
		};
	};
};
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

type FolderOption = {
	label: string;
	value: 'addressBookTest' | 'contactRankingTest';
};
export const getFolderOptions = (t: TFunction): FolderOption[] => [
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
	value: { method: [{ _content: 'anyrequest' | 'anyreply' }]; negative?: '1' };
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
	value: { linkedinTest?: [object]; twitterTest?: [object]; facebookTest?: [object] };
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
export const getActionComponent = (
	action: FilterAction,
	onChange: OnFilterActionChange
): React.JSX.Element | undefined => {
	if (ACTION_OPTIONS.MOVE_TO_FOLDER in action) {
		return <ActionMoveToFolderComponent value={action} onChange={onChange} />;
	}
	if (ACTION_OPTIONS.MARK_AS in action) {
		return <ActionMarkAsComponent value={action} onChange={onChange} />;
	}
	if (ACTION_OPTIONS.REDIRECT_TO in action) {
		return <ActionRedirectToComponent value={action} onChange={onChange} />;
	}
	if (ACTION_OPTIONS.TAG in action) {
		return <ActionTagComponent value={action} onChange={onChange} />;
	}
	return undefined;
};

export const getActionsInitialValues = (t: TFunction): Record<ACTION_OPTION_KEYS, FilterAction> => {
	const markAsOptions = getMarkAsOptions(t);
	return {
		[ACTION_OPTIONS.KEEP]: { actionKeep: [{}] },
		[ACTION_OPTIONS.DISCARD]: { actionDiscard: [{}] },
		[ACTION_OPTIONS.MOVE_TO_FOLDER]: { actionFileInto: [{ folderPath: '' }] },
		[ACTION_OPTIONS.TAG]: { actionTag: [{ tagName: '' }] },
		[ACTION_OPTIONS.MARK_AS]: {
			actionFlag: [{ flagName: markAsOptions?.[0].value.actionFlag[0].flagName }]
		},
		[ACTION_OPTIONS.REDIRECT_TO]: {
			actionRedirect: [{ a: '' }]
		}
	};
};

export const getActionTranslations =
	(isIncoming: boolean): ((t: TFunction) => Record<ACTION_OPTION_KEYS, string>) =>
	(t: TFunction) => ({
		[ACTION_OPTIONS.KEEP]: isIncoming
			? t('settings.keep_in_inbox', 'Keep in Inbox')
			: t('settings.keep_in_sent', 'Keep in Sent'),
		[ACTION_OPTIONS.DISCARD]: t('settings.discard', 'Discard'),
		[ACTION_OPTIONS.MOVE_TO_FOLDER]: t('settings.move_into_folder', 'Move Into Folder'),
		[ACTION_OPTIONS.TAG]: t('settings.tag_with', 'Tag with'),
		[ACTION_OPTIONS.MARK_AS]: t('settings.mark_as', 'Mark as'),
		[ACTION_OPTIONS.REDIRECT_TO]: t('settings.redirect_to_address', 'Redirect to address')
	});

type StatusOption = {
	label: string;
	value:
		| 'from'
		| 'to'
		| 'cc'
		| 'to,cc'
		| 'subject'
		| 'message'
		| 'size'
		| 'date'
		| 'body'
		| 'attachment'
		| 'read receipt'
		| 'address in'
		| 'header named'
		| 'calendar'
		| 'social';
	keyName?: 'addressBookTest';
};
export const getStatusOptions = (t: TFunction): StatusOption[] => [
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
		label: t('settings.filtersConditions.attachment', 'Attachment'),
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
type ObjectWithLabelValue<T> = {
	label: string;
	value: T;
};
export function findDefaultValue<T>(
	list: Array<ObjectWithLabelValue<T>>,
	key: T
): ObjectWithLabelValue<T> | undefined {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return find(list, { value: key });
}
type Filters = {
	filterActions: FilterActions;
};

export const getButtonInfo = (
	filterName: string,
	filters: Filters,
	t: TFunction,
	isCreate = true
): [boolean, string] => {
	const action = filters.filterActions[0];
	if (filterName.length === 0) {
		return [true, t('settings.label.filter_name_required', 'Filter name is required')];
	}
	if ('actionTag' in action) {
		let isEmpty = false;
		forEach(action.actionTag, (actionTag) => {
			if (actionTag.tagName === '') isEmpty = true;
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
	if ('actionFileInto' in action) {
		let isEmpty = false;
		forEach(action.actionFileInto, (files) => {
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
	if ('actionRedirect' in action) {
		let isEmpty = false;
		forEach(action.actionRedirect, (address) => {
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
