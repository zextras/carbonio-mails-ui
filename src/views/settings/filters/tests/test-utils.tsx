/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Filter } from '../../../../types';

export function mockFilter({
	name,
	flagName = 'flagged',
	tagName = 'tag 1'
}: {
	name: string;
	flagName?: string;
	tagName?: string;
}): Filter {
	return {
		name,
		active: true,
		filterTests: [{ condition: 'anyof' }],
		filterActions: [
			{
				actionKeep: [{}],
				actionTag: [{ tagName }],
				actionFlag: [{ flagName }]
			}
		]
	};
}
