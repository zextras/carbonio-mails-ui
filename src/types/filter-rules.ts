/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
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
