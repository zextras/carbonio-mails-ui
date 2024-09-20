/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { DropdownItem } from '@zextras/carbonio-design-system';
import { includes, reduce } from 'lodash';

import { UIActionAggregator } from '../types';
import { TagsDropdownItem } from '../ui-actions/tag-actions';

export const useTagDropdownItem = (
	applyTagDescriptor: UIActionAggregator,
	tags: Array<string>
): DropdownItem =>
	useMemo(
		() => ({
			id: applyTagDescriptor.id,
			icon: applyTagDescriptor.icon,
			label: applyTagDescriptor.label,
			items: reduce(
				applyTagDescriptor.items,
				(acc, descriptor) => {
					if (descriptor.canExecute()) {
						const item = {
							id: descriptor.id,
							label: descriptor.label,
							icon: descriptor.icon,
							keepOpen: true,
							customComponent: (
								<TagsDropdownItem
									checked={includes(tags, descriptor.id)}
									actionDescriptor={descriptor}
								/>
							)
						};
						acc.push(item);
					}
					return acc;
				},
				[] as DropdownItem[]
			),
			disabled: false
		}),
		[
			applyTagDescriptor.icon,
			applyTagDescriptor.id,
			applyTagDescriptor.items,
			applyTagDescriptor.label,
			tags
		]
	);
