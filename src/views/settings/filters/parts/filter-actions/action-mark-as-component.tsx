/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';
import { FilterFlag, MarkAsOption } from 'types/filters';

import { MarkAs } from 'views/settings/filters/parts/filter-actions/mark-as';
import { getMarkAsOptions } from 'views/settings/filters/parts/filter-actions/mark-as-utils';
import { ActionComponentProps } from 'views/settings/filters/types';

export const ActionMarkAsComponent = ({
	value,
	onChange
}: ActionComponentProps<FilterFlag>): React.JSX.Element => {
	const [t] = useTranslation();
	const markAsOptions = useMemo(() => getMarkAsOptions(t), [t]);

	const handleMarkAsOptionChange = useCallback(
		(receivedOptionValue: MarkAsOption['value']) => {
			onChange(receivedOptionValue);
		},
		[onChange]
	);
	return (
		<MarkAs
			selected={value.actionFlag[0]}
			options={markAsOptions}
			onChange={handleMarkAsOptionChange}
		/>
	);
};
