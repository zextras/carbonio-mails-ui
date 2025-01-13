/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, ReactNode } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { FilterList } from './filter-list';
import LoadingShimmer from './loading-shimmer';
import { FilterListType } from '../../../../types';
import Heading from '../../components/settings-heading';

type MessageFilterProps = {
	children: ReactNode;
	availableList: FilterListType;
	activeList: FilterListType;
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
						<FilterList
							filters={activeList.list}
							selected={activeList.selected}
							unSelect={availableList.unSelect}
							moveDown={activeList.moveDown}
							moveUp={activeList.moveUp}
							toggle={activeList.toggle}
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
						<FilterList
							filters={availableList.list}
							selected={availableList.selected}
							unSelect={activeList.unSelect}
							moveDown={availableList.moveDown}
							moveUp={availableList.moveUp}
							toggle={availableList.toggle}
						/>
					)}
				</Container>
			</Container>
		</Container>
	);
};
