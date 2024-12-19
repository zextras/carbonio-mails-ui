/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Row } from '@zextras/carbonio-design-system';

import { MarkAsOption } from '../../../../../types';
import CustomSelect from '../custom-select';
import { useTranslation } from 'react-i18next';
import { getMarkAsOptions } from '../utils';

type MarkAsProps = {
	onChange: (option: MarkAsOption) => void;
	selected: MarkAsOption;
};

export const MarkAs = ({ onChange, selected }: MarkAsProps): React.JSX.Element => {
	const [t] = useTranslation();
	const options = useMemo(() => getMarkAsOptions(t), [t]);
	const defaultSelection =
		selected.value.actionFlag[0].flagName === 'flagged' ? options[1] : options[0];
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
