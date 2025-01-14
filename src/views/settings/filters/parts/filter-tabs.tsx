/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';

import { Container, Divider, Padding, TabBar, TabBarProps } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { IncomingFiltersTab } from './incoming-filters-tab';
import { OutgoingFiltersTab } from './outgoing-filters-tab';

const FilterTabs: FC = (): ReactElement => {
	const [selectedFilterType, setSelectedFilterType] = useState('incoming-messages');
	const tabs = useMemo(
		() => [
			{
				id: 'incoming-messages',
				label: t('filters.incoming_msg_filters', 'Incoming Message Filters')
			},
			{
				id: 'outgoing-messages',
				label: t('filters.outgoing_message_filters', 'Outgoing Message Filters')
			}
		],
		[]
	);
	const onChange = useCallback<TabBarProps['onChange']>((ev, selectedId) => {
		setSelectedFilterType(selectedId);
	}, []);

	return (
		<Container crossAlignment="baseline" padding={{ top: 'medium' }}>
			<TabBar
				background="gray5"
				items={tabs}
				selected={selectedFilterType}
				height="3.75rem"
				onChange={onChange}
			/>
			<Container crossAlignment="flex-start" padding={{ top: 'small' }}>
				{selectedFilterType === 'incoming-messages' && <IncomingFiltersTab />}
				{selectedFilterType === 'outgoing-messages' && <OutgoingFiltersTab />}
			</Container>

			<Padding top="medium" />
			<Divider />
		</Container>
	);
};

export default FilterTabs;
