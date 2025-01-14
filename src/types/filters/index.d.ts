/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ChipProps } from '@zextras/carbonio-design-system';

const TEST_CONDITIONS = [
	'bodyTest',
	'addressTest',
	'headerTest',
	'sizeTest',
	'attachmentTest',
	'bulkTest',
	'listTest',
	'flaggedTest',
	'conversationTest',
	'dateTest',
	'mimeHeaderTest',
	'addressBookTest',
	'contactRankingTest',
	'meTest',
	'inviteTest',
	'linkedinTest',
	'facebookTest',
	'twitterTest'
] as const;

export type FilterTest = Record<string, string>;
export type AllFiltersTest = { condition: string } & Partial<
	Record<(typeof TEST_CONDITIONS)[number], Array<FilterTest>>
>;

type ApiFilterAction = {
	actionRedirect?: Array<ActionRedirect>;
	actionTag?: Array<ActionTag>;
	actionFlag?: Array<ActionFlag>;
	actionFileInto?: Array<ActionFileInto>;
	actionDiscard?: Array<Record<string, never>>;
	actionStop?: Array<Record<string, never>>;
	actionKeep?: Array<Record<string, never>>;
};

// TODO: add index to API actions
export type Filter = {
	active: boolean;
	filterActions: Array<ApiFilterAction>;
	filterTests: Array<AllFiltersTest>;
	name: string;
};

export type FilterRules = [
	{
		filterRule: Array<Filter>;
	}
];

export type KeywordState = Array<{
	id: string;
	label: string;
	hasAvatar?: boolean;
	value?: string;
	isQueryFilter?: boolean;
	isGeneric?: boolean;
	avatarIcon?: string;
	avatarBackground?: ChipProps['background'];
	hasError?: boolean;
	error?: boolean;
	fullName?: string;
}>;

export type SearchEmailValue = {
	email: string;
};

export type MarkAsOption = {
	label: string;
	value: { actionFlag: [{ flagName: string }] };
};
export type MailFilterTag = {
	label: string;
	color?: number;
};

type ActionFileInto = {
	folderPath?: string;
};
type ActionRedirect = {
	a?: string;
};
type ActionFlag = {
	flagName?: string;
};
type ActionTag = {
	tagName?: string;
};
// TODO: refactor the code and remove me after I'm not anymore needed
type CommonAction = {
	id?: string;
	actionStop?: [Record<string, never>];
	// Only here for MarkAs
	label?: string;
	value?: string;
};
type FilterKeep = CommonAction & {
	actionKeep: [Record<string, never>];
};
type FilterRedirect = CommonAction & {
	actionRedirect: [ActionRedirect];
};
type FilterFlag = CommonAction & {
	actionFlag: [ActionFlag];
};
type FilterFileInto = CommonAction & {
	actionFileInto: [ActionFileInto];
};
type FilterDiscard = CommonAction & {
	actionDiscard: [Record<string, never>];
};
type FilterTag = CommonAction & {
	actionTag: [ActionTag];
};
type FilterStop = CommonAction & {
	actionStop: [Record<string, never>];
};

export type FilterAction =
	| FilterKeep
	| FilterRedirect
	| FilterTag
	| FilterFlag
	| FilterFileInto
	| FilterDiscard
	| FilterStop;

export type FilterActionsProps = {
	isIncoming: boolean;
	tempActions: Array<FilterAction>;
	setTempActions: (tempActions: Array<FilterAction>) => void;
	zimbraFeatureMailForwardingInFiltersEnabled: 'TRUE' | 'FALSE';
};

export type FilterActions = Array<FilterAction>;

export const ACTION_OPTION_KEYS = [
	'actionKeep',
	'actionDiscard',
	'actionFileInto',
	'actionTag',
	'actionFlag',
	'actionRedirect'
] as const;

export type ActionKey = (typeof ACTION_OPTION_KEYS)[number];
