/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from '@testing-library/react';

import { makeListItemsVisible } from '@zextras/carbonio-ui-commons';
import { Filter } from '../../../../types';

export function mockFilter({
	name,
	active = true,
	flagName = 'flagged',
	tagName = 'tag 1'
}: {
	name: string;
	active?: boolean;
	flagName?: string;
	tagName?: string;
}): Filter {
	return {
		name,
		active,
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

export function makeAllItemsVisible(): void {
	makeListItemsVisible();
	act(() => {
		jest.advanceTimersByTime(1000);
	});
}
