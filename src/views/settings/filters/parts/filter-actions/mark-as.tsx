/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Row } from '@zextras/carbonio-design-system';

import CustomSelect from '../custom-select';

type MarkAsProps = {
	options: any[];
	onChange: (option: { label: string; value: any }) => void;
	selected: any;
};

export const MarkAs = ({ options, onChange, selected }: MarkAsProps): React.JSX.Element => (
	<Row padding={{ right: 'small' }} minWidth="12.5rem">
		<CustomSelect
			items={options}
			background="gray5"
			label=""
			onChange={onChange}
			defaultSelection={selected}
		/>
	</Row>
);
