/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** Fields of every test: index is its position in the rule, negative is sent only when true */
type FilterTestBase = {
	index?: number;
	negative?: boolean;
};

type StringComparison = 'is' | 'contains' | 'matches';

type StringFilterTest = FilterTestBase & {
	stringComparison?: StringComparison;
	value?: string;
	/** Sent only when true */
	caseSensitive?: boolean;
};

type HeaderFilterTest = StringFilterTest & {
	header?: string;
	valueComparison?: string;
	countComparison?: string;
	valueComparisonComparator?: string;
};

type AddressFilterTest = FilterTestBase & {
	header: string;
	part: 'all' | 'localpart' | 'domain';
	stringComparison: StringComparison;
	value: string;
	caseSensitive?: boolean;
	valueComparison?: string;
	countComparison?: string;
	valueComparisonComparator?: string;
};

/**
 * Tests of social network senders, kept out of the object below: the CI secret scanner reads one of them followed by
 * its type as a credential
 */
type SocialFilterTestKind = 'facebookTest' | 'linkedinTest' | 'socialcastTest' | 'twitterTest';

/** Tests of a GetFilterRules rule, by kind (carbonio-mailbox FilterTests) */
export type FilterTestsByKind = Record<SocialFilterTestKind, FilterTestBase> & {
	addressBookTest: FilterTestBase & { header: string };
	addressTest: AddressFilterTest;
	attachmentTest: FilterTestBase;
	bodyTest: FilterTestBase & { value?: string; caseSensitive?: boolean };
	bulkTest: FilterTestBase;
	communityConnectionsTest: FilterTestBase;
	communityContentTest: FilterTestBase;
	communityRequestsTest: FilterTestBase;
	contactRankingTest: FilterTestBase & { header: string };
	conversationTest: FilterTestBase & { where?: string };
	currentDayOfWeekTest: FilterTestBase & { value?: string };
	currentTimeTest: FilterTestBase & { dateComparison?: 'before' | 'after'; time?: string };
	dateTest: FilterTestBase & { dateComparison?: 'before' | 'after'; d?: number };
	envelopeTest: AddressFilterTest;
	flaggedTest: FilterTestBase & { flagName: string };
	headerExistsTest: FilterTestBase & { header: string };
	headerTest: HeaderFilterTest;
	importanceTest: FilterTestBase & { imp: 'high' | 'normal' | 'low' };
	inviteTest: FilterTestBase & { method?: Array<{ _content: string }> };
	listTest: FilterTestBase;
	meTest: FilterTestBase & { header: string };
	mimeHeaderTest: StringFilterTest & { header?: string };
	sizeTest: FilterTestBase & { numberComparison?: 'over' | 'under'; s?: string };
	trueTest: FilterTestBase;
};

export type FilterTestKind = keyof FilterTestsByKind;

/** The tests of a rule without its condition: the editor gives each row one kind */
export type FilterTestLists = Omit<AllFiltersTest, 'condition'>;

/** One test of any kind */
export type FilterTest = FilterTestsByKind[FilterTestKind];

export type AllFiltersTest = { condition: 'anyof' | 'allof' } & {
	[K in FilterTestKind]?: Array<FilterTestsByKind[K]>;
};

type FilterActionBase = {
	index?: number;
};

/** Actions of a GetFilterRules rule, by kind (carbonio-mailbox FilterAction) */
export type FilterActionsByKind = {
	actionDiscard: FilterActionBase;
	actionFileInto: FilterActionBase & { folderPath?: string; copy?: boolean };
	actionFlag: FilterActionBase & { flagName?: string };
	actionKeep: FilterActionBase;
	actionRedirect: FilterActionBase & { a?: string; copy?: boolean };
	actionStop: FilterActionBase;
	actionTag: FilterActionBase & { tagName?: string };
	actionLog: FilterActionBase & {
		level?: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
		_content?: string;
	};
	actionNotify: FilterActionBase & {
		a?: string;
		su?: string;
		maxBodySize?: number;
		origHeaders?: string;
		content?: Array<{ _content: string }>;
	};
	// Not offered by the editor and refused by the test servers' user scripts: their fields are kept as they come
	actionAddheader: FilterActionBase & Record<string, unknown>;
	actionDeleteheader: FilterActionBase & Record<string, unknown>;
	actionEreject: FilterActionBase & Record<string, unknown>;
	actionReject: FilterActionBase & Record<string, unknown>;
	actionReplaceheader: FilterActionBase & Record<string, unknown>;
	actionReply: FilterActionBase & Record<string, unknown>;
	actionRFCCompliantNotify: FilterActionBase & Record<string, unknown>;
};

export type FilterActionKind = keyof FilterActionsByKind;

export type ApiFilterAction = {
	[K in FilterActionKind]?: Array<FilterActionsByKind[K]>;
};

export type Filter = {
	active: boolean;
	filterActions: Array<ApiFilterAction>;
	filterTests: Array<AllFiltersTest>;
	name: string;
};

export type FilterRules = [
	{
		filterRule?: Array<Filter>;
	}
];

export type GetFilterRulesResponse = {
	filterRules: FilterRules;
	_jsns: 'urn:zimbraMail';
};

export type MailFilterTag = {
	label: string;
	color?: number;
	rgb?: string;
};

export type MarkAsOption = {
	label: string;
	value: { actionFlag: [{ flagName: string }] };
};

type ActionFileInto = FilterActionsByKind['actionFileInto'];

type ActionRedirect = FilterActionsByKind['actionRedirect'];

type ActionFlag = FilterActionsByKind['actionFlag'];

type ActionTag = FilterActionsByKind['actionTag'];

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

export type FilterRedirect = CommonAction & {
	actionRedirect: [ActionRedirect];
};

export type FilterFlag = CommonAction & {
	actionFlag: [ActionFlag];
};

export type FilterFileInto = CommonAction & {
	actionFileInto: [ActionFileInto];
};

type FilterDiscard = CommonAction & {
	actionDiscard: [Record<string, never>];
};

export type FilterTag = CommonAction & {
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

export type FilterActions = Array<FilterAction>;
