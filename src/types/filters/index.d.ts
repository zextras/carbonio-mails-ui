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
// FIXME: this type was introduced just to start understanding what this code is doing but it is clear it is trying to represent a code that does too many things
export type TempAction = {
	id?: string;
	a?: string;
	label?: string;
	value?: string;
	actionKeep?: Array<unknown>;
	actionStop?: Array<unknown>;
	actionRedirect?: Array<ActionRedirect>;
	actionFlag?: Array<ActionFlag>;
	actionTag?: Array<ActionTag>;
	actionFileInto?: Array<ActionFileInto>;
	actionDiscard?: Array<unknown>;
};
// TODO: refactor the code and remove me after I'm not anymore needed
export type CompProps = {
	isIncoming: boolean;
	tempActions: Array<TempAction>;
	setTempActions: (tempActions: Array<TempAction>) => void;
	zimbraFeatureMailForwardingInFiltersEnabled: 'TRUE' | 'FALSE';
};

type FilterKeep = {
	actionKeep: [object];
};
type FilterRedirect = {
	actionRedirect: [{ a?: string }];
};
type FilterFlag = {
	actionFlag: [{ flagName?: string }];
};
type FilterFileInto = {
	actionFileInto: [{ folderPath?: string }];
};
type FilterDiscard = {
	actionDiscard: [object];
};
type FilterTag = {
	actionTag: [{ tagName?: string }];
};

export type ActionOption =
	| FilterKeep
	| FilterRedirect
	| FilterTag
	| FilterFlag
	| FilterFileInto
	| FilterDiscard;
