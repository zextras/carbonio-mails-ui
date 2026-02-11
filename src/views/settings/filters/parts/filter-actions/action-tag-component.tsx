/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useMemo } from 'react';

import { getTags } from '@zextras/carbonio-ui-commons';
import { map } from 'lodash';

import { ShowTag } from 'views/settings/filters/parts/filter-actions/show-tag';
import { ActionComponentProps } from 'views/settings/filters/types';
import { FilterTag, MailFilterTag } from 'types/filters';

export const ActionTagComponent = ({
	value,
	onChange
}: ActionComponentProps<FilterTag>): React.JSX.Element => {
	const tagOptions = useMemo(
		() =>
			map(getTags(), (item) => ({
				...item,
				label: item.name
			})),
		[]
	);
	const { tagName } = value.actionTag[0];
	const tag = tagName
		? [
				{
					label: tagName
				}
			]
		: [];
	const onTagChange = useCallback(
		(chip: MailFilterTag[]) => {
			if (chip.length > 0) {
				const requiredTag = chip.length > 1 ? chip[1] : chip[0];
				onChange({
					actionTag: [{ tagName: requiredTag.label }]
				});
			} else {
				onChange({ actionTag: [{ tagName: '' }] });
			}
		},
		[onChange]
	);
	return (
		<ShowTag
			value={tag}
			tagOptions={tagOptions}
			onTagChange={onTagChange}
			data-testid={'tag-input'}
		/>
	);
};
