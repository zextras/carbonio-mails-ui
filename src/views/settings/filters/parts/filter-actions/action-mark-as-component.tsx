/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { MarkAs } from './mark-as';
import { getMarkAsOptions } from './mark-as-utils';
import { FilterFlag, MarkAsOption } from '../../../../../types';
import { ActionComponentProps } from '../../types';

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
