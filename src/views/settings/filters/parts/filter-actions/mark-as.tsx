/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect } from 'react';

import { Row } from '@zextras/carbonio-design-system';

import { MarkAsOption } from '../../../../../types';
import CustomSelect from '../custom-select';

type MarkAsProps = {
	onChange: (option: MarkAsOption['value']) => void;
	options: MarkAsOption[];
	selected?: { flagName?: string };
};

export const MarkAs = ({ onChange, selected, options }: MarkAsProps): React.JSX.Element => {
	const defaultSelection = options.find(
		(option) => option.value.actionFlag[0].flagName === selected?.flagName
	);

	useEffect(() => {
		if (!defaultSelection) {
			options?.[0] && onChange(options[0].value);
		}
	});
	return (
		<Row padding={{ right: 'small' }} minWidth="12.5rem">
			<CustomSelect
				items={options}
				background="gray5"
				label=""
				onChange={onChange}
				defaultSelection={defaultSelection}
			/>
		</Row>
	);
};
