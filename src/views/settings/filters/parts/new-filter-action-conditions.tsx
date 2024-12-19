/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useMemo } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';

import { FilterActionRow } from './filter-action-row';
import { getTags } from '../../../../carbonio-ui-commons/store/zustand/tags';
import { CompProps } from '../../../../types';
import Heading from '../../components/settings-heading';

type ComponentProps = {
	compProps: CompProps;
};
const FilterActionConditions: FC<ComponentProps> = ({ compProps }): ReactElement => {
	const [t] = useTranslation();
	const { tempActions } = compProps;
	const tagOptions = useMemo(
		() =>
			map(getTags(), (item) => ({
				...item,
				label: item.name
			})),
		[]
	);

	return (
		<Container padding={{ top: 'medium' }} crossAlignment="flex-start" mainAlignment="flex-start">
			<Heading title={t('settings.actions', 'Actions')} size="medium" />
			<Text>{t('settings.perform_following_action', 'Perform the following actions:')}</Text>
			<Container padding={{ top: 'small' }} mainAlignment="flex-start">
				{map(tempActions, (tempAction, index: number) => (
					<FilterActionRow
						key={`filter-action-row-${index}`}
						index={index}
						defaultAction={tempAction}
						compProps={compProps}
						tagOptions={tagOptions}
					/>
				))}
			</Container>
		</Container>
	);
};

export default FilterActionConditions;
