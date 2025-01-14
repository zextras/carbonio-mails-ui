/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useMemo } from 'react';

import { map } from 'lodash';

import { ShowTag } from './show-tag';
import { getTags } from '../../../../../carbonio-ui-commons/store/zustand/tags';
import { FilterAction, FilterTag, MailFilterTag } from '../../../../../types';

type ActionTagComponentProps = {
	value: FilterTag;
	onChange: (filterValue: FilterAction) => void;
};
export const ActionTagComponent = ({
	value,
	onChange
}: ActionTagComponentProps): React.JSX.Element => {
	const tagOptions = useMemo(
		() =>
			map(getTags(), (item) => ({
				...item,
				label: item.name
			})),
		[]
	);
	const tag = useMemo(
		() => tagOptions.filter((option) => option.label === value.actionTag[0].tagName),
		[tagOptions, value.actionTag]
	);
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
