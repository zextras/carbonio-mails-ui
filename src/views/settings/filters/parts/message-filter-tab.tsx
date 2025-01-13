/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, ReactNode } from 'react';

import { Container, List } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import FilterItem from './filter-item';
import LoadingShimmer from './loading-shimmer';
import Heading from '../../components/settings-heading';
// todo: remove listold
import { ListOld } from '../../list-old';

type MessageFilterProps = {
	children: ReactNode;
	availableList: any;
	activeList: any;
	loading: boolean;
};
export const MessageFilterTab: FC<MessageFilterProps> = ({
	children,
	availableList,
	activeList,
	loading
}): ReactElement => {
	const { t } = useTranslation();

	return (
		<Container crossAlignment="flex-start" mainAlignment="flex-start" orientation="horizontal">
			<Container width="43%" minHeight="30vh" mainAlignment="flex-start">
				<Heading title={t('filters.active_filters', 'Active Filters')} size="small" />
				<Container>
					{loading ? (
						<LoadingShimmer />
					) : (
						<ListOld
							items={activeList.list}
							selected={activeList.selected}
							ItemComponent={FilterItem}
							itemProps={{
								listProps: activeList,
								unSelect: availableList.unSelect
							}}
						/>
					)}
				</Container>
			</Container>
			<Container width="14%" padding={{ all: 'large' }} mainAlignment="space-between">
				{children}
			</Container>
			<Container width="43%" mainAlignment="flex-start">
				<Heading title={t('filters.available_filters', 'Available Filters')} size="small" />
				<Container>
					{loading ? (
						<LoadingShimmer />
					) : (
						<List
							items={availableList.list}
							selected={availableList.selected}
							ItemComponent={FilterItem}
							itemProps={{
								listProps: availableList,
								unSelect: activeList.unSelect
							}}
						/>
					)}
				</Container>
			</Container>
		</Container>
	);
};
