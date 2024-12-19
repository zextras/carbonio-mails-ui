/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ChipProps } from '@zextras/carbonio-design-system';

export type FilterTest = Record<string, string | Array<any>>;

export type Filter = {
	active: boolean;
	filterActions: Array<any>;
	filterTests: Array<FilterTest>;
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

export type FilterListType = {
	active: boolean;
	filterActions: Array<any>;
	filterTests: Array<any>;
	id?: string;
	name: string;
};
export type ListPropsType = {
	isSelecting: boolean;
	list: Array<FilterListType>;
	moveDown: (arg: number) => void;
	moveUp: (arg: number) => void;
	selected: Record<string, boolean>;
	toggle: (arg: string) => void;
	unSelect: () => void;
};

export type FilterActions = {
	actionFileInto?: [
		{
			folderPath: string;
			index: string;
		}
	];
	actionRedirect?: [
		{
			a: string;
			index: string;
		}
	];
	actionFlag?: [
		{
			flagName: string;
			index: string;
		}
	];
	actionStop?: [
		{
			index?: string;
		}
	];
	actionTag?: [
		{
			index?: string;
			tagName: string | undefined;
		}
	];
	actionDiscard?: {
		index: string;
	};
	actionKeep?: [
		{
			index?: string;
		}
	];
};
export type MarkAsOption = {
	label: string;
	value: { actionFlag: { flagName: string }[] };
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
	actionStop?: [unknown];
	// Only here for MarkAs
	label?: string;
	value?: string;
};
type FilterKeep = {
	actionKeep: [unknown];
};
type FilterRedirect = {
	actionRedirect: [ActionRedirect];
};
type FilterFlag = {
	actionFlag: [ActionFlag];
};
type FilterFileInto = {
	actionFileInto: [ActionFileInto];
};
type FilterDiscard = {
	actionDiscard: [unknown];
};
type FilterTag = {
	actionTag: [ActionTag];
};

export type FilterAction = CommonAction &
	(FilterKeep | FilterRedirect | FilterTag | FilterFlag | FilterFileInto | FilterDiscard);

export type CompProps = {
	isIncoming: boolean;
	tempActions: Array<FilterAction>;
	setTempActions: (tempActions: Array<FilterAction>) => void;
	zimbraFeatureMailForwardingInFiltersEnabled: 'TRUE' | 'FALSE';
};
