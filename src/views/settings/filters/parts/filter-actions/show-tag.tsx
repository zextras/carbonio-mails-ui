/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { ChipInput, ChipItem, Row } from '@zextras/carbonio-design-system';

type ShowTagProps = {
	value: any;
	tagOptions: any[] | undefined;
	onTagChange: (chip: ChipItem[]) => void;
	onAddTag: (value: unknown) => ChipItem<unknown>;
};

export const ShowTag = ({
	value,
	tagOptions,
	onTagChange,
	onAddTag
}: ShowTagProps): React.JSX.Element => (
	<Row padding={{ right: 'small' }} minWidth="12.5rem">
		<ChipInput
			placeholder={t('label.tag', 'Tag')}
			background="gray4"
			defaultValue={[]}
			options={tagOptions}
			value={value}
			singleSelection
			onChange={onTagChange}
			onAdd={onAddTag}
			disableOptions={false}
			disabled
		/>
	</Row>
);
