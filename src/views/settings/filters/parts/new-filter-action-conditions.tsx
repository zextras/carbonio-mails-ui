/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useMemo } from 'react';

import { Container, Text, Icon, Row, Padding } from '@zextras/carbonio-design-system';
import { getTags } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import FilterActionRows from './filter-action-rows';
import { ZIMBRA_STANDARD_COLORS } from '../../../../carbonio-ui-commons/constants/utils';
import Heading from '../../components/settings-heading';

type ComponentProps = any;

const FilterActionConditions: FC<ComponentProps> = ({ compProps }): ReactElement => {
	const { t, tempActions } = compProps;
	const tagOptions = useMemo(
		() =>
			map(getTags(), (item) => ({
				...item,
				label: item.name,
				customComponent: (
					<Row>
						<Icon icon="Tag" color={ZIMBRA_STANDARD_COLORS[item.color ?? 0].hex} />
						<Padding left="small">
							<Text>{item.name}</Text>
						</Padding>
					</Row>
				)
			})),
		[]
	);

	return (
		<>
			<Container padding={{ top: 'medium' }} crossAlignment="flex-start" mainAlignment="flex-start">
				<Heading title={t('settings.actions', 'Actions')} size="medium" />
				<Text>{t('settings.perform_following_action', 'Perform the following actions:')}</Text>
				<Container padding={{ top: 'small' }} mainAlignment="flex-start">
					{map(tempActions, (tempAction, index: number) => (
						<FilterActionRows
							key={tempAction.id}
							index={index}
							tmpFilter={tempAction}
							compProps={compProps}
							tagOptions={tagOptions}
						/>
					))}
				</Container>
			</Container>
		</>
	);
};

export default FilterActionConditions;
